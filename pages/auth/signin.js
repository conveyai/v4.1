import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { setupMobileViewport } from "@/utils/mobileViewport";
import { ResponsiveInput } from "@/components/ResponsiveFormFields";
import Image from "next/image";

// App version information
const APP_VERSION = "v4.1.0";

export default function SignIn() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    tenantDomain: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetTenantDomain, setResetTenantDomain] = useState("");
  const [resetSubmitted, setResetSubmitted] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Set up mobile viewport optimizations
    setupMobileViewport();
    
    // Check if we're on a mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
        tenantDomain: formData.tenantDomain,
      });

      if (result.error) {
        setError("Invalid credentials. Please try again.");
      } else {
        // Successful login, redirect to dashboard
        router.push("/");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);

    try {
      // Email validation
      if (!resetEmail || !resetEmail.includes('@')) {
        setResetError("Please enter a valid email address");
        setResetLoading(false);
        return;
      }

      // Domain validation
      if (!resetTenantDomain) {
        setResetError("Please enter your firm's domain");
        setResetLoading(false);
        return;
      }

      // Call password reset API
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: resetEmail,
          tenantDomain: resetTenantDomain,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset request failed');
      }

      // Show success message
      setResetSubmitted(true);
    } catch (error) {
      console.error("Password reset error:", error);
      setResetError(error.message || "Failed to request password reset. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In | Conveyancing Management App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md">
          {!showForgotPassword ? (
            // Sign In Form
            <>
              <div className="flex flex-col items-center mb-6">
                {/* App Logo */}
                <div className="w-32 h-32 mb-4 relative">
                  {/* Replace the src with the path to your logo image */}
                  {/* Example: src="/images/your-logo.png" */}
                  <Image 
                    src="/images/conveylogo.png" 
                    alt="Conveyancing Management App Logo"
                    width={128}
                    height={128}
                    className="object-contain"
                    priority
                  />
                </div>
                
                <h1 className="text-2xl font-bold text-center">Sign In</h1>
                
                {/* Version number */}
                <div className="text-xs text-gray-500 mt-1">
                  Conveyancing Management App {APP_VERSION}
                </div>
              </div>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <ResponsiveInput
                  type="text"
                  id="tenantDomain"
                  name="tenantDomain"
                  value={formData.tenantDomain}
                  onChange={handleChange}
                  placeholder="yourfirm.com.au"
                  label="Firm Domain"
                  required
                />

                <ResponsiveInput
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  label="Email"
                  required
                />

                <div>
                  <ResponsiveInput
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    label="Password"
                    required
                  />
                  <div className="mt-1 text-right">
                    <button 
                      type="button" 
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-blue-600 hover:underline focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/auth/register" className="text-blue-600 hover:underline">
                    Register here
                  </Link>
                </p>
              </div>
            </>
          ) : (
            // Password Reset Form
            <>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="mb-4 flex items-center text-blue-600 hover:underline focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Sign In
              </button>
              
              <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>
              
              {resetSubmitted ? (
                <div className="text-center">
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    <p>Password reset email sent!</p>
                    <p className="text-sm mt-2">
                      Check your email for instructions to reset your password.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetSubmitted(false);
                      setResetEmail("");
                      setResetTenantDomain("");
                    }}
                    className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 transition-colors"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <p className="mb-6 text-gray-600">
                    Enter your email address and firm domain to receive password reset instructions.
                  </p>
                  
                  {resetError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                      {resetError}
                    </div>
                  )}

                  <form onSubmit={handleResetSubmit} className="space-y-4">
                    <ResponsiveInput
                      type="text"
                      id="resetTenantDomain"
                      value={resetTenantDomain}
                      onChange={(e) => setResetTenantDomain(e.target.value)}
                      placeholder="yourfirm.com.au"
                      label="Firm Domain"
                      required
                    />

                    <ResponsiveInput
                      type="email"
                      id="resetEmail"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@example.com"
                      label="Email"
                      required
                    />

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-400 transition-colors"
                    >
                      {resetLoading ? "Sending..." : "Reset Password"}
                    </button>
                  </form>
                </>
              )}
            </>
          )}
          
          {/* Version number in footer */}
          <div className="mt-8 pt-4 border-t text-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Conveyancing Management App {APP_VERSION}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}