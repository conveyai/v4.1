// pages/api/uploadDocument.js
import { PrismaClient } from "@prisma/client";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Helper to get MIME type from file extension
const getMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Since we can't use withProtectedApi due to bodyParser: false, 
  // we need to check authentication manually
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tenantId = session.user.tenantId;
  const conveyancerId = session.user.id;
  
  // Parse form with files - enable multiple file uploads
  const form = formidable({ 
    keepExtensions: true,
    multiples: true,
  });
  
  const [fields, files] = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve([fields, files]);
    });
  });

  const matterId = fields.matterId?.[0] || fields.matterId;
  const category = fields.category?.[0] || fields.category || "GENERAL";
  const originalId = fields.originalId?.[0] || fields.originalId; // For versioning
  const description = fields.description?.[0] || fields.description;
  
  // Handle file array (could be a single file or multiple files)
  const fileList = files.file ? (Array.isArray(files.file) ? files.file : [files.file]) : [];

  if (fileList.length === 0 || !matterId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Verify the matter belongs to this conveyancer
  const matter = await prisma.matter.findFirst({
    where: {
      id: matterId,
      tenantId,
      conveyancerId
    }
  });

  if (!matter) {
    return res.status(404).json({ message: "Matter not found" });
  }

  try {
    // Create tenant and matter-specific directory
    const tenantDir = path.join(UPLOADS_DIR, tenantId);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }
    
    const matterDir = path.join(tenantDir, matterId);
    if (!fs.existsSync(matterDir)) {
      fs.mkdirSync(matterDir, { recursive: true });
    }
    
    // Create category directory
    const categoryDir = path.join(matterDir, category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    // Process all files
    const uploadedDocuments = [];
    
    for (const file of fileList) {
      // Get version information if this is a new version of an existing document
      let version = 1;
      
      if (originalId) {
        // Find the highest version of this document
        const highestVersion = await prisma.document.findFirst({
          where: {
            OR: [
              { id: originalId },
              { original_id: originalId }
            ]
          },
          orderBy: {
            version: 'desc'
          }
        });
        
        if (highestVersion) {
          version = highestVersion.version + 1;
        }
      }
      
      // Generate a unique filename to prevent collisions
      const fileName = file.originalFilename || 'document.pdf';
      const uniqueFileName = `${Date.now()}-v${version}-${fileName}`;
      const filePath = path.join(categoryDir, uniqueFileName);
      
      // Copy the file from temporary location to our uploads directory
      fs.copyFileSync(file.filepath, filePath);
      
      // Get file size
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      
      // Get MIME type
      const fileType = getMimeType(fileName);
      
      // Generate a URL path that can be used to serve the file
      const fileUrl = `/uploads/${tenantId}/${matterId}/${category}/${uniqueFileName}`;
      
      // Save to database
      const document = await prisma.document.create({
        data: {
          matterId,
          tenantId,
          conveyancerId,
          name: fileName,
          file_path: fileUrl,
          file_size: fileSize,
          file_type: fileType,
          category,
          version,
          original_id: originalId,
          description: description ? description.toString() : null,
        },
      });
      
      uploadedDocuments.push(document);
      
      // Clean up temp file
      fs.unlinkSync(file.filepath);
    }
    
    // Return all uploaded documents
    return res.status(201).json({
      message: `Successfully uploaded ${uploadedDocuments.length} document(s)`,
      documents: uploadedDocuments
    });
  } catch (error) {
    console.error("Error saving document:", error);
    return res.status(500).json({ message: "Failed to upload document" });
  }
};

export default withErrorHandling(handler);