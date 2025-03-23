import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useIsMobile } from "@/utils/useResponsive";

const ClientForm = ({ client, onClose, onSave }) => {
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    property: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [debugInfo, setDebugInfo] = useState(null);

  // Initialize form with client data if editing
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        property: client.property || "",
      });
    }
  }, [client]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }
    
    if (formData.phone && !/^[0-9+ ()-]{8,15}$/.test(formData.phone)) {
      errors.phone = "Phone number is invalid";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user types
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setError(null);
    setDebugInfo(null);

    try {
      // API endpoints:
      // - For creating a new client: POST to /api/clients
      // - For updating a client: PUT to /api/clients/[id]
      const url = client ? `/api/clients/${client.id}` : "/api/clients";
      const method = client ? "PUT" : "POST";
      
      console.log(`Submitting ${method} request to ${url}`);
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // Get response as text first
      const responseText = await response.text();
      
      // Try to parse as JSON
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error("Failed to parse response as JSON:", responseText);
        responseData = { message: "Invalid server response", raw: responseText };
      }
      
      // Store debug info in dev environment
      if (process.env.NODE_ENV !== 'production') {
        setDebugInfo({
          status: response.status,
          statusText: response.statusText,
          url,
          method,
          data: responseData
        });
      }

      if (response.status === 409) {
        setError("A client with this email already exists");
        setSaving(false);
        return;
      }

      if (!response.ok) {
        const errorMessage = responseData.message || `Error ${response.status}: ${response.statusText || 'Unknown error'}`;
        throw new Error(errorMessage);
      }

      // Success - call the onSave callback with the saved client data
      onSave(responseData);
    } catch (error) {
      console.error("Save error:", error);
      setError(error.message || "Failed to save client details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose}
      title={client ? "Edit Client" : "Add New Client"}
      fullscreenOnMobile={isMobile}
      size="md"
    >
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">{error}</p>
          {debugInfo && process.env.NODE_ENV !== 'production' && (
            <details className="mt-2 text-xs">
              <summary>Debug Information</summary>
              <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
            </details>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Input
            id="name"
            label="Client Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
            error={validationErrors.name}
            required
          />
          
          <Input
            id="email"
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@example.com"
            error={validationErrors.email}
            required
          />
          
          <Input
            id="phone"
            label="Phone Number"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g. 0412 345 678"
            error={validationErrors.phone}
          />
          
          <Input
            id="property"
            label="Property Address"
            name="property"
            value={formData.property}
            onChange={handleChange}
            placeholder="Property Address (Optional)"
          />
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button 
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving..." : client ? "Update Client" : "Save Client"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ClientForm;