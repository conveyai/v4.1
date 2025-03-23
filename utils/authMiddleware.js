// utils/authMiddleware.js
import { getServerSession } from "next-auth/next";

// Create a simplified version of authOptions for middleware
// This avoids the circular import problem
const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          name: token.name,
          email: token.email,
          tenantId: token.tenantId,
          tenantName: token.tenantName
        };
      }
      return session;
    },
  },
};

/**
 * Middleware function to protect API routes with authentication
 * @param {Function} handler - The API route handler function
 * @returns {Function} - The wrapped handler function with authentication
 */
export function withAuth(handler) {
  return async (req, res) => {
    // Check for valid session
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Add session info to req object for use in the handler
    req.session = session;
    
    // Call the original handler
    return handler(req, res);
  };
}

/**
 * Middleware function to ensure tenant-specific data access
 * Combined with authentication check
 * @param {Function} handler - The API route handler function
 * @returns {Function} - The wrapped handler function with tenant validation
 */
export function withTenantAuth(handler) {
  return withAuth(async (req, res) => {
    const { tenantId } = req.query;
    
    // If a specific tenantId is provided in the URL, verify it matches the session
    if (tenantId && tenantId !== req.session.user.tenantId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Call the original handler
    return handler(req, res);
  });
}

/**
 * Error handling middleware for API routes
 * @param {Function} handler - The API route handler function
 * @returns {Function} - The wrapped handler function with error handling
 */
export function withErrorHandling(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      console.error(`API Error [${req.method} ${req.url}]:`, error);
      
      // Handle specific known errors
      if (error.code === 'P2025') {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      if (error.code === 'P2002') {
        return res.status(409).json({ message: "Resource already exists" });
      }
      
      // Generic error response
      return res.status(500).json({ 
        message: "Internal server error",
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  };
}

/**
 * Combined middleware for protected API routes with error handling
 * @param {Function} handler - The API route handler function
 * @returns {Function} - The fully wrapped handler function
 */
export function withProtectedApi(handler) {
  return withErrorHandling(withAuth(handler));
}