// pages/api/auth/reset-password.js
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { withErrorHandling } from "@/utils/authMiddleware";

const prisma = new PrismaClient();

/**
 * API handler for initiating password reset
 */
const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { email, tenantDomain } = req.body;

    // Validate required fields
    if (!email || !tenantDomain) {
      return res.status(400).json({ message: "Email and tenant domain are required" });
    }

    // Find the tenant by domain
    const tenant = await prisma.tenant.findUnique({
      where: { domain: tenantDomain }
    });

    if (!tenant) {
      // Return a generic message to prevent user enumeration
      return res.status(200).json({ message: "If your email exists in our system, you will receive reset instructions" });
    }

    // Find the conveyancer by email and tenant ID
    const conveyancer = await prisma.conveyancer.findFirst({
      where: {
        email,
        tenantId: tenant.id
      }
    });

    if (!conveyancer) {
      // Return a generic message to prevent user enumeration
      return res.status(200).json({ message: "If your email exists in our system, you will receive reset instructions" });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // First try to find an existing reset token
    const existingReset = await prisma.passwordReset.findFirst({
      where: { conveyancerId: conveyancer.id }
    });

    // Either update existing record or create a new one
    if (existingReset) {
      await prisma.passwordReset.update({
        where: { id: existingReset.id },
        data: {
          token: resetToken,
          expires: resetTokenExpiry
        }
      });
    } else {
      await prisma.passwordReset.create({
        data: {
          conveyancerId: conveyancer.id,
          token: resetToken,
          expires: resetTokenExpiry
        }
      });
    }

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

    // In a real application, you would send an email with the reset URL
    // For this example, we'll log it to the console
    console.log("Password reset requested for:", email);
    console.log("Reset URL:", resetUrl);
    
    /*
    // Example email sending code (commented out)
    await sendMail({
      to: email,
      subject: "Reset Your Password",
      text: `Please use the following link to reset your password: ${resetUrl}`,
      html: `
        <p>You requested a password reset for your Conveyancing Management Account.</p>
        <p>Please click the link below to reset your password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this reset, you can safely ignore this email.</p>
      `
    });
    */

    // Return success
    return res.status(200).json({
      message: "Password reset instructions have been sent to your email"
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({ message: "An error occurred while processing your request" });
  }
};

export default withErrorHandling(handler);