// utils/googleMaps.js
/**
 * Utility functions for interacting with the Google Maps API
 */

/**
 * Geocode an address into latitude and longitude
 * @param {string} address - The address to geocode
 * @param {number} timeout - Timeout in milliseconds (default: 5000ms)
 * @returns {Promise<{lat: number, lng: number} | null>} - The geocoded coordinates or null if geocoding fails
 */
export const geocodeAddress = async (address, timeout = 5000) => {
  if (!address) return null;
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key is not configured.');
    return null;
  }

  try {
    // Create a timeout promise that rejects after the specified timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Geocoding request timed out')), timeout);
    });

    // Create the geocoding request promise
    const geocodePromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        );

        if (!response.ok) {
          throw new Error(`Geocoding API returned status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          resolve({ lat: location.lat, lng: location.lng });
        } else if (data.status === 'ZERO_RESULTS') {
          console.warn(`No results found for address: ${address}`);
          resolve(null);
        } else {
          console.error('Geocoding error:', data.status, data.error_message);
          reject(new Error(`Geocoding failed: ${data.status}`));
        }
      } catch (error) {
        reject(error);
      }
    });

    // Race the geocoding request against the timeout
    return await Promise.race([geocodePromise, timeoutPromise]);
  } catch (error) {
    console.error('Geocoding error:', error);
    // Return null instead of throwing to make the API more resilient
    return null;
  }
};

/**
 * Get a static map image URL for a location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} zoom - Zoom level (1-20)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {string} - URL for the static map image
 */
export const getStaticMapUrl = (lat, lng, zoom = 15, width = 600, height = 300) => {
  if (!lat || !lng || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return null;
  }

  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
};

/**
 * Format a simple address for display
 * @param {string} address - The full address
 * @returns {string} - Formatted address
 */
export const formatAddress = (address) => {
  if (!address) return '';
  
  // Remove any extra spaces and trim
  return address.replace(/\s+/g, ' ').trim();
};