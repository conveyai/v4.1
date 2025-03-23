// pages/api/debug.js
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

/**
 * API route for debugging database connection and auth issues
 * This is for development use only and should be removed in production
 */
const handler = async (req, res) => {
  try {
    // Get session info
    const session = await getServerSession(req, res, authOptions);
    
    const debugInfo = {
      session: session ? {
        user: {
          id: session.user.id,
          email: session.user.email,
          tenantId: session.user.tenantId,
        },
        expires: session.expires
      } : null,
      database: null,
      timestamp: new Date().toISOString()
    };
    
    // Test database connection
    try {
      // Try to query a small amount of data
      if (session) {
        const tenantId = session.user.tenantId;
        
        // Test client connection
        const clientsCount = await prisma.client.count({
          where: { tenantId }
        });
        
        // Test matter connection
        const mattersCount = await prisma.matter.count({
          where: { tenantId }
        });
        
        // Test property connection
        const propertiesCount = await prisma.property.count({
          where: { tenantId }
        });
        
        debugInfo.database = {
          connected: true,
          counts: {
            clients: clientsCount,
            matters: mattersCount,
            properties: propertiesCount
          }
        };
      } else {
        // Just test if we can connect at all
        await prisma.$queryRaw`SELECT 1`;
        debugInfo.database = {
          connected: true,
          note: "No session available, limited database testing performed"
        };
      }
    } catch (dbError) {
      debugInfo.database = {
        connected: false,
        error: dbError.message
      };
    }
    
    // Return debug info
    return res.status(200).json(debugInfo);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export default handler;