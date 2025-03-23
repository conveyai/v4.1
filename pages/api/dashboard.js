// pages/api/dashboard.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

/**
 * API handler for dashboard statistics
 */
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
  const conveyancerId = session.user.id;
  
  try {
    // Get total matters count - filtered by conveyancer
    const mattersCount = await prisma.matter.count({
      where: {
        tenantId,
        conveyancerId, // Ensure conveyancer only sees their matters
        archived_at: null, // Only non-archived matters
      },
    });
    
    // Get pending matters count - filtered by conveyancer
    const pendingMattersCount = await prisma.matter.count({
      where: {
        tenantId,
        conveyancerId, // Ensure conveyancer only sees their matters
        status: "Pending",
        archived_at: null,
      },
    });
    
    // Get completed matters count - filtered by conveyancer
    const completedMattersCount = await prisma.matter.count({
      where: {
        tenantId,
        conveyancerId, // Ensure conveyancer only sees their matters
        status: "Completed",
      },
    });
    
    // Get clients count - show all clients in the tenant
    // (Usually clients are shared across conveyancers)
    const clientsCount = await prisma.client.count({
      where: {
        tenantId,
      },
    });
    
    // Get recent matters (last 5) - filtered by conveyancer
    const recentMatters = await prisma.matter.findMany({
      where: {
        tenantId,
        conveyancerId, // Ensure conveyancer only sees their matters
        archived_at: null,
      },
      include: {
        property: true,
        buyer: true,
        seller: true,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 5,
    });
    
    // Format dates for frontend display
    const formattedRecentMatters = recentMatters.map(matter => ({
      ...matter,
      date: new Date(matter.date).toISOString().split('T')[0],
      created_at: new Date(matter.created_at).toISOString(),
    }));
    
    return res.status(200).json({
      stats: {
        totalMatters: mattersCount,
        pendingMatters: pendingMattersCount,
        completedMatters: completedMattersCount,
        totalClients: clientsCount,
      },
      recentMatters: formattedRecentMatters,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
};

export default withErrorHandling(handler);