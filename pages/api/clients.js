// pages/api/clients.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

/**
 * API handler for client operations (GET, POST)
 */
const handler = async (req, res) => {
  // Check for authentication explicitly using getServerSession
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tenantId = session.user.tenantId;
  
  // GET - Fetch all clients for the tenant
  if (req.method === "GET") {
    try {
      console.log("Fetching clients for tenant:", tenantId); // For debugging
      
      const clients = await prisma.client.findMany({
        where: { tenantId },
        orderBy: { created_at: "desc" }
      });
      
      console.log(`Found ${clients.length} clients`); // For debugging
      
      return res.status(200).json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      return res.status(500).json({ message: "Failed to fetch clients" });
    }
  }
  
  // POST - Create a new client
  if (req.method === "POST") {
    try {
      const { name, email, phone, property } = req.body;
      
      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
      }
      
      // Check if a client with this email already exists
      const existingClient = await prisma.client.findFirst({
        where: {
          tenantId,
          email
        }
      });
      
      if (existingClient) {
        return res.status(409).json({ message: "A client with this email already exists" });
      }
      
      // Create the new client
      const newClient = await prisma.client.create({
        data: {
          tenantId,
          name,
          email,
          phone,
          property,
          identity_verified: false,
        }
      });
      
      return res.status(201).json(newClient);
    } catch (error) {
      console.error("Error creating client:", error);
      return res.status(500).json({ message: "Failed to create client" });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
};

export default withErrorHandling(handler);