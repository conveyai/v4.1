// components/PropertyForm.js
import { useState, useEffect } from "react";

const PropertyForm = ({ property, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    address: "",
    listing_price: "",
    status: "Available"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If property is provided, populate the form
    if (property) {
      setFormData({
        address: property.address || "",
        listing_price: property.listing_price?.toString() || "",
        status: property.status || "Available"
      });
    }
  }, [property]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate form
    if (!formData.address) {
      setError("Property address is required");
      setLoading(false);
      return;
    }

    try {
      // Prepare property data
      const propertyData = {
        address: formData.address,
        status: formData.status,
        listing_price: formData.listing_price ? parseFloat(formData.listing_price) : null
      };

      let response;
      
      if (property) {
        // Update existing property
        response = await fetch(`/api/properties/${property.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(propertyData)
        });
      } else {
        // Create new property
        response = await fetch("/api/properties", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(propertyData)
        });
      }
      
      // Handle different response statuses
      if (!response.ok) {
        // Try to get error message from response if possible
        let errorMessage = "Failed to save property";
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // If we can't parse the error response, use default message
          console.error("Error parsing error response:", parseError);
        }
        throw new Error(errorMessage);
      }
      
      // Only parse response as JSON if it was successful
      const savedProperty = await response.json();
      
      // Call onSave with the saved property
      if (onSave) {
        onSave(savedProperty);
      }
      
      // Close the form
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Error saving property:", err);
      setError(err.message || "Failed to save property. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {property ? "Edit Property" : "Add Property"}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Property Address
              </label>
              <input
                id="address"
                name="address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter full property address"
                required
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Available">Available</option>
                <option value="Pending">Pending</option>
                <option value="Sold">Sold</option>
              </select>
            </div>

            <div>
              <label htmlFor="listing_price" className="block text-sm font-medium text-gray-700 mb-1">
                Listing Price (Optional)
              </label>
              <input
                id="listing_price"
                name="listing_price"
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.listing_price}
                onChange={handleChange}
                placeholder="Enter listing price"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank if price is not applicable
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? "Saving..." : property ? "Update Property" : "Add Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyForm;