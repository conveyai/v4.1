// pages/api/matters/[id].js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const prisma = new PrismaClient();

/**
 * API handler for single matter operations (GET, PUT, DELETE)
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

  // For all operations, first verify the matter exists and belongs to this conveyancer
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

  // GET - Fetch matter details
  if (req.method === "GET") {
    try {
      const matterDetails = await prisma.matter.findUnique({
        where: { id },
        include: {
          property: true,
          buyer: true,
          seller: true,
          conveyancer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          documents: {
            orderBy: {
              uploaded_at: "desc"
            }
          },
          contracts: {
            orderBy: {
              version: "desc"
            }
          }
        }
      });

      // Format dates for frontend display
      const formattedMatter = {
        ...matterDetails,
        date: new Date(matterDetails.date).toISOString().split('T')[0],
        settlement_date: matterDetails.settlement_date ? new Date(matterDetails.settlement_date).toISOString().split('T')[0] : null,
        created_at: new Date(matterDetails.created_at).toISOString(),
        archived_at: matterDetails.archived_at ? new Date(matterDetails.archived_at).toISOString() : null
      };
      
      return res.status(200).json(formattedMatter);
    } catch (error) {
      console.error("Error fetching matter details:", error);
      return res.status(500).json({ message: "Failed to fetch matter details" });
    }
  }
  
  // Updated PUT handler with audit logging
// This should replace the existing PUT method in pages/api/matters/[id].js

  // PUT - Update matter
  if (req.method === "PUT") {
    try {
      const { 
        propertyId, 
        type, 
        date, 
        settlement_date, 
        buyerId, 
        sellerId, 
        amount, 
        status 
      } = req.body;

      // Validate required fields
      if (!propertyId || !type || !date || !amount) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Validate property belongs to tenant
      const property = await prisma.property.findFirst({
        where: {
          id: propertyId,
          tenantId
        }
      });

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Validate buyer if provided
      if (buyerId) {
        const buyer = await prisma.client.findFirst({
          where: {
            id: buyerId,
            tenantId
          }
        });

        if (!buyer) {
          return res.status(404).json({ message: "Buyer not found" });
        }
      }

      // Validate seller if provided
      if (sellerId) {
        const seller = await prisma.client.findFirst({
          where: {
            id: sellerId,
            tenantId
          }
        });

        if (!seller) {
          return res.status(404).json({ message: "Seller not found" });
        }
      }
      
      // Store previous state for audit log
      const previousState = await prisma.matter.findUnique({
        where: { id },
        select: {
          type: true,
          date: true,
          settlement_date: true,
          amount: true,
          status: true,
          propertyId: true,
          buyerId: true,
          sellerId: true
        }
      });

      // Prepare new state for audit comparison
      const newState = {
        type,
        date: new Date(date),
        settlement_date: settlement_date ? new Date(settlement_date) : null,
        amount: parseFloat(amount),
        status,
        propertyId,
        buyerId: buyerId || null,
        sellerId: sellerId || null
      };

      // Update the matter
      const updatedMatter = await prisma.matter.update({
        where: { id },
        data: newState,
        include: {
          property: true,
          buyer: true,
          seller: true
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
            action: 'UPDATED',
            previousState,
            newState
          })
        });
      } catch (auditError) {
        // Log but don't fail the request if audit logging fails
        console.error("Failed to record audit log:", auditError);
      }

      // Format dates for response
      const formattedMatter = {
        ...updatedMatter,
        date: new Date(updatedMatter.date).toISOString().split('T')[0],
        settlement_date: updatedMatter.settlement_date ? new Date(updatedMatter.settlement_date).toISOString().split('T')[0] : null,
        created_at: new Date(updatedMatter.created_at).toISOString(),
        archived_at: updatedMatter.archived_at ? new Date(updatedMatter.archived_at).toISOString() : null
      };

      return res.status(200).json(formattedMatter);
    } catch (error) {
      console.error("Error updating matter:", error);
      return res.status(500).json({ message: "Failed to update matter" });
    }
  }
  
  // DELETE - Remove matter
  if (req.method === "DELETE") {
    try {
      // Check if there are related records that need to be handled first
      const documents = await prisma.document.count({
        where: { matterId: id }
      });
      
      const contracts = await prisma.contract.count({
        where: { matterId: id }
      });
      
      if (documents > 0 || contracts > 0) {
        return res.status(400).json({ 
          message: "Cannot delete matter with associated documents or contracts. Please remove these first." 
        });
      }
      
      // Delete the matter
      await prisma.matter.delete({
        where: { id }
      });
      
      return res.status(200).json({ message: "Matter deleted successfully" });
    } catch (error) {
      console.error("Error deleting matter:", error);
      return res.status(500).json({ message: "Failed to delete matter" });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
};

export default withErrorHandling(handler);