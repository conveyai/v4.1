// pages/api/verifyIdentity.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Get authenticated user's session
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tenantId = session.user.tenantId;
  const { clientId, documentURL } = req.body;

  if (!clientId) {
    return res.status(400).json({ message: "Missing client ID" });
  }

  // Verify the client belongs to this tenant
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      tenantId,
    },
  });

  if (!client) {
    return res.status(404).json({ message: "Client not found or access denied" });
  }

  // In a real application, we would call the VOI API here
  // For demonstration, we'll simulate a successful verification
  
  try {
    // Simulate API call with random delay to mimic network latency
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    // 10% chance of verification failure to simulate real-world scenarios
    if (Math.random() < 0.1) {
      throw new Error("Verification failed - document quality issue");
    }

    // Update client verification status
    await prisma.client.update({
      where: { id: clientId },
      data: { identity_verified: true },
    });

    return res.status(200).json({ 
      message: "Identity Verified Successfully",
      verified: true,
      clientId,
      verificationDate: new Date().toISOString()
    });
  } catch (verificationError) {
    console.error("Verification API error:", verificationError);
    return res.status(422).json({ 
      message: "Verification failed", 
      error: verificationError.message,
      verified: false
    });
  }
};

export default withErrorHandling(handler);