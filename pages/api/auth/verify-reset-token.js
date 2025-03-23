// pages/api/auth/verify-reset-token.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";

const prisma = new PrismaClient();

/**
 * API handler for verifying password reset token
 */
const handler = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ 
        valid: false,
        message: "Reset token is required" 
      });
    }

    // Find the password reset record
    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        token,
        expires: {
          gt: new Date()  // Token has not expired
        }
      },
      include: {
        conveyancer: true
      }
    });

    if (!passwordReset) {
      return res.status(400).json({ 
        valid: false,
        message: "Invalid or expired reset token" 
      });
    }

    // Token is valid
    return res.status(200).json({
      valid: true,
      message: "Token is valid",
      // Only include minimal user info for security
      email: passwordReset.conveyancer.email
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({ 
      valid: false,
      message: "An error occurred while verifying the token" 
    });
  }
};

export default withErrorHandling(handler);