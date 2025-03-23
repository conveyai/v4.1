// pages/api/auth/reset-password-complete.js
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/utils/password";
import { withErrorHandling } from "@/utils/authMiddleware";

const prisma = new PrismaClient();

/**
 * API handler for completing password reset process
 */
const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    // Validate password
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Find the password reset record
    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        token,
        expires: {
          gt: new Date()  // Token has not expired
        }
      }
    });

    if (!passwordReset) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update the user's password
    await prisma.conveyancer.update({
      where: {
        id: passwordReset.conveyancerId
      },
      data: {
        password_hash: hashedPassword
      }
    });

    // Delete the used reset token
    await prisma.passwordReset.delete({
      where: {
        id: passwordReset.id
      }
    });

    // Return success
    return res.status(200).json({
      message: "Password has been reset successfully"
    });
  } catch (error) {
    console.error("Password reset completion error:", error);
    return res.status(500).json({ message: "An error occurred while resetting your password" });
  }
};

export default withErrorHandling(handler);