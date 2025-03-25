import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { 
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui";
import { Upload, Save, X, Image as ImageIcon } from "lucide-react";
import Head from "next/head";
import Image from "next/image";

// Import responsive components
import ResponsiveLayout from "@/components/ResponsiveLayout";
import { setupMobileViewport } from "@/utils/mobileViewport";

const Settings = () => {
  const { data: session } = useSession();
  const [logo, setLogo] = useState(null);
  const [currentLogo, setCurrentLogo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
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

  useEffect(() => {
    // Fetch current logo if it exists
    const fetchLogo = async () => {
      try {
        const response = await fetch('/api/settings/logo');
        if (response.ok) {
          const data = await response.json();
          if (data.logoUrl) {
            setCurrentLogo(data.logoUrl);
          }
        }
      } catch (err) {
        console.error("Error fetching logo:", err);
      }
    };

    if (session) {
      fetchLogo();
    }
  }, [session]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError("Please select an image file");
        return;
      }
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size should be less than 2MB");
        return;
      }
      
      setLogo(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
  if (!logo) return;
  
  setSaving(true);
  setSuccess(false);
  setError(null);
  
  const formData = new FormData();
  formData.append('logo', logo);
  
  try {
    // 1. Make the request
    const response = await fetch('/api/settings/logo', {
      method: 'POST',
      body: formData,
    });
    
    // 2. Check simple status first
    if (!response.ok) {
      setError(`Upload failed with status: ${response.status}`);
      setSaving(false);
      return; // Exit early
    }
    
    // 3. Try to parse the response
    let data;
    try {
      data = await response.json();
    } catch (e) {
      setError("Could not parse server response");
      setSaving(false);
      return; // Exit early
    }
    
    // 4. Handle successful case
    setCurrentLogo(data?.logoUrl || '');
    setSuccess(true);
    setLogo(null);
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  } catch (err) {
    // 5. Handle any unexpected errors
    console.error("Error in upload process:", err);
    setError("An unexpected error occurred");
  } finally {
    setSaving(false);
  }
};

  const handleRemoveLogo = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);
    
    try {
      const response = await fetch('/api/settings/logo', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to remove logo");
      }
      
      setCurrentLogo(null);
      setSuccess(true);
    } catch (err) {
      console.error("Error removing logo:", err);
      setError(err.message || "Failed to remove logo. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Clear success/error messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(false);
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <ResponsiveLayout title="Settings | Conveyancing Management App">
      <div className="flex flex-col">
        <h1 className="text-responsive-title mb-6">Settings</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Company Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Logo Display */}
              {currentLogo && (
                <div className="flex flex-col items-center">
                  <div className="border rounded-md p-4 bg-gray-50 w-full max-w-xs">
                    <div className="relative w-full h-32 flex justify-center">
                      <Image
                        src={currentLogo}
                        alt="Company Logo"
                        width={128}
                        height={128}
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <Button 
                    variant="danger"
                    className="mt-2"
                    onClick={handleRemoveLogo}
                    disabled={saving}
                  >
                    <X size={16} className="mr-2" />
                    Remove Logo
                  </Button>
                </div>
              )}

              {/* Logo Upload Form */}
              <div className="border rounded-md p-4 bg-gray-50">
                <h3 className="font-medium mb-2">{currentLogo ? 'Update Logo' : 'Upload Logo'}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a company logo that will appear in the sidebar and other key areas of the application.
                  For best results, use a square PNG or SVG image with a transparent background.
                </p>
                
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center">
                    <input
                      type="file"
                      id="logo-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer bg-white border border-gray-300 rounded-md py-2 px-4 hover:bg-gray-50 flex items-center"
                    >
                      <Upload size={16} className="mr-2" />
                      Choose File
                    </label>
                    {logo && (
                      <span className="ml-3 text-sm text-gray-600">
                        {logo.name}
                      </span>
                    )}
                  </div>
                  
                  {logo && (
                    <div className="flex items-center">
                      <Button
                        onClick={handleUpload}
                        disabled={saving}
                        className="flex items-center"
                      >
                        <Save size={16} className="mr-2" />
                        {saving ? 'Saving...' : 'Save Logo'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setLogo(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="ml-2"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Error and Success Messages */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {currentLogo ? 'Logo updated successfully!' : 'Logo removed successfully!'}
                </div>
              )}
              
              {/* Logo Requirements */}
              <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-md flex">
                <ImageIcon size={16} className="mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-700">Logo Requirements:</p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Maximum file size: 2MB</li>
                    <li>Recommended formats: PNG or SVG with transparent background</li>
                    <li>Recommended dimensions: Square (1:1 aspect ratio)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* App Version Information */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Version</span>
                <span className="font-medium">v1.2.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <p className="text-sm text-gray-500">
                  Conveyancing Management App © {new Date().getFullYear()} | All Rights Reserved
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  );
};

export default Settings;