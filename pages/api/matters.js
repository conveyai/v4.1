// pages/api/matters.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

/**
 * API handler for matter operations (GET, POST)
 */
const handler = async (req, res) => {
  // Check for authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tenantId = session.user.tenantId;
  const conveyancerId = session.user.id;
  
  // GET - Fetch all matters for the specific conveyancer
  if (req.method === "GET") {
    try {
      // Check if we should include archived matters
      const showArchived = req.query.archived === 'true';
      
      // Base query conditions - ALWAYS filter by both tenant and conveyancer
      const whereCondition = {
        tenantId,
        conveyancerId // This ensures a user can only see their own matters
      };
      
      // Add archived filter condition
      if (showArchived) {
        // Only show archived matters
        whereCondition.archived_at = { not: null };
      } else {
        // Only show non-archived matters
        whereCondition.archived_at = null;
      }
      
      const matters = await prisma.matter.findMany({
        where: whereCondition,
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
        },
        orderBy: {
          created_at: "desc"
        }
      });
      
      // Format dates for frontend display
      const formattedMatters = matters.map(matter => ({
        ...matter,
        date: new Date(matter.date).toISOString().split('T')[0],
        settlement_date: matter.settlement_date ? new Date(matter.settlement_date).toISOString().split('T')[0] : null,
        created_at: new Date(matter.created_at).toISOString(),
        archived_at: matter.archived_at ? new Date(matter.archived_at).toISOString() : null
      }));
      
      console.log(`Fetched ${formattedMatters.length} matters for conveyancer ${conveyancerId}`);
      
      return res.status(200).json(formattedMatters);
    } catch (error) {
      console.error("Error fetching matters:", error);
      return res.status(500).json({ message: "Failed to fetch matters" });
    }
  }
  
  // POST - Create a new matter
  if (req.method === "POST") {
    try {
      const { propertyId, type, date, settlement_date, buyerId, sellerId, amount, status } = req.body;

      // Validate required fields
      if (!propertyId || !type || !date || !amount) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Validate property exists and belongs to tenant
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

      // Create the matter - always associated with current conveyancer
      const newMatter = await prisma.matter.create({
        data: {
          tenantId,
          conveyancerId, // This ensures the matter is associated with the current user
          propertyId,
          type,
          date: new Date(date),
          settlement_date: settlement_date ? new Date(settlement_date) : null,
          buyerId: buyerId || null,
          sellerId: sellerId || null,
          amount: parseFloat(amount),
          status: status || "Pending",
          archived_at: null // Ensure new matters are not archived
        },
        include: {
          property: true,
          buyer: true,
          seller: true
        }
      });

      // Format dates for response
      const formattedMatter = {
        ...newMatter,
        date: new Date(newMatter.date).toISOString().split('T')[0],
        settlement_date: newMatter.settlement_date ? new Date(newMatter.settlement_date).toISOString().split('T')[0] : null,
        created_at: new Date(newMatter.created_at).toISOString(),
        archived_at: null
      };

      return res.status(201).json(formattedMatter);
    } catch (error) {
      console.error("Error creating matter:", error);
      return res.status(500).json({ message: "Failed to create matter" });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
};

export default withErrorHandling(handler);