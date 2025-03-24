// pages/api/lrs/check-status.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

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
  const { orderId } = req.query;

  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    // Find the title search record
    const titleSearch = await prisma.titleSearch.findFirst({
      where: {
        orderId,
        tenantId
      }
    });

    if (!titleSearch) {
      return res.status(404).json({ message: "Title search not found" });
    }

    // If already closed, return the existing document
    if (titleSearch.status === "Closed" && titleSearch.document) {
      return res.status(200).json({
        id: titleSearch.id,
        orderId,
        status: "Closed",
        document: titleSearch.document
      });
    }

    // Get new auth token to check status
    const clientId = process.env.LRS_CLIENT_ID;
    const authResponse = await fetch(`https://api.dev.hazdev.com.au/auth?client_id=${clientId}`);
    const authData = await authResponse.json();
    
    const tokenResponse = await fetch("https://api.dev.hazdev.com.au/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${clientId}:${process.env.LRS_CLIENT_SECRET}`).toString('base64')}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        "username": process.env.LRS_USERNAME,
        "code": authData.code,
        "client_id": clientId
      })
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Check status with LRS
    const statusResponse = await fetch(`https://api.dev.hazdev.com.au/req/lrs`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}.${clientId}`
      }
    });

    if (!statusResponse.ok) {
      return res.status(200).json({
        id: titleSearch.id,
        orderId,
        status: "In Progress",
        message: "Document is still being processed"
      });
    }

    const statusData = await statusResponse.json();
    const productDetail = statusData.productDetails?.find(p => p.orderId === orderId);

    if (!productDetail) {
      return res.status(200).json({
        id: titleSearch.id,
        orderId,
        status: "In Progress",
        message: "Document status unavailable"
      });
    }

    // Update the title search record if status has changed
    if (productDetail.status === "Closed" && productDetail.document) {
      await prisma.titleSearch.update({
        where: { id: titleSearch.id },
        data: {
          status: "Closed",
          document: productDetail.document,
          details: JSON.stringify(productDetail)
        }
      });

      return res.status(200).json({
        id: titleSearch.id,
        orderId,
        status: "Closed",
        document: productDetail.document
      });
    }

    // Still in progress
    return res.status(200).json({
      id: titleSearch.id,
      orderId,
      status: productDetail.status,
      message: productDetail.message || "Document is still being processed"
    });
  } catch (error) {
    console.error("Error checking title search status:", error);
    return res.status(500).json({ message: "Failed to check title search status" });
  }
};

export default withErrorHandling(handler);