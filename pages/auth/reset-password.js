import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { setupMobileViewport } from "@/utils/mobileViewport";
import { ResponsiveInput } from "@/components/ResponsiveFormFields";

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [validationError, setValidationError] = useState({
    password: "",
    confirmPassword: "",
  });
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

  // Validate token when component mounts
  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
          const data = await response.json();
          
          if (response.ok && data.valid) {
            setTokenValid(true);
          } else {
            setTokenValid(false);
            setError(data.message || "Invalid or expired reset token");
          }
        } catch (err) {
          console.error("Error validating token:", err);
          setTokenValid(false);
          setError("Failed to validate reset token");
        }
      }
    };

    validateToken();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear validation errors on change
    if (validationError[name]) {
      setValidationError({
        ...validationError,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const errors = {
      password: "",
      confirmPassword: "",
    };
    let isValid = true;

    // Password validation
    if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    // Password confirmation validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setValidationError(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset failed");
      }

      // Success
      setSuccess(true);
      // Clear form
      setFormData({
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while token is being validated
  if (tokenValid === null && token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Head>
          <title>Reset Password | Conveyancing Management App</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating your reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Reset Password | Conveyancing Management App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Reset Your Password</h1>
          
          {/* Show error if invalid token */}
          {tokenValid === false && (
            <div>
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error || "Invalid or expired reset link"}
              </div>
              <p className="mb-4 text-gray-600">
                The password reset link may have expired or is invalid. Please request a new password reset link.
              </p>
              <div className="text-center">
                <Link href="/auth/signin" className="text-blue-600 hover:underline">
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Show success message */}
          {success && (
            <div>
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                Your password has been successfully reset!
              </div>
              <p className="mb-4 text-gray-600">
                You can now sign in to your account with your new password.
              </p>
              <div className="text-center">
                <Link 
                  href="/auth/signin" 
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 inline-block transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Show form if token is valid and not yet successful */}
          {tokenValid === true && !success && (
            <>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <ResponsiveInput
                  id="password"
                  label="New Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={validationError.password}
                  helperText="Password must be at least 8 characters long"
                  required
                />

                <ResponsiveInput
                  id="confirmPassword"
                  label="Confirm New Password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={validationError.confirmPassword}
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-400 transition-colors mt-4"
                >
                  {loading ? "Resetting Password..." : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {/* Token validation is done but form is not shown (either invalid token or success) */}
          {!(tokenValid === true && !success) && (
            <div className="mt-6 text-center">
              <Link href="/auth/signin" className="text-blue-600 hover:underline">
                Return to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}