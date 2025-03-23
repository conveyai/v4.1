// pages/api/matters/[id]/archive.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";

const prisma = new PrismaClient();

const handler = async (req, res) => {
  // Check for authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tenantId = session.user.tenantId;
  const conveyancerId = session.user.id;
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: "Matter ID is required" });
  }

  // Check if the matter exists and belongs to this conveyancer
  const matter = await prisma.matter.findFirst({
    where: {
      id,
      tenantId,
      conveyancerId // User can only archive their own matters
    }
  });
  
  if (!matter) {
    return res.status(404).json({ message: "Matter not found or you don't have permission to access it" });
  }

  // pages/api/matters/[id]/archive.js - updated with audit logging

// POST - Archive a matter
if (req.method === "POST") {
  try {
    // Validate that the matter can be archived
    // Only completed matters should be archived
    if (matter.status !== "Completed") {
      return res.status(400).json({ 
        message: "Only completed matters can be archived" 
      });
    }
    
    // Archive the matter
    const archivedMatter = await prisma.matter.update({
      where: { id },
      data: {
        archived_at: new Date()
      }
    });
    
    // Record the audit log
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/audit-logs/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.cookie // Forward auth cookies
        },
        body: JSON.stringify({
          matterId: id,
          action: 'ARCHIVED',
          details: {
            archived_at: archivedMatter.archived_at
          }
        })
      });
    } catch (auditError) {
      // Log but don't fail the request if audit logging fails
      console.error("Failed to record archive audit log:", auditError);
    }
    
    return res.status(200).json(archivedMatter);
  } catch (error) {
    console.error("Error archiving matter:", error);
    return res.status(500).json({ message: "Failed to archive matter" });
  }
}

// DELETE - Unarchive a matter
if (req.method === "DELETE") {
  try {
    // Unarchive the matter
    const unarchivedMatter = await prisma.matter.update({
      where: { id },
      data: {
        archived_at: null
      }
    });
    
    // Record the audit log
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/audit-logs/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.cookie // Forward auth cookies
        },
        body: JSON.stringify({
          matterId: id,
          action: 'UNARCHIVED',
          details: {
            unarchived_at: new Date()
          }
        })
      });
    } catch (auditError) {
      // Log but don't fail the request if audit logging fails
      console.error("Failed to record unarchive audit log:", auditError);
    }
    
    return res.status(200).json(unarchivedMatter);
  } catch (error) {
    console.error("Error unarchiving matter:", error);
    return res.status(500).json({ message: "Failed to unarchive matter" });
  }
}
  
  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
};

export default withErrorHandling(handler);