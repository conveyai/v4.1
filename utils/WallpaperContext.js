// utils/WallpaperContext.js
import { createContext, useState, useContext, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Create context with default values
const WallpaperContext = createContext({
  wallpaperUrl: null,
  loading: false,
  error: null,
  refreshWallpaper: () => {},
});

// Create a provider component
export const WallpaperProvider = ({ children }) => {
  const { status } = useSession();
  const [wallpaperUrl, setWallpaperUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWallpaper = async () => {
    if (status !== 'authenticated') return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/settings/wallpaper');
      if (!response.ok) {
        throw new Error('Failed to fetch wallpaper');
      }
      
      const data = await response.json();
      setWallpaperUrl(data.wallpaperUrl || null);
    } catch (err) {
      console.error('Error fetching wallpaper:', err);
      setError(err.message || 'Failed to load wallpaper');
    } finally {
      setLoading(false);
    }
  };

  // Fetch wallpaper on initial render and auth state change
  useEffect(() => {
    if (status === 'authenticated') {
      fetchWallpaper();
    }
  }, [status]);

  const value = {
    wallpaperUrl,
    loading,
    error,
    refreshWallpaper: fetchWallpaper,
  };

  return (
    <WallpaperContext.Provider value={value}>
      {children}
    </WallpaperContext.Provider>
  );
};

// Create a custom hook to use the wallpaper context
export const useWallpaper = () => {
  const context = useContext(WallpaperContext);
  // Instead of throwing an error, provide a fallback for components rendered outside the provider
  if (context === undefined) {
    console.warn('useWallpaper hook used outside of WallpaperProvider');
    return {
      wallpaperUrl: null,
      loading: false,
      error: null,
      refreshWallpaper: () => {},
    };
  }
  return context;
};

export default WallpaperContext;