// pages/api/settings/wallpaper.js
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
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "wallpapers");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * API handler for wallpaper settings operations (GET, POST, DELETE)
 */
const handler = async (req, res) => {
  // Check for authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tenantId = session.user.tenantId;
  
  // GET - Fetch the current wallpaper for the tenant
  if (req.method === "GET") {
    try {
      // Get tenant settings from database
      const tenantSettings = await prisma.tenantSettings.findUnique({
        where: { 
          tenantId 
        }
      });
      
      if (!tenantSettings || !tenantSettings.wallpaperPath) {
        // No wallpaper set yet
        return res.status(200).json({ wallpaperUrl: null });
      }
      
      // Return the wallpaper URL
      return res.status(200).json({ 
        wallpaperUrl: tenantSettings.wallpaperPath 
      });
    } catch (error) {
      console.error("Error fetching wallpaper settings:", error);
      return res.status(500).json({ message: "Failed to fetch wallpaper settings" });
    }
  }
  
  // POST - Upload and update wallpaper
  if (req.method === "POST") {
    // Create a basic formidable instance
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB max file size
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
      
      // Get the wallpaper file (handling both array and direct object formats)
      const wallpaperFile = Array.isArray(files.wallpaper) ? files.wallpaper[0] : files.wallpaper;
      
      if (!wallpaperFile) {
        return res.status(400).json({ message: "No wallpaper file uploaded" });
      }
      
      // Log all properties of wallpaperFile to help debug
      console.log("Wallpaper file properties:", Object.keys(wallpaperFile));
      console.log("Wallpaper file details:", {
        path: wallpaperFile.filepath || wallpaperFile.path,
        name: wallpaperFile.originalFilename || wallpaperFile.name,
        type: wallpaperFile.mimetype || wallpaperFile.type,
        size: wallpaperFile.size
      });
      
      // Get filepath - supporting both old and new property names
      const filePath = wallpaperFile.filepath || wallpaperFile.path;
      const originalFilename = wallpaperFile.originalFilename || wallpaperFile.name;
      
      if (!filePath) {
        return res.status(400).json({ message: "Could not determine file path" });
      }
      
      // Validate file type (only accept images)
      const fileType = wallpaperFile.mimetype || wallpaperFile.type;
      if (!fileType.startsWith('image/')) {
        return res.status(400).json({ message: "Only image files are allowed for wallpaper" });
      }
      
      // Generate a unique filename
      const fileExt = path.extname(originalFilename || '.jpg');
      const fileName = `tenant-${tenantId}-wallpaper-${Date.now()}${fileExt}`;
      const destPath = path.join(UPLOADS_DIR, fileName);
      
      // Move the file to our uploads directory
      const fileContent = fs.readFileSync(filePath);
      fs.writeFileSync(destPath, fileContent);
      
      // Generate the public URL for the wallpaper
      const wallpaperUrl = `/uploads/wallpapers/${fileName}`;
      
      // Check if tenant settings already exist
      const existingSettings = await prisma.tenantSettings.findUnique({
        where: { tenantId }
      });
      
      // Delete old wallpaper file if exists
      if (existingSettings && existingSettings.wallpaperPath) {
        const oldWallpaperPath = existingSettings.wallpaperPath;
        // Extract filename from path
        const oldFileName = oldWallpaperPath.split('/').pop();
        const oldFilePath = path.join(UPLOADS_DIR, oldFileName);
        
        // Check if file exists before deleting
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (e) {
            console.error("Could not delete old wallpaper:", e);
          }
        }
      }
      
      // Update or create tenant settings
      let tenantSettings;
      
      if (existingSettings) {
        // Update existing settings
        tenantSettings = await prisma.tenantSettings.update({
          where: { 
            tenantId 
          },
          data: {
            wallpaperPath: wallpaperUrl
          }
        });
      } else {
        // Create new settings
        tenantSettings = await prisma.tenantSettings.create({
          data: {
            tenantId,
            wallpaperPath: wallpaperUrl
          }
        });
      }
      
      return res.status(200).json({ 
        message: "Wallpaper uploaded successfully",
        wallpaperUrl: tenantSettings.wallpaperPath
      });
    } catch (error) {
      console.error("Error in wallpaper upload handler:", error);
      return res.status(500).json({ message: `Failed to upload wallpaper: ${error.message}` });
    }
  }
  
  // DELETE - Remove wallpaper
  if (req.method === "DELETE") {
    try {
      // Get current tenant settings
      const existingSettings = await prisma.tenantSettings.findUnique({
        where: { tenantId }
      });
      
      if (!existingSettings || !existingSettings.wallpaperPath) {
        return res.status(404).json({ message: "No wallpaper found" });
      }
      
      // Delete the wallpaper file
      const oldWallpaperPath = existingSettings.wallpaperPath;
      // Extract filename from path
      const oldFileName = oldWallpaperPath.split('/').pop();
      const oldFilePath = path.join(UPLOADS_DIR, oldFileName);
      
      // Check if file exists before deleting
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      
      // Update tenant settings
      await prisma.tenantSettings.update({
        where: { tenantId },
        data: {
          wallpaperPath: null
        }
      });
      
      return res.status(200).json({ 
        message: "Wallpaper removed successfully" 
      });
    } catch (error) {
      console.error("Error removing wallpaper:", error);
      return res.status(500).json({ message: "Failed to remove wallpaper" });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
};

export default withErrorHandling(handler);