// pages/api/auth/register.js
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/utils/password";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { name, email, password, firmName, firmDomain } = req.body;

    // Validate required fields
    if (!name || !email || !password || !firmName || !firmDomain) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(firmDomain)) {
      return res.status(400).json({ message: "Invalid domain format" });
    }

    // Check if the domain is already in use
    const existingTenant = await prisma.tenant.findUnique({
      where: { domain: firmDomain }
    });

    if (existingTenant) {
      return res.status(409).json({ message: "A firm with this domain already exists" });
    }

    // Check if the email is already in use
    const existingConveyancer = await prisma.conveyancer.findUnique({
      where: { email }
    });

    if (existingConveyancer) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Begin a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create the tenant (firm)
      const tenant = await prisma.tenant.create({
        data: {
          name: firmName,
          domain: firmDomain
        }
      });

      // Create the conveyancer
      const conveyancer = await prisma.conveyancer.create({
        data: {
          tenantId: tenant.id,
          name,
          email,
          password_hash: hashedPassword
        }
      });

      return { tenant, conveyancer: { ...conveyancer, password_hash: undefined } };
    });

    // Return success response (excluding password hash)
    return res.status(201).json({
      message: "Registration successful",
      tenant: result.tenant,
      conveyancer: result.conveyancer
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "An error occurred during registration" });
  }
}