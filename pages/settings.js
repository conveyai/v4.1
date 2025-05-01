import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { 
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui";
import { Upload, Save, X, Image as ImageIcon, RefreshCw } from "lucide-react";
import Head from "next/head";
import Image from "next/image";

// Import responsive components
import ResponsiveLayout from "@/components/ResponsiveLayout";
import { setupMobileViewport } from "@/utils/mobileViewport";
import { useWallpaper } from "@/utils/WallpaperContext";

const Settings = () => {
  const { data: session } = useSession();
  // Logo states
  const [logo, setLogo] = useState(null);
  const [currentLogo, setCurrentLogo] = useState(null);
  const [savingLogo, setSavingLogo] = useState(false);
  const [logoSuccess, setLogoSuccess] = useState(false);
  const [logoError, setLogoError] = useState(null);
  const logoFileInputRef = useRef(null);
  
  // Wallpaper states
  const [wallpaper, setWallpaper] = useState(null);
  const [currentWallpaper, setCurrentWallpaper] = useState(null);
  const [savingWallpaper, setSavingWallpaper] = useState(false);
  const [wallpaperSuccess, setWallpaperSuccess] = useState(false);
  const [wallpaperError, setWallpaperError] = useState(null);
  const [wallpaperPreview, setWallpaperPreview] = useState(null);
  const wallpaperFileInputRef = useRef(null);
  
  const [isMobile, setIsMobile] = useState(false);
  const { refreshWallpaper } = useWallpaper();

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
    // Fetch current logo and wallpaper if they exist
    const fetchSettings = async () => {
      try {
        // Fetch logo
        const logoResponse = await fetch('/api/settings/logo');
        if (logoResponse.ok) {
          const logoData = await logoResponse.json();
          if (logoData.logoUrl) {
            setCurrentLogo(logoData.logoUrl);
          }
        }
        
        // Fetch wallpaper
        const wallpaperResponse = await fetch('/api/settings/wallpaper');
        if (wallpaperResponse.ok) {
          const wallpaperData = await wallpaperResponse.json();
          if (wallpaperData.wallpaperUrl) {
            setCurrentWallpaper(wallpaperData.wallpaperUrl);
          }
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };

    if (session) {
      fetchSettings();
    }
  }, [session]);

  // Logo file handling
  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        setLogoError("Please select an image file");
        return;
      }
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setLogoError("Image size should be less than 2MB");
        return;
      }
      
      setLogo(file);
      setLogoError(null);
    }
  };

  // Wallpaper file handling
  const handleWallpaperFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        setWallpaperError("Please select an image file");
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setWallpaperError("Image size should be less than 5MB");
        return;
      }
      
      setWallpaper(file);
      setWallpaperError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setWallpaperPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Logo upload handler
  const handleLogoUpload = async () => {
    if (!logo) return;
  
    setSavingLogo(true);
    setLogoSuccess(false);
    setLogoError(null);
  
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
        setLogoError(`Upload failed with status: ${response.status}`);
        setSavingLogo(false);
        return; // Exit early
      }
      
      // 3. Try to parse the response
      let data;
      try {
        data = await response.json();
      } catch (e) {
        setLogoError("Could not parse server response");
        setSavingLogo(false);
        return; // Exit early
      }
      
      // 4. Handle successful case
      setCurrentLogo(data?.logoUrl || '');
      setLogoSuccess(true);
      setLogo(null);
      
      // Clear the file input
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = '';
      }
    } catch (err) {
      // 5. Handle any unexpected errors
      console.error("Error in upload process:", err);
      setLogoError("An unexpected error occurred");
    } finally {
      setSavingLogo(false);
    }
  };

  // Wallpaper upload handler
  const handleWallpaperUpload = async () => {
    if (!wallpaper) return;
  
    setSavingWallpaper(true);
    setWallpaperSuccess(false);
    setWallpaperError(null);
  
    const formData = new FormData();
    formData.append('wallpaper', wallpaper);
  
    try {
      // Make the request
      const response = await fetch('/api/settings/wallpaper', {
        method: 'POST',
        body: formData,
      });
      
      // Check status
      if (!response.ok) {
        setWallpaperError(`Upload failed with status: ${response.status}`);
        setSavingWallpaper(false);
        return;
      }
      
      // Parse the response
      let data;
      try {
        data = await response.json();
      } catch (e) {
        setWallpaperError("Could not parse server response");
        setSavingWallpaper(false);
        return;
      }
      
      // Handle successful case
      setCurrentWallpaper(data?.wallpaperUrl || '');
      setWallpaperSuccess(true);
      setWallpaper(null);
      setWallpaperPreview(null);
      
      // Refresh the global wallpaper context
      refreshWallpaper();
      
      // Clear the file input
      if (wallpaperFileInputRef.current) {
        wallpaperFileInputRef.current.value = '';
      }
    } catch (err) {
      console.error("Error uploading wallpaper:", err);
      setWallpaperError("An unexpected error occurred");
    } finally {
      setSavingWallpaper(false);
    }
  };

  // Logo removal handler
  const handleRemoveLogo = async () => {
    setSavingLogo(true);
    setLogoSuccess(false);
    setLogoError(null);
    
    try {
      const response = await fetch('/api/settings/logo', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to remove logo");
      }
      
      setCurrentLogo(null);
      setLogoSuccess(true);
    } catch (err) {
      console.error("Error removing logo:", err);
      setLogoError(err.message || "Failed to remove logo. Please try again.");
    } finally {
      setSavingLogo(false);
    }
  };

  // Wallpaper removal handler
  const handleRemoveWallpaper = async () => {
    setSavingWallpaper(true);
    setWallpaperSuccess(false);
    setWallpaperError(null);
    
    try {
      const response = await fetch('/api/settings/wallpaper', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to remove wallpaper");
      }
      
      setCurrentWallpaper(null);
      setWallpaperSuccess(true);
      
      // Refresh the global wallpaper context
      refreshWallpaper();
    } catch (err) {
      console.error("Error removing wallpaper:", err);
      setWallpaperError(err.message || "Failed to remove wallpaper. Please try again.");
    } finally {
      setSavingWallpaper(false);
    }
  };

  // Clear success/error messages after 5 seconds
  useEffect(() => {
    if (logoSuccess || logoError) {
      const timer = setTimeout(() => {
        setLogoSuccess(false);
        setLogoError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [logoSuccess, logoError]);

  useEffect(() => {
    if (wallpaperSuccess || wallpaperError) {
      const timer = setTimeout(() => {
        setWallpaperSuccess(false);
        setWallpaperError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [wallpaperSuccess, wallpaperError]);

  return (
    <ResponsiveLayout title="Settings | Conveyancing Management App">
      <div className="flex flex-col">
        <h1 className="text-responsive-title mb-6">Settings</h1>

        {/* Company Logo Card */}
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
                    disabled={savingLogo}
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
                      onChange={handleLogoFileChange}
                      ref={logoFileInputRef}
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
                        onClick={handleLogoUpload}
                        disabled={savingLogo}
                        className="flex items-center"
                      >
                        <Save size={16} className="mr-2" />
                        {savingLogo ? 'Saving...' : 'Save Logo'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setLogo(null);
                          if (logoFileInputRef.current) {
                            logoFileInputRef.current.value = '';
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
              {logoError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {logoError}
                </div>
              )}
              
              {logoSuccess && (
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
        
        {/* Wallpaper Background Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Wallpaper Background</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Wallpaper Display */}
              {currentWallpaper && (
                <div className="flex flex-col items-center">
                  <div className="border rounded-md p-1 bg-gray-50 w-full">
                    <div className="relative w-full h-40">
                      <Image
                        src={currentWallpaper}
                        alt="Wallpaper Background"
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  </div>
                  
                  {/* Dashboard preview */}
                  <div className="mt-4 w-full border rounded-md overflow-hidden">
                    <div className="text-sm font-medium p-2 bg-gray-100 border-b">Preview on Dashboard</div>
                    <div className="relative h-60 p-4">
                      {/* Simulated background */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
                        style={{ backgroundImage: `url(${currentWallpaper})` }}
                      />
                      
                      {/* Simulated content */}
                      <div className="relative z-10 bg-white shadow-sm rounded-md p-4 max-w-xs mx-auto mt-8 border">
                        <h3 className="font-medium text-lg">Dashboard Preview</h3>
                        <p className="text-sm text-gray-600 mt-2">
                          This is how your dashboard will appear with the wallpaper background.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="danger"
                    className="mt-4"
                    onClick={handleRemoveWallpaper}
                    disabled={savingWallpaper}
                  >
                    <X size={16} className="mr-2" />
                    Remove Wallpaper
                  </Button>
                </div>
              )}

              {/* Wallpaper Upload Form */}
              <div className="border rounded-md p-4 bg-gray-50">
                <h3 className="font-medium mb-2">{currentWallpaper ? 'Update Wallpaper' : 'Upload Wallpaper'}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a custom wallpaper background for your application. This image will be used as the background for the dashboard and other pages.
                </p>
                
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center">
                    <input
                      type="file"
                      id="wallpaper-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleWallpaperFileChange}
                      ref={wallpaperFileInputRef}
                    />
                    <label
                      htmlFor="wallpaper-upload"
                      className="cursor-pointer bg-white border border-gray-300 rounded-md py-2 px-4 hover:bg-gray-50 flex items-center"
                    >
                      <Upload size={16} className="mr-2" />
                      Choose Image
                    </label>
                    {wallpaper && (
                      <span className="ml-3 text-sm text-gray-600">
                        {wallpaper.name}
                      </span>
                    )}
                  </div>
                  
                  {wallpaperPreview && (
                    <div className="mt-4 mb-2">
                      <p className="text-sm font-medium mb-2">Preview:</p>
                      <div className="border rounded-md overflow-hidden">
                        <div className="relative w-full h-40">
                          <img 
                            src={wallpaperPreview} 
                            alt="Wallpaper Preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {wallpaper && (
                    <div className="flex items-center">
                      <Button
                        onClick={handleWallpaperUpload}
                        disabled={savingWallpaper}
                        className="flex items-center"
                      >
                        <Save size={16} className="mr-2" />
                        {savingWallpaper ? 'Saving...' : 'Save Wallpaper'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setWallpaper(null);
                          setWallpaperPreview(null);
                          if (wallpaperFileInputRef.current) {
                            wallpaperFileInputRef.current.value = '';
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
              {wallpaperError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {wallpaperError}
                </div>
              )}
              
              {wallpaperSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {currentWallpaper ? 'Wallpaper updated successfully!' : 'Wallpaper removed successfully!'}
                </div>
              )}
              
              {/* Wallpaper Requirements */}
              <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-md flex">
                <ImageIcon size={16} className="mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-700">Wallpaper Requirements:</p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Maximum file size: 5MB</li>
                    <li>Recommended formats: JPG, PNG</li>
                    <li>Recommended dimensions: 1920x1080 or higher for best quality</li>
                    <li>Choose images that aren't too busy to ensure readability</li>
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