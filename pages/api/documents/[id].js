// pages/api/documents/[id].js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const handler = async (req, res) => {
  // Only allow DELETE method
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Get authenticated user's session
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tenantId = session.user.tenantId;
  const conveyancerId = session.user.id;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: "Document ID is required" });
  }

  try {
    // Find the document to ensure it exists and belongs to this user
    const document = await prisma.document.findFirst({
      where: {
        id,
        tenantId,
        conveyancerId
      },
      include: {
        matter: true
      }
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found or you don't have permission to delete it" });
    }

    // Get the actual file path on the server
    const filePath = path.join(
      process.cwd(),
      document.file_path.replace(/^\/uploads/, 'uploads')
    );

    // Delete the file if it exists
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error("Error deleting file:", fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete the document from the database
    await prisma.document.delete({
      where: { id }
    });

    return res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return res.status(500).json({ message: "Failed to delete document" });
  }
};

export default withErrorHandling(handler);