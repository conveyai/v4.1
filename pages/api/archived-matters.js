// pages/api/archived-matters.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

/**
 * API handler for archived matters operations (GET)
 */
const handler = async (req, res) => {
  // Check for authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tenantId = session.user.tenantId;
  const conveyancerId = session.user.id;
  
  // GET - Fetch all archived matters for the tenant/conveyancer
  if (req.method === "GET") {
    try {
      // Base query conditions
      const whereCondition = {
        tenantId,
        conveyancerId,
        archived_at: { not: null }  // Only archived matters
      };
      
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
          archived_at: "desc"  // Most recently archived first
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
      
      return res.status(200).json(formattedMatters);
    } catch (error) {
      console.error("Error fetching archived matters:", error);
      return res.status(500).json({ message: "Failed to fetch archived matters" });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
};

export default withErrorHandling(handler);