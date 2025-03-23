// pages/api/properties.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

/**
 * API handler for properties operations (GET, POST)
 */
const handler = async (req, res) => {
  // Check for authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tenantId = session.user.tenantId;
  const conveyancerId = session.user.id;
  
  // GET - Fetch all properties for the specific conveyancer
  if (req.method === "GET") {
    try {
      const properties = await prisma.property.findMany({
        where: { 
          tenantId,
          conveyancerId // Filter by conveyancer to ensure user-level isolation
        },
        orderBy: { created_at: "desc" }
      });
      
      return res.status(200).json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      return res.status(500).json({ message: "Failed to fetch properties" });
    }
  }
  
  // POST - Create a new property
  if (req.method === "POST") {
    try {
      const { address, status, listing_price } = req.body;
      
      // Validate required fields
      if (!address || !status) {
        return res.status(400).json({ message: "Address and status are required" });
      }
      
      // Create the property with conveyancerId
      const newProperty = await prisma.property.create({
        data: {
          tenantId,
          conveyancerId, // Associate with the current user
          address,
          status,
          listing_price: listing_price ? parseFloat(listing_price) : null
        }
      });
      
      return res.status(201).json(newProperty);
    } catch (error) {
      console.error("Error creating property:", error);
      return res.status(500).json({ message: "Failed to create property" });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
};

export default withErrorHandling(handler);