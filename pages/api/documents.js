// pages/api/documents.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

/**
 * API handler for document operations (GET)
 */
const handler = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Get authenticated user's session
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { matterId } = req.query;
  const tenantId = session.user.tenantId;
  const conveyancerId = session.user.id;

  if (!matterId) {
    return res.status(400).json({ message: "Missing matter ID" });
  }

  try {
    // First verify that the matter belongs to this conveyancer
    const matter = await prisma.matter.findFirst({
      where: {
        id: matterId,
        tenantId,
        conveyancerId // Ensure conveyancer can only see their own matters
      }
    });

    if (!matter) {
      return res.status(404).json({ message: "Matter not found or you don't have permission to access it" });
    }

    // Get the documents
    const documents = await prisma.document.findMany({
      where: { 
        matterId,
        tenantId,
      },
      orderBy: {
        uploaded_at: "desc"
      }
    });

    // Format dates for frontend display
    const formattedDocuments = documents.map(doc => ({
      ...doc,
      uploaded_at: new Date(doc.uploaded_at).toISOString(),
    }));

    return res.status(200).json(formattedDocuments);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return res.status(500).json({ message: "Failed to fetch documents" });
  }
};

export default withErrorHandling(handler);