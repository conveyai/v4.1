// pages/api/matters/[id]/title-searches.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";

const prisma = new PrismaClient();

const handler = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Check for authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tenantId = session.user.tenantId;
  const { id: matterId } = req.query;

  if (!matterId) {
    return res.status(400).json({ message: "Matter ID is required" });
  }

  try {
    // Verify the matter exists and belongs to this tenant
    const matter = await prisma.matter.findFirst({
      where: {
        id: matterId,
        tenantId
      }
    });

    if (!matter) {
      return res.status(404).json({ message: "Matter not found" });
    }

    // Get all title searches for this matter
    const titleSearches = await prisma.titleSearch.findMany({
      where: {
        matterId,
        tenantId
      },
      orderBy: {
        created_at: "desc"
      }
    });

    // Format the response
    const formattedSearches = titleSearches.map(search => ({
      id: search.id,
      orderId: search.orderId,
      folioIdentifier: search.folioIdentifier,
      productCode: search.productCode,
      status: search.status,
      document: search.document,
      createdAt: search.created_at
    }));

    return res.status(200).json(formattedSearches);
  } catch (error) {
    console.error("Error fetching title searches:", error);
    return res.status(500).json({ message: "Failed to fetch title searches" });
  }
};

export default withErrorHandling(handler);