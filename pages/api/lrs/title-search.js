// pages/api/lrs/title-search.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const prisma = new PrismaClient();

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Check for authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tenantId = session.user.tenantId;
  const { matterId, folioIdentifier, productCode } = req.body;

  if (!matterId || !folioIdentifier) {
    return res.status(400).json({ message: "Matter ID and folio identifier are required" });
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

    // Generate a unique order ID
    const orderId = `MAT${matterId.substring(0, 6)}-${Date.now()}`;

    // Step 1: Get authorization code
    const clientId = process.env.LRS_CLIENT_ID;
    const authResponse = await fetch(`https://api.dev.hazdev.com.au/auth?client_id=${clientId}`);
    
    if (!authResponse.ok) {
      return res.status(500).json({ message: "Failed to get authorization from LRS" });
    }
    
    const authData = await authResponse.json();
    const authCode = authData.code;

    // Step 2: Get OAuth token
    const tokenResponse = await fetch("https://api.dev.hazdev.com.au/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${clientId}:${process.env.LRS_CLIENT_SECRET}`).toString('base64')}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        "username": process.env.LRS_USERNAME,
        "code": authCode,
        "client_id": clientId
      })
    });

    if (!tokenResponse.ok) {
      return res.status(500).json({ message: "Failed to get access token from LRS" });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 3: Make the title search request
    const searchResponse = await fetch("https://api.dev.hazdev.com.au/req/lrs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}.${clientId}`
      },
      body: JSON.stringify({
        "orderId": orderId,
        "productCode": productCode || "LRSTLS",
        "folioIdentifier": folioIdentifier
      })
    });

    if (!searchResponse.ok) {
      return res.status(500).json({ message: "Failed to perform title search" });
    }

    const searchData = await searchResponse.json();

    if (searchData.status === "ERROR") {
      return res.status(400).json({ message: searchData.errorReason || "LRS search error" });
    }

    // Save the search to the database
    const titleSearch = await prisma.titleSearch.create({
      data: {
        matterId,
        tenantId,
        orderId,
        folioIdentifier,
        productCode: productCode || "LRSTLS",
        status: searchData.productDetails[0].status,
        document: searchData.productDetails[0].document || null,
        details: JSON.stringify(searchData.productDetails[0])
      }
    });

    return res.status(200).json({
      id: titleSearch.id,
      orderId,
      status: searchData.productDetails[0].status,
      document: searchData.productDetails[0].document || null,
      message: searchData.productDetails[0].message || "Title search initiated"
    });
  } catch (error) {
    console.error("Title search error:", error);
    return res.status(500).json({ message: "Failed to perform title search" });
  }
};

export default withErrorHandling(handler);