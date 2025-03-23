// pages/api/matters/[id]/audit-logs.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";

const prisma = new PrismaClient();

/**
 * API handler for matter audit logs (GET)
 */
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

  // Verify the matter exists and belongs to this conveyancer
  const matter = await prisma.matter.findFirst({
    where: {
      id,
      tenantId,
      conveyancerId // This ensures the user can only access their own matters
    }
  });
  
  if (!matter) {
    return res.status(404).json({ message: "Matter not found or you don't have permission to access it" });
  }

  // GET - Fetch audit logs for this matter
  if (req.method === "GET") {
    try {
      const auditLogs = await prisma.matterAuditLog.findMany({
        where: { matterId: id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          created_at: "desc"
        }
      });
      
      return res.status(200).json(auditLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      return res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
};

export default withErrorHandling(handler);