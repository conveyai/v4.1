import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@/components/ui";
import { RefreshCw, Plus, Search, Filter } from "lucide-react";

// Import responsive components
import ResponsiveLayout from "@/components/ResponsiveLayout";
import ResponsiveTable from "@/components/ResponsiveTable";
import ResponsiveModal from "@/components/ResponsiveModal";
import { ResponsiveInput, ResponsiveSelect } from "@/components/ResponsiveFormFields";
import { setupMobileViewport } from "@/utils/mobileViewport";
import PropertyForm from "@/components/PropertyForm";
import PropertyDetail from "@/components/PropertyDetail";

const PropertiesOverview = () => {
  const { data: session } = useSession();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
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
    if (session) {
      fetchProperties();
    }
  }, [session]);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/properties");
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProperties(data);
    } catch (err) {
      console.error("Failed to fetch properties:", err);
      setError("Failed to load properties. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter properties based on status and search query
  const filteredProperties = properties
    .filter(property => filterStatus === "All" || property.status === filterStatus)
    .filter(property => 
      searchQuery === "" || 
      property.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const renderStatusBadge = (status) => {
    const variants = {
      "Available": "success",
      "Pending": "warning",
      "Sold": "primary"
    };
    
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  // Format currency values
  const formatCurrency = (amount) => {
    if (!amount) return "—";
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  };

  const handlePropertySave = (savedProperty) => {
    if (selectedProperty) {
      // Update existing property in the list
      setProperties(properties.map(property => 
        property.id === savedProperty.id ? savedProperty : property
      ));
      setSelectedProperty(null);
    } else {
      // Add new property to the list
      setProperties([savedProperty, ...properties]);
      setShowAddForm(false);
    }
  };

  // Define table columns
  const columns = [
    {
      key: "address",
      title: "Address",
      render: (row) => <span className="font-medium">{row.address}</span>
    },
    {
      key: "listing_price",
      title: "Listing Price",
      render: (row) => formatCurrency(row.listing_price)
    },
    {
      key: "status",
      title: "Status",
      render: (row) => renderStatusBadge(row.status)
    },
    {
      key: "created_at",
      title: "Date Added",
      render: (row) => new Date(row.created_at).toLocaleDateString()
    }
  ];

  return (
    <ResponsiveLayout title="Properties | Conveyancing Management App">
      <div className="flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-responsive-title mb-4 sm:mb-0">Properties</h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <Button 
              onClick={fetchProperties}
              disabled={loading}
              className="flex items-center justify-center"
            >
              <RefreshCw size={16} className={loading ? "animate-spin mr-2" : "mr-2"} />
              {loading ? "Refreshing" : "Refresh"}
            </Button>
            <Button 
              variant="primary"
              className="flex items-center justify-center"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={16} className="mr-2" />
              Add Property
            </Button>
          </div>
        </div>

        <div className="mb-6 grid-responsive-2">
          <div className="relative">
            <ResponsiveInput
              type="text"
              placeholder="Search by address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="relative">
            <ResponsiveSelect
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: "All", label: "All Statuses" },
                { value: "Available", label: "Available" },
                { value: "Pending", label: "Pending" },
                { value: "Sold", label: "Sold" }
              ]}
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={16} className="text-gray-400" />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Property List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !error ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <ResponsiveTable
                data={filteredProperties}
                columns={columns}
                onRowClick={(property) => setSelectedProperty(property)}
                keyField="id"
                emptyMessage={
                  filteredProperties.length === 0 
                    ? (filterStatus !== "All" || searchQuery) 
                      ? "No properties match your filters. Try changing your search criteria." 
                      : "No properties found. Create your first property to get started." 
                    : "No data available"
                }
              />
            )}
          </CardContent>
        </Card>

        {selectedProperty && (
          <ResponsiveModal
            isOpen={true}
            onClose={() => setSelectedProperty(null)}
            title="Property Details"
            fullscreenOnMobile={true}
            size="lg"
          >
            <PropertyDetail 
              property={selectedProperty} 
              onClose={() => setSelectedProperty(null)}
              onEdit={() => {
                setShowAddForm(true);
              }}
              onUpdate={fetchProperties}
            />
          </ResponsiveModal>
        )}

        {showAddForm && (
          <ResponsiveModal
            isOpen={true}
            onClose={() => {
              setShowAddForm(false);
              setSelectedProperty(null);
            }}
            title={selectedProperty ? "Edit Property" : "Add Property"}
            fullscreenOnMobile={true}
            size="md"
          >
            <PropertyForm 
              property={selectedProperty}
              onClose={() => {
                setShowAddForm(false);
                setSelectedProperty(null);
              }} 
              onSave={handlePropertySave}
            />
          </ResponsiveModal>
        )}
      </div>
    </ResponsiveLayout>
  );
};

export default PropertiesOverview;