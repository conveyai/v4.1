// pages/api/auth/error-handler.js
import { withErrorHandling } from "@/utils/authMiddleware";

/**
 * API handler for authentication error logging
 * This is separate from the error page component in pages/auth/error.js
 */
const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { error, source } = req.body;
    
    // Log the auth error for monitoring purposes
    console.error(`Auth Error [${source}]:`, error);
    
    // Here you could add additional error logging to a service
    // like Sentry, DataDog, etc.
    
    return res.status(200).json({ message: "Error logged successfully" });
  } catch (err) {
    console.error("Error handling auth error:", err);
    return res.status(500).json({ message: "Failed to process error" });
  }
};

export default withErrorHandling(handler);