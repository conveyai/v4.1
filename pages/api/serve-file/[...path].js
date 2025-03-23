// pages/api/serve-file/[...path].js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Authenticate the request
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Get the file path from the URL
  const filePath = req.query.path || [];
  
  // Construct the absolute file path
  const absolutePath = path.join(process.cwd(), 'uploads', ...filePath);
  
  // Basic security check - make sure the path is within the uploads directory
  if (!absolutePath.startsWith(path.join(process.cwd(), 'uploads'))) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  // Check if the file exists
  try {
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Read the file
    const fileBuffer = fs.readFileSync(absolutePath);
    
    // Set appropriate content type based on file extension
    const ext = path.extname(absolutePath).toLowerCase();
    let contentType = 'application/octet-stream'; // Default
    
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.txt') contentType = 'text/plain';
    else if (ext === '.doc' || ext === '.docx') contentType = 'application/msword';
    
    // Set headers and send the file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(absolutePath)}"`);
    return res.send(fileBuffer);
  } catch (error) {
    console.error('Error serving file:', error);
    return res.status(500).json({ message: 'Error serving file' });
  }
}