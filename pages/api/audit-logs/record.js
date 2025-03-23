// pages/api/audit-logs/record.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const prisma = new PrismaClient();

/**
 * API handler for recording audit logs (POST)
 */
const handler = async (req, res) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Check for authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tenantId = session.user.tenantId;
  const userId = session.user.id;
  
  try {
    const { 
      matterId, 
      action, 
      details,
      previousState,
      newState
    } = req.body;

    // Validate required fields
    if (!matterId || !action) {
      return res.status(400).json({ message: "Matter ID and action are required" });
    }

    // Verify the matter exists and belongs to this tenant
    const matter = await prisma.matter.findFirst({
      where: {
        id: matterId,
        tenantId
      }
    });
    
    if (!matter) {
      return res.status(404).json({ message: "Matter not found" });
    }

    // Calculate differences if previous and new states are provided
    let changesDetail = details || {};
    
    if (previousState && newState) {
      changesDetail = {
        ...changesDetail,
        changes: calculateChanges(previousState, newState)
      };
    }

    // Create the audit log entry
    const auditLog = await prisma.matterAuditLog.create({
      data: {
        matterId,
        userId,
        tenantId,
        action,
        details: JSON.stringify(changesDetail),
        created_at: new Date()
      }
    });
    
    return res.status(201).json(auditLog);
  } catch (error) {
    console.error("Error recording audit log:", error);
    return res.status(500).json({ message: "Failed to record audit log" });
  }
};

/**
 * Helper function to calculate changes between previous and new state
 */
function calculateChanges(previousState, newState) {
  const changes = {};
  
  // Only track changes for fields we care about
  const trackableFields = [
    'type', 'date', 'settlement_date', 'amount', 'status', 
    'propertyId', 'buyerId', 'sellerId'
  ];
  
  for (const field of trackableFields) {
    if (previousState[field] !== newState[field]) {
      changes[field] = {
        from: previousState[field],
        to: newState[field]
      };
    }
  }
  
  return changes;
}

export default withErrorHandling(handler);