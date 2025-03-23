import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Sidebar from "@/components/Sidebar";
import MatterDetail from "@/components/MatterDetail";
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
import { RefreshCw, Search, Filter, Archive } from "lucide-react";

const ArchivedMattersPage = () => {
  const { data: session, status } = useSession();
  const [matters, setMatters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatter, setSelectedMatter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <div className="flex h-screen bg-gray-100">
      <Head>
        <title>Archived Matters | Conveyancing Management App</title>
      </Head>
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div className="flex items-center">
              <Archive className="mr-2 text-gray-500" size={24} />
              <h1 className="text-2xl font-bold mb-4 sm:mb-0">Archived Matters</h1>
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
              <Input
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
                <>
                  {filteredMatters.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No archived matters found.</p>
                      {searchQuery && (
                        <p className="text-gray-500 mt-2">Try changing your search terms.</p>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Matter ID</TableHead>
                            <TableHead>Property</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Conveyancer</TableHead>
                            <TableHead>Archived Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMatters.map((matter, index) => (
                            <TableRow 
                              key={matter.id} 
                              className="hover:bg-gray-50" 
                            >
                              <TableCell 
                                className="font-medium cursor-pointer"
                                onClick={() => setSelectedMatter(matter)}
                              >
                                {formatMatterId(matter.id, index)}
                              </TableCell>
                              <TableCell 
                                className="cursor-pointer"
                                onClick={() => setSelectedMatter(matter)}
                              >
                                {matter.property?.address || "—"}
                              </TableCell>
                              <TableCell 
                                className="cursor-pointer"
                                onClick={() => setSelectedMatter(matter)}
                              >
                                {matter.type}
                              </TableCell>
                              <TableCell 
                                className="cursor-pointer"
                                onClick={() => setSelectedMatter(matter)}
                              >
                                {formatCurrency(matter.amount)}
                              </TableCell>
                              <TableCell 
                                className="cursor-pointer"
                                onClick={() => setSelectedMatter(matter)}
                              >
                                {renderStatusBadge(matter.status)}
                              </TableCell>
                              <TableCell 
                                className="cursor-pointer"
                                onClick={() => setSelectedMatter(matter)}
                              >
                                {matter.conveyancer?.name || session?.user?.name || "—"}
                              </TableCell>
                              <TableCell 
                                className="cursor-pointer"
                                onClick={() => setSelectedMatter(matter)}
                              >
                                {formatArchivedDate(matter.archived_at)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnarchive(matter.id)}
                                >
                                  Unarchive
                                </Button>
                              </TableCell>
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

          {selectedMatter && (
            <MatterDetail 
              matter={selectedMatter} 
              onClose={() => setSelectedMatter(null)} 
              onUpdate={fetchArchivedMatters}
              isArchived={true}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default ArchivedMattersPage;