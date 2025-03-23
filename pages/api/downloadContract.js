// pages/api/downloadContract.js
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

// Create contracts directory if it doesn't exist
const CONTRACTS_DIR = path.join(process.cwd(), "uploads", "contracts");
if (!fs.existsSync(CONTRACTS_DIR)) {
  fs.mkdirSync(CONTRACTS_DIR, { recursive: true });
}

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

  // Verify the matter belongs to this conveyancer
  const matter = await prisma.matter.findFirst({
    where: {
      id: matterId,
      tenantId,
      conveyancerId,
    },
    include: {
      property: true,
    },
  });

  if (!matter) {
    return res.status(404).json({ message: "Matter not found" });
  }

  try {
    // Create tenant and matter-specific directory
    const tenantDir = path.join(CONTRACTS_DIR, tenantId);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }
    
    const matterDir = path.join(tenantDir, matterId);
    if (!fs.existsSync(matterDir)) {
      fs.mkdirSync(matterDir, { recursive: true });
    }
    
    // Create a simple contract file (in a real app, you'd generate a proper PDF)
    const fileName = `Contract_${matter.id}_v1.pdf`;
    const filePath = path.join(matterDir, fileName);
    
    // Create mock content
    const mockContent = `
      CONTRACT OF SALE
      Property: ${matter.property.address}
      Type: ${matter.type}
      Amount: $${matter.amount.toLocaleString()}
      Date: ${new Date(matter.date).toLocaleDateString()}
      
      This is a mock contract for demonstration purposes.
    `;
    
    // Write the file
    fs.writeFileSync(filePath, mockContent);
    
    // Generate a URL path that can be used to serve the file
    const fileUrl = `/uploads/contracts/${tenantId}/${matterId}/${fileName}`;
    
    // Create contract record in the database
    const newContract = await prisma.contract.create({
      data: {
        matterId,
        file_path: fileUrl,
        version: 1,
      },
    });
    
    return res.status(200).json(newContract);
  } catch (error) {
    console.error("Error generating contract:", error);
    return res.status(500).json({ message: "Failed to generate contract" });
  }
};

export default withErrorHandling(handler);