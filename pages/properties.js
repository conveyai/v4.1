import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Sidebar from "@/components/Sidebar";
import PropertyForm from "@/components/PropertyForm";
import PropertyDetail from "@/components/PropertyDetail";
import { 
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Input
} from "@/components/ui";
import { RefreshCw, Plus, Search, Filter } from "lucide-react";

const PropertiesOverview = () => {
  const { data: session } = useSession();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

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

  return (
    <div className="flex h-screen bg-gray-100">
      <Head>
        <title>Properties | Conveyancing Management App</title>
      </Head>
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h1 className="text-2xl font-bold mb-4 sm:mb-0">Properties</h1>
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

          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Input
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
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md bg-white w-full focus:ring-2 focus:ring-blue-300 focus:outline-none appearance-none"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Pending">Pending</option>
                <option value="Sold">Sold</option>
              </select>
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
                <>
                  {filteredProperties.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No properties found.</p>
                      {(filterStatus !== "All" || searchQuery) && (
                        <p className="text-gray-500 mt-2">Try changing your filters.</p>
                      )}
                      {!searchQuery && filterStatus === "All" && properties.length === 0 && (
                        <Button 
                          onClick={() => setShowAddForm(true)}
                          className="mt-4"
                        >
                          <Plus size={16} className="mr-2" />
                          Add Your First Property
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Address</TableHead>
                            <TableHead>Listing Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date Added</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProperties.map((property) => (
                            <TableRow 
                              key={property.id} 
                              className="cursor-pointer hover:bg-gray-50" 
                              onClick={() => setSelectedProperty(property)}
                            >
                              <TableCell className="font-medium">{property.address}</TableCell>
                              <TableCell>{formatCurrency(property.listing_price)}</TableCell>
                              <TableCell>{renderStatusBadge(property.status)}</TableCell>
                              <TableCell>{new Date(property.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {selectedProperty && (
            <PropertyDetail 
              property={selectedProperty} 
              onClose={() => setSelectedProperty(null)}
              onEdit={() => {
                setShowAddForm(true);
              }}
              onUpdate={fetchProperties}
            />
          )}

          {showAddForm && (
            <PropertyForm 
              property={selectedProperty}
              onClose={() => {
                setShowAddForm(false);
                setSelectedProperty(null);
              }} 
              onSave={handlePropertySave}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default PropertiesOverview;