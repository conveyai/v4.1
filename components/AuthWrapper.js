import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

const AuthWrapper = ({ children }) => {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const router = useRouter();

  // Paths that don't require authentication
  const publicPaths = [
    "/auth/signin",
    "/auth/error",
    "/404",
    "/_error",
  ];

  // Check if current path is public
  const isPublicPath = publicPaths.some(path => 
    router.pathname === path || router.pathname.startsWith("/api/")
  );

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to sign in if not authenticated and trying to access protected route
  if (!session && !isPublicPath) {
    if (typeof window !== 'undefined') {
      router.push("/auth/signin");
    }
    return null;
  }

  // Render children for authenticated users or public pages
  return <>{children}</>;
};

export default AuthWrapper;