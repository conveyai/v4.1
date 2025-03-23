// pages/api/clients/[id].js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

const handler = async (req, res) => {
  // Since we can't use withProtectedApi, manually check for authentication
  const session = await getServerSession(req, res);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tenantId = session.user.tenantId;
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: "Client ID is required" });
  }

  // GET - Fetch a specific client
  if (req.method === "GET") {
    try {
      const client = await prisma.client.findFirst({
        where: {
          id,
          tenantId
        }
      });
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      return res.status(200).json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      return res.status(500).json({ message: "Failed to fetch client" });
    }
  }
  
  // PUT - Update a client
  if (req.method === "PUT") {
    try {
      const { name, email, phone, property } = req.body;
      
      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
      }
      
      // Check if the client exists and belongs to this tenant
      const client = await prisma.client.findFirst({
        where: {
          id,
          tenantId
        }
      });
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Check if updating to an email that already exists
      if (email !== client.email) {
        const existingClient = await prisma.client.findFirst({
          where: {
            tenantId,
            email,
            id: { not: id }
          }
        });
        
        if (existingClient) {
          return res.status(409).json({ message: "Another client with this email already exists" });
        }
      }
      
      // Update the client
      const updatedClient = await prisma.client.update({
        where: { id },
        data: {
          name,
          email,
          phone,
          property
        }
      });
      
      return res.status(200).json(updatedClient);
    } catch (error) {
      console.error("Error updating client:", error);
      return res.status(500).json({ message: "Failed to update client" });
    }
  }
  
  // DELETE - Remove a client
  if (req.method === "DELETE") {
    try {
      // Verify the client exists and belongs to this tenant
      const client = await prisma.client.findFirst({
        where: {
          id,
          tenantId
        }
      });
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Delete the client
      await prisma.client.delete({
        where: { id }
      });
      
      return res.status(200).json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error("Error deleting client:", error);
      return res.status(500).json({ message: "Failed to delete client" });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
};

export default withErrorHandling(handler);