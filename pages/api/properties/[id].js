// pages/api/properties/[id].js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

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

  // First, check if the property exists and belongs to this conveyancer
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

  // GET - Fetch a single property
  if (req.method === "GET") {
    try {
      // Property is already fetched above, just return it
      return res.status(200).json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      return res.status(500).json({ message: "Failed to fetch property" });
    }
  }
  
  // PUT - Update a property
  if (req.method === "PUT") {
    try {
      const { address, listing_price, status } = req.body;
      
      // Validate required fields
      if (!address || !status) {
        return res.status(400).json({ message: "Address and status are required" });
      }
      
      // Update the property
      const updatedProperty = await prisma.property.update({
        where: { id },
        data: {
          address,
          listing_price,
          status
        }
      });
      
      return res.status(200).json(updatedProperty);
    } catch (error) {
      console.error("Error updating property:", error);
      return res.status(500).json({ message: "Failed to update property" });
    }
  }
  
  // DELETE - Remove a property
  if (req.method === "DELETE") {
    try {
      // First check if there are any matters associated with this property
      const relatedMatters = await prisma.matter.findMany({
        where: {
          propertyId: id,
          tenantId
        }
      });
      
      if (relatedMatters.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete property with associated matters. Please remove the matters first." 
        });
      }
      
      // Delete the property
      await prisma.property.delete({
        where: { id }
      });
      
      return res.status(200).json({ message: "Property deleted successfully" });
    } catch (error) {
      console.error("Error deleting property:", error);
      return res.status(500).json({ message: "Failed to delete property" });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
};

export default withErrorHandling(handler);