// pages/api/properties/[id]/matters.js
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
    return res.status(400).json({ message: "Property ID is required" });
  }

  // GET - Fetch all matters related to a specific property
  if (req.method === "GET") {
    try {
      // First verify the property exists and belongs to this conveyancer
      const property = await prisma.property.findFirst({
        where: {
          id,
          tenantId,
          conveyancerId // Ensure user can only access their own properties
        }
      });

      if (!property) {
        return res.status(404).json({ message: "Property not found or you don't have permission to access it" });
      }

      // Get all matters related to this property
      const matters = await prisma.matter.findMany({
        where: {
          tenantId,
          conveyancerId, // Ensure user can only see their own matters
          propertyId: id
        },
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          documents: {
            orderBy: {
              uploaded_at: "desc"
            }
          }
        },
        orderBy: {
          date: "desc"
        }
      });

      // Format dates and numbers for frontend display
      const formattedMatters = matters.map(matter => ({
        ...matter,
        date: new Date(matter.date).toISOString().split('T')[0],
        created_at: new Date(matter.created_at).toISOString()
      }));

      return res.status(200).json(formattedMatters);
    } catch (error) {
      console.error("Error fetching property matters:", error);
      return res.status(500).json({ message: "Failed to fetch property matters" });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
};

export default withErrorHandling(handler);