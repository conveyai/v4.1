import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { 
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@/components/ui";
import { RefreshCw, Plus, Search, CheckCircle, UserCheck, Edit } from "lucide-react";

// Import responsive components
import ResponsiveLayout from "@/components/ResponsiveLayout";
import ResponsiveTable from "@/components/ResponsiveTable";
import ResponsiveModal from "@/components/ResponsiveModal";
import { ResponsiveInput } from "@/components/ResponsiveFormFields";
import { setupMobileViewport } from "@/utils/mobileViewport";
import ClientForm from "@/components/ClientForm";

const ClientsOverview = () => {
  const { data: session, status } = useSession();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
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
    // Only fetch when session is authenticated
    if (status === "authenticated") {
      fetchClients();
    } else if (status === "unauthenticated") {
      // Handle unauthenticated state if needed
      setLoading(false);
    }
  }, [status]);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/clients");
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setClients(data);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
      setError("Failed to load clients. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) =>
    searchQuery === "" ||
    (client.name && client.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (client.phone && client.phone.includes(searchQuery))
  );

  const handleClientSave = async (clientData) => {
    try {
      let response;
      let savedClient;
      
      if (selectedClient) {
        // Update existing client
        response = await fetch(`/api/clients/${selectedClient.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clientData),
        });
      } else {
        // Create new client
        response = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clientData),
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save client');
      }
      
      savedClient = await response.json();
      
      // Update state based on operation
      if (selectedClient) {
        setClients(clients.map(client => 
          client.id === savedClient.id ? savedClient : client
        ));
        setSelectedClient(null);
      } else {
        setClients([savedClient, ...clients]);
        setShowAddForm(false);
      }
      
      // Show success message (could use a toast notification component here)
    } catch (err) {
      console.error("Error saving client:", err);
      setError(err.message || "Failed to save client. Please try again.");
    }
  };

  const refreshClients = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Failed to refresh clients");
      const data = await response.json();
      setClients(data);
    } catch (err) {
      console.error("Refresh error:", err);
      // Don't show error on refresh to avoid disrupting the user
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyId = async (clientId) => {
    try {
      const response = await fetch("/api/verifyIdentity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          clientId,
          documentURL: "simulated-document-url"  // In a real app, this would be a real document
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Verification failed");
      }
      
      // Refresh the client list to show updated verification status
      refreshClients();
      
      // Show success notification (could use a toast component)
    } catch (error) {
      console.error("Verification error:", error);
      setError(error.message || "Identity verification failed. Please try again.");
    }
  };

  // Define table columns
  const columns = [
    {
      key: "name",
      title: "Name",
      render: (row) => <span className="font-medium">{row.name}</span>
    },
    {
      key: "email",
      title: "Email",
      render: (row) => row.email
    },
    {
      key: "phone",
      title: "Phone",
      render: (row) => row.phone || "N/A"
    },
    {
      key: "property",
      title: "Property",
      render: (row) => row.property || "N/A"
    },
    {
      key: "verified",
      title: "Verified",
      render: (row) => (
        row.identity_verified ? (
          <Badge variant="success" className="flex items-center">
            <CheckCircle size={12} className="mr-1" />
            Verified
          </Badge>
        ) : (
          <Badge variant="warning">Unverified</Badge>
        )
      )
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedClient(row);
            }}
            className="flex items-center"
          >
            <Edit size={14} className="mr-1" />
            Edit
          </Button>
          
          {!row.identity_verified && (
            <Button 
              variant="success" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleVerifyId(row.id);
              }}
              className="flex items-center"
            >
              <UserCheck size={14} className="mr-1" />
              Verify
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <ResponsiveLayout title="Clients | Conveyancing Management App">
      <div className="flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-responsive-title mb-4 sm:mb-0">Clients</h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <Button 
              onClick={refreshClients}
              disabled={loading}
              className="flex items-center justify-center"
            >
              <RefreshCw size={16} className={loading ? "animate-spin mr-2" : "mr-2"} />
              {loading ? "Refreshing" : "Refresh"}
            </Button>
            <Button 
              variant="success"
              className="flex items-center justify-center"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={16} className="mr-2" />
              Add New Client
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <ResponsiveInput
              type="text"
              placeholder="Search clients by name, email or phone..."
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
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Client List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !error ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <ResponsiveTable
                data={filteredClients}
                columns={columns}
                keyField="id"
                emptyMessage={
                  filteredClients.length === 0
                    ? searchQuery 
                      ? "No clients match your search." 
                      : "No clients found."
                    : "No data available"
                }
              />
            )}
          </CardContent>
        </Card>

        {(showAddForm || selectedClient) && (
          <ResponsiveModal
            isOpen={true}
            onClose={() => {
              setShowAddForm(false);
              setSelectedClient(null);
            }}
            title={selectedClient ? "Edit Client" : "Add New Client"}
            fullscreenOnMobile={true}
            size="md"
          >
            <ClientForm 
              client={selectedClient} 
              onClose={() => {
                setShowAddForm(false);
                setSelectedClient(null);
              }} 
              onSave={handleClientSave}
            />
          </ResponsiveModal>
        )}
      </div>
    </ResponsiveLayout>
  );
};

export default ClientsOverview;