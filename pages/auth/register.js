import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { setupMobileViewport } from "@/utils/mobileViewport";
import { ResponsiveInput } from "@/components/ResponsiveFormFields";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    firmName: "",
    firmDomain: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Two-step form: 1 = account details, 2 = firm details
  const [validationErrors, setValidationErrors] = useState({});
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
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };

  const validateStep1 = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    
    if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    
    if (!formData.firmName.trim()) {
      errors.firmName = "Firm name is required";
    }
    
    if (!formData.firmDomain.trim()) {
      errors.firmDomain = "Firm domain is required";
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(formData.firmDomain)) {
      errors.firmDomain = "Please enter a valid domain (e.g., yourfirm.com.au)";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Registration successful
      router.push("/auth/registration-success");
    } catch (err) {
      setError(err.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Head>
        <title>Register | Conveyancing Management App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Create Your Account</h1>
          <p className="text-gray-600 mt-2">
            {step === 1 
              ? "Enter your account details" 
              : "Tell us about your firm"}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className={`h-1 flex-1 mx-1 ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`h-1 flex-1 mx-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            </div>
            <div className="flex justify-between">
              <div className="text-xs text-gray-600">Account Details</div>
              <div className="text-xs text-gray-600">Firm Information</div>
            </div>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNextStep} className="space-y-4">
            <ResponsiveInput
              id="name"
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Smith"
              error={validationErrors.name}
              required
            />

            <ResponsiveInput
              id="email"
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              error={validationErrors.email}
              required
            />

            <ResponsiveInput
              id="password"
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              error={validationErrors.password}
              required
            />

            <ResponsiveInput
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              error={validationErrors.confirmPassword}
              required
            />

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md mt-6 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
            >
              Next Step
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <ResponsiveInput
              id="firmName"
              label="Firm Name"
              name="firmName"
              value={formData.firmName}
              onChange={handleChange}
              placeholder="XYZ Conveyancing Pty Ltd"
              error={validationErrors.firmName}
              required
            />

            <ResponsiveInput
              id="firmDomain"
              label="Firm Domain"
              name="firmDomain"
              value={formData.firmDomain}
              onChange={handleChange}
              placeholder="yourfirm.com.au"
              error={validationErrors.firmDomain}
              helperText="This domain will be used to identify your firm when logging in."
              required
            />

            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                onClick={handlePrevStep}
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled={loading}
              >
                {loading ? "Registering..." : "Complete Registration"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-blue-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}