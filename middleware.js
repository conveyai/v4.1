// middleware.js
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export default async function middleware(req) {
  // Check if the request is for an uploaded file
  const { pathname } = req.nextUrl;
  
  if (pathname.startsWith('/uploads/')) {
    // Get the authentication token
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    // If not authenticated, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    
    // Check if the user has access to this file
    // This is a basic check - you might want to add more strict checks
    // based on tenant and conveyancer IDs in your file paths
    
    // For now, we'll allow access since they're authenticated
    return NextResponse.next();
  }
  
  return NextResponse.next();
}