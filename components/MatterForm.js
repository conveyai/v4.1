// components/MatterForm.js
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useIsMobile } from "@/utils/useResponsive";

const MatterForm = ({ matter, onClose, onSave, isEditing = false }) => {
  const { data: session } = useSession();
  const isMobile = useIsMobile(); // Use the fixed hook
  const [formData, setFormData] = useState({
    type: "Purchase",
    date: new Date().toISOString().split('T')[0],
    settlement_date: "",
    amount: "",
    propertyId: "",
    buyerId: "",
    sellerId: "",
    status: "Pending"
  });

  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Initialize form with matter data if editing
  useEffect(() => {
    if (matter && isEditing) {
      setFormData({
        type: matter.type || "Purchase",
        date: matter.date || new Date().toISOString().split('T')[0],
        settlement_date: matter.settlement_date || "",
        amount: matter.amount ? matter.amount.toString() : "",
        propertyId: matter.propertyId || "",
        buyerId: matter.buyerId || "",
        sellerId: matter.sellerId || "",
        status: matter.status || "Pending"
      });
    }
  }, [matter, isEditing]);

  // Fetch properties and clients when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch properties
        const propertiesResponse = await fetch('/api/properties');
        if (!propertiesResponse.ok) {
          throw new Error('Failed to fetch properties');
        }
        const propertiesData = await propertiesResponse.json();

        // Fetch clients
        const clientsResponse = await fetch('/api/clients');
        if (!clientsResponse.ok) {
          throw new Error('Failed to fetch clients');
        }
        const clientsData = await clientsResponse.json();

        setProperties(propertiesData);
        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load required data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchData();
    }
  }, [session]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.type) {
      errors.type = "Transaction type is required";
    }
    
    if (!formData.date) {
      errors.date = "Date is required";
    }
    
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      errors.amount = "Valid amount is required";
    }
    
    if (!formData.propertyId) {
      errors.propertyId = "Property is required";
    }
    
    if (formData.type === "Purchase" && !formData.buyerId) {
      errors.buyerId = "Buyer is required for Purchase transactions";
    }
    
    if (formData.type === "Sale" && !formData.sellerId) {
      errors.sellerId = "Seller is required for Sale transactions";
    }
    
    // If settlement date is provided, validate it's after the transaction date
    if (formData.settlement_date && formData.date) {
      const transactionDate = new Date(formData.date);
      const settlementDate = new Date(formData.settlement_date);
      
      if (settlementDate < transactionDate) {
        errors.settlement_date = "Settlement date cannot be before transaction date";
      }
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

    try {
      // Determine if creating or updating
      const url = isEditing ? `/api/matters/${matter.id}` : "/api/matters";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} matter`);
      }

      const savedMatter = await response.json();
      onSave(savedMatter);
    } catch (error) {
      console.error("Save error:", error);
      setError(error.message || `Failed to ${isEditing ? 'update' : 'create'} matter details`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Modal isOpen={true} onClose={onClose} title={isEditing ? "Edit Matter" : "Add New Matter"} size="lg">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Modal>
    );
  }

 return (
  <div className="p-6">
    {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    )}

    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type<span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="px-3 py-2 w-full border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-300 focus:ring-blue-200 bg-white"
              required
            >
              <option value="Purchase">Purchase</option>
              <option value="Sale">Sale</option>
            </select>
            {validationErrors.type && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.type}</p>
            )}
          </div>

          <Input
            id="date"
            label="Transaction Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            error={validationErrors.date}
            required
          />
        </div>

        <Input
          id="settlement_date"
          label="Settlement Date"
          type="date"
          name="settlement_date"
          value={formData.settlement_date}
          onChange={handleChange}
          error={validationErrors.settlement_date}
          placeholder="Settlement date (if known)"
        />

        <Input
          id="amount"
          label="Transaction Amount ($)"
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          placeholder="e.g. 750000.00"
          error={validationErrors.amount}
          required
        />
        
        <div>
          <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700 mb-1">
            Property<span className="text-red-500">*</span>
          </label>
          <select
            id="propertyId"
            name="propertyId"
            value={formData.propertyId}
            onChange={handleChange}
            className="px-3 py-2 w-full border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-300 focus:ring-blue-200 bg-white"
            required
          >
            <option value="">Select a property</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.address} {property.listing_price ? `($${parseFloat(property.listing_price).toLocaleString()})` : ''}
              </option>
            ))}
          </select>
          {validationErrors.propertyId && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.propertyId}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="buyerId" className="block text-sm font-medium text-gray-700 mb-1">
              Buyer {formData.type === "Purchase" && <span className="text-red-500">*</span>}
            </label>
            <select
              id="buyerId"
              name="buyerId"
              value={formData.buyerId}
              onChange={handleChange}
              className="px-3 py-2 w-full border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-300 focus:ring-blue-200 bg-white"
              required={formData.type === "Purchase"}
            >
              <option value="">Select a buyer</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
            {validationErrors.buyerId && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.buyerId}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="sellerId" className="block text-sm font-medium text-gray-700 mb-1">
              Seller {formData.type === "Sale" && <span className="text-red-500">*</span>}
            </label>
            <select
              id="sellerId"
              name="sellerId"
              value={formData.sellerId}
              onChange={handleChange}
              className="px-3 py-2 w-full border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-300 focus:ring-blue-200 bg-white"
              required={formData.type === "Sale"}
            >
              <option value="">Select a seller</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
            {validationErrors.sellerId && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.sellerId}</p>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="px-3 py-2 w-full border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-300 focus:ring-blue-200 bg-white"
          >
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
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
          {saving ? "Saving..." : isEditing ? "Update Matter" : "Create Matter"}
        </Button>
      </div>
    </form>
  </div>
);
};

export default MatterForm;