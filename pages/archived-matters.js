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
import { RefreshCw, Search, Archive } from "lucide-react";

// Import responsive components
import ResponsiveLayout from "@/components/ResponsiveLayout";
import ResponsiveTable from "@/components/ResponsiveTable";
import ResponsiveModal from "@/components/ResponsiveModal";
import { ResponsiveInput } from "@/components/ResponsiveFormFields";
import { setupMobileViewport } from "@/utils/mobileViewport";
import MatterDetail from "@/components/MatterDetail";

const ArchivedMattersPage = () => {
  const { data: session, status } = useSession();
  const [matters, setMatters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatter, setSelectedMatter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
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
    // Only fetch data when session is available
    if (status === "authenticated") {
      fetchArchivedMatters();
    } else if (status === "unauthenticated") {
      // Handle unauthenticated case if needed
      setLoading(false);
    }
  }, [status]);

  const fetchArchivedMatters = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call the proper API endpoint
      const response = await fetch("/api/archived-matters");
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMatters(data);
    } catch (err) {
      console.error("Failed to fetch archived matters:", err);
      setError("Failed to load archived matters. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter matters based on search query
  const filteredMatters = matters.filter(matter => 
    searchQuery === "" || 
    (matter.id && matter.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (matter.property?.address && matter.property.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (matter.type && matter.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (matter.buyer?.name && matter.buyer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (matter.seller?.name && matter.seller.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (matter.conveyancer?.name && matter.conveyancer.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderStatusBadge = (status) => {
    const variants = {
      "Completed": "success",
      "Pending": "warning",
      "Cancelled": "danger"
    };
    
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  // Format currency values
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  };

  // Format date values
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  // Format archived date with time
  const formatArchivedDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString();
  };

  // Format matter ID to display in a user-friendly way
  const formatMatterId = (id, index) => {
    if (!id) return "—";
    return `TXN${(index + 1).toString().padStart(3, '0')}`;
  };

  const handleUnarchive = async (matterId) => {
    try {
      const response = await fetch(`/api/matters/${matterId}/archive`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error("Failed to unarchive matter");
      }
      
      // Refresh the matters list
      fetchArchivedMatters();
    } catch (error) {
      console.error("Error unarchiving matter:", error);
      setError(error.message || "Failed to unarchive matter. Please try again.");
    }
  };

  // Define table columns
  const columns = [
    {
      key: "id",
      title: "Matter ID",
      render: (row, index) => (
        <span className="font-medium">{formatMatterId(row.id, index)}</span>
      )
    },
    {
      key: "property",
      title: "Property",
      render: (row) => row.property?.address || "—"
    },
    {
      key: "type",
      title: "Type",
      render: (row) => row.type
    },
    {
      key: "amount",
      title: "Amount",
      render: (row) => formatCurrency(row.amount)
    },
    {
      key: "status",
      title: "Status",
      render: (row) => renderStatusBadge(row.status)
    },
    {
      key: "conveyancer",
      title: "Conveyancer",
      render: (row) => row.conveyancer?.name || session?.user?.name || "—"
    },
    {
      key: "archived_at",
      title: "Archived Date",
      render: (row) => formatArchivedDate(row.archived_at)
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <Button
          variant="outline" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleUnarchive(row.id);
          }}
        >
          Unarchive
        </Button>
      )
    }
  ];

  return (
    <ResponsiveLayout title="Archived Matters | Conveyancing Management App">
      <div className="flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <Archive className="mr-2 text-gray-500" size={isMobile ? 20 : 24} />
            <h1 className="text-responsive-title">Archived Matters</h1>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <Button 
              onClick={fetchArchivedMatters}
              disabled={loading}
              className="flex items-center justify-center"
            >
              <RefreshCw size={16} className={loading ? "animate-spin mr-2" : "mr-2"} />
              {loading ? "Refreshing" : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <ResponsiveInput
              type="text"
              placeholder="Search by property, client, type, conveyancer..."
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
            <CardTitle>Archived Matters</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !error ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <ResponsiveTable
                data={filteredMatters}
                columns={columns}
                onRowClick={(matter) => setSelectedMatter(matter)}
                keyField="id"
                emptyMessage={
                  filteredMatters.length === 0 
                    ? searchQuery 
                      ? "No archived matters match your search."
                      : "No archived matters found."
                    : "No data available"
                }
              />
            )}
          </CardContent>
        </Card>

        {selectedMatter && (
          <ResponsiveModal
            isOpen={true}
            onClose={() => setSelectedMatter(null)}
            title="Matter Details"
            fullscreenOnMobile={true}
            size="lg"
          >
            <MatterDetail 
              matter={selectedMatter} 
              onClose={() => setSelectedMatter(null)} 
              onUpdate={fetchArchivedMatters}
              isArchived={true}
            />
          </ResponsiveModal>
        )}
      </div>
    </ResponsiveLayout>
  );
};

export default ArchivedMattersPage;