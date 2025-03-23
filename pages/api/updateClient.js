import { PrismaClient } from "@prisma/client";
import { withProtectedApi } from "@/utils/authMiddleware";

const prisma = new PrismaClient();

const handler = async (req, res) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const tenantId = req.session.user.tenantId;
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: "Missing client ID" });
  }

  // First check if the client exists and belongs to this tenant
  const existingClient = await prisma.client.findFirst({
    where: {
      id,
      tenantId,
    },
  });

  if (!existingClient) {
    return res.status(404).json({ message: "Client not found or access denied" });
  }

  const { name, email, phone, property } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
  }

  // Check if updating to an email that already exists for another client
  if (email !== existingClient.email) {
    const emailExists = await prisma.client.findFirst({
      where: {
        tenantId,
        email,
        id: { not: id },
      },
    });

    if (emailExists) {
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
      property,
    },
  });

  return res.status(200).json(updatedClient);
};

export default withProtectedApi(handler);