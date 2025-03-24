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
import { RefreshCw, Plus, Search, Filter, X } from "lucide-react";

// Import responsive components
import ResponsiveLayout from "@/components/ResponsiveLayout";
import ResponsiveTable from "@/components/ResponsiveTable";
import ResponsiveModal from "@/components/ResponsiveModal";
import { ResponsiveInput, ResponsiveSelect } from "@/components/ResponsiveFormFields";
import { setupMobileViewport } from "@/utils/mobileViewport";
import MatterDetail from "@/components/MatterDetail";
import MatterForm from "@/components/MatterForm";

const MattersOverview = () => {
  const { data: session } = useSession();
  const [matters, setMatters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatter, setSelectedMatter] = useState(null);
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
      fetchMatters();
    }
  }, [session]);

  const fetchMatters = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/matters");
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMatters(data);
    } catch (err) {
      console.error("Failed to fetch matters:", err);
      setError("Failed to load matters. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter matters based on status and search query
  const filteredMatters = matters
    .filter(matter => filterStatus === "All" || matter.status === filterStatus)
    .filter(matter => 
      searchQuery === "" || 
      (matter.id && matter.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (matter.property?.address && matter.property.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (matter.type && matter.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (matter.buyer?.name && matter.buyer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (matter.seller?.name && matter.seller.name.toLowerCase().includes(searchQuery.toLowerCase()))
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

  // Format matter ID to match the format shown in UI
  const formatMatterId = (id, index) => {
    if (!id) return "—";
    return `TXN${(index + 1).toString().padStart(3, '0')}`;
  };

  const handleMatterSave = (savedMatter) => {
    setMatters(prevMatters => [savedMatter, ...prevMatters]);
    setShowAddForm(false);
  };

  // Define table columns
  const columns = [
    {
      key: "id",
      title: "Matter ID",
      render: (row, index) => (
        <span className="font-medium">{formatMatterId(row.id, matters.indexOf(row))}</span>
      )
    },
    {
      key: "property",
      title: "Property",
      render: (row) => row.property?.address || "Not specified"
    },
    {
      key: "date",
      title: "Date",
      render: (row) => row.date
    },
    {
      key: "buyer",
      title: "Buyer",
      render: (row) => row.buyer?.name || "—"
    },
    {
      key: "seller",
      title: "Seller",
      render: (row) => row.seller?.name || "—"
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
    }
  ];

  return (
    <ResponsiveLayout title="Matters | Conveyancing Management App">
      <div className="flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-responsive-title mb-4 sm:mb-0">Matters</h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <Button 
              onClick={fetchMatters}
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
              Add Matter
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <ResponsiveInput
              type="text"
              placeholder="Search by property, client, type..."
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
                { value: "Pending", label: "Pending" },
                { value: "Completed", label: "Completed" },
                { value: "Cancelled", label: "Cancelled" }
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

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Matter List</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-4">
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
                    ? (filterStatus !== "All" || searchQuery) 
                      ? "No matters match your filters. Try changing your search criteria." 
                      : "No matters found. Create your first matter to get started." 
                    : "No data available"
                }
              />
            )}
          </CardContent>
        </Card>

{selectedMatter && (
  // Use a direct div container instead of ResponsiveModal for Matter Details
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <MatterDetail 
        matter={selectedMatter} 
        onClose={() => setSelectedMatter(null)} 
        onUpdate={fetchMatters}
      />
    </div>
  </div>
)}

{showAddForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Add New Matter</h2>
        <button 
          onClick={() => setShowAddForm(false)} 
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
      </div>
      <div className="overflow-y-auto flex-grow">
        <MatterForm 
          onClose={() => setShowAddForm(false)} 
          onSave={handleMatterSave}
        />
      </div>
    </div>
  </div>
)}
      </div>
    </ResponsiveLayout>
  );
};

export default MattersOverview;