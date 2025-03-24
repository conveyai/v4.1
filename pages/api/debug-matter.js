// pages/api/debug-matter.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

const handler = async (req, res) => {
  // Ensure this is only accessible in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: "Not found" });
  }

  // Check for authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: "Matter ID is required" });
  }

  try {
    // Get the matter with all associated data
    const matter = await prisma.matter.findUnique({
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
        }
      }
    });

    if (!matter) {
      return res.status(404).json({ message: "Matter not found" });
    }

    return res.status(200).json({
      matter,
      // Add additional debugging info
      debugInfo: {
        propertyExists: Boolean(matter.property),
        buyerExists: Boolean(matter.buyer),
        sellerExists: Boolean(matter.seller),
        propertyId: matter.propertyId,
        buyerId: matter.buyerId,
        sellerId: matter.sellerId
      }
    });
  } catch (error) {
    console.error("Error fetching matter details:", error);
    return res.status(500).json({ message: "Failed to fetch matter details", error: error.message });
  }
};

export default withErrorHandling(handler);