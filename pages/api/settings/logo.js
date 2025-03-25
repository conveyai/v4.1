// pages/api/settings/logo.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import fs from 'fs';
import path from 'path';
import formidable from "formidable";

const prisma = new PrismaClient();

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "logos");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * API handler for logo settings operations (GET, POST, DELETE)
 */
const handler = async (req, res) => {
  // Check for authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tenantId = session.user.tenantId;
  
  // GET - Fetch the current logo for the tenant
  if (req.method === "GET") {
    try {
      // Get tenant settings from database
      const tenantSettings = await prisma.tenantSettings.findUnique({
        where: { 
          tenantId 
        }
      });
      
      if (!tenantSettings || !tenantSettings.logoPath) {
        // No logo set yet
        return res.status(200).json({ logoUrl: null });
      }
      
      // Return the logo URL
      return res.status(200).json({ 
        logoUrl: tenantSettings.logoPath 
      });
    } catch (error) {
      console.error("Error fetching logo settings:", error);
      return res.status(500).json({ message: "Failed to fetch logo settings" });
    }
  }
  
  // POST - Upload and update logo
  if (req.method === "POST") {
    // Create a basic formidable instance
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 2 * 1024 * 1024, // 2MB max file size
    });

    try {
      // Parse the form using a promise wrapper
      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve([fields, files]);
        });
      });
      
      console.log("Files received:", files);
      
      // Get the logo file (handling both array and direct object formats)
      const logoFile = Array.isArray(files.logo) ? files.logo[0] : files.logo;
      
      if (!logoFile) {
        return res.status(400).json({ message: "No logo file uploaded" });
      }
      
      // Log all properties of logoFile to help debug
      console.log("Logo file properties:", Object.keys(logoFile));
      console.log("Logo file details:", {
        path: logoFile.filepath || logoFile.path,
        name: logoFile.originalFilename || logoFile.name,
        type: logoFile.mimetype || logoFile.type,
        size: logoFile.size
      });
      
      // Get filepath - supporting both old and new property names
      const filePath = logoFile.filepath || logoFile.path;
      const originalFilename = logoFile.originalFilename || logoFile.name;
      
      if (!filePath) {
        return res.status(400).json({ message: "Could not determine file path" });
      }
      
      // Generate a unique filename
      const fileExt = path.extname(originalFilename || '.png');
      const fileName = `tenant-${tenantId}-logo-${Date.now()}${fileExt}`;
      const destPath = path.join(UPLOADS_DIR, fileName);
      
      // Move the file to our uploads directory
      const fileContent = fs.readFileSync(filePath);
      fs.writeFileSync(destPath, fileContent);
      
      // Generate the public URL for the logo
      const logoUrl = `/uploads/logos/${fileName}`;
      
      // Check if tenant settings already exist
      const existingSettings = await prisma.tenantSettings.findUnique({
        where: { tenantId }
      });
      
      // Delete old logo file if exists
      if (existingSettings && existingSettings.logoPath) {
        const oldLogoPath = existingSettings.logoPath;
        // Extract filename from path
        const oldFileName = oldLogoPath.split('/').pop();
        const oldFilePath = path.join(UPLOADS_DIR, oldFileName);
        
        // Check if file exists before deleting
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (e) {
            console.error("Could not delete old logo:", e);
          }
        }
      }
      
      // Update or create tenant settings
      const tenantSettings = await prisma.tenantSettings.upsert({
        where: { 
          tenantId 
        },
        update: {
          logoPath: logoUrl
        },
        create: {
          tenantId,
          logoPath: logoUrl
        }
      });
      
      return res.status(200).json({ 
        message: "Logo uploaded successfully",
        logoUrl: tenantSettings.logoPath
      });
    } catch (error) {
      console.error("Error in logo upload handler:", error);
      return res.status(500).json({ message: `Failed to upload logo: ${error.message}` });
    }
  }
  
  // DELETE - Remove logo
  if (req.method === "DELETE") {
    try {
      // Get current tenant settings
      const existingSettings = await prisma.tenantSettings.findUnique({
        where: { tenantId }
      });
      
      if (!existingSettings || !existingSettings.logoPath) {
        return res.status(404).json({ message: "No logo found" });
      }
      
      // Delete the logo file
      const oldLogoPath = existingSettings.logoPath;
      // Extract filename from path
      const oldFileName = oldLogoPath.split('/').pop();
      const oldFilePath = path.join(UPLOADS_DIR, oldFileName);
      
      // Check if file exists before deleting
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      
      // Update tenant settings
      await prisma.tenantSettings.update({
        where: { tenantId },
        data: {
          logoPath: null
        }
      });
      
      return res.status(200).json({ 
        message: "Logo removed successfully" 
      });
    } catch (error) {
      console.error("Error removing logo:", error);
      return res.status(500).json({ message: "Failed to remove logo" });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
};

export default withErrorHandling(handler);