import { useState, useEffect } from "react";
import { 
  X, 
  Archive, 
  Edit, 
  Clock, 
  Home, 
  Users, 
  FileText,
  Check,
  Search,
  ExternalLink,
  RefreshCw 
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import MatterDocumentsTab from "./MatterDocumentsTab";
import MatterForm from "./MatterForm";
import { useIsMobile } from "@/utils/useResponsive";

const MatterDetail = ({ matter, onClose, onUpdate, isArchived = false }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Title search state
  const [titleSearchLoading, setTitleSearchLoading] = useState(false);
  const [titleSearchError, setTitleSearchError] = useState(null);
  const [titleSearchResults, setTitleSearchResults] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  
  // Make sure we detect mobile/desktop properly
  const isMobile = useIsMobile();

  // Fetch title searches when tab is activated
  useEffect(() => {
    if (matter && matter.id && activeTab === "titlesearch") {
      fetchTitleSearches();
    }
  }, [matter, activeTab]);

  const fetchTitleSearches = async () => {
    try {
      setTitleSearchLoading(true);
      const response = await fetch(`/api/matters/${matter.id}/title-searches`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTitleSearchResults(data);
    } catch (error) {
      console.error("Error fetching title searches:", error);
      setTitleSearchError("Failed to load previous title searches.");
    } finally {
      setTitleSearchLoading(false);
    }
  };

  const handleTitleSearch = async () => {
    try {
      setTitleSearchLoading(true);
      setTitleSearchError(null);
      
      // Get folio identifier from property details or prompt user
      let folioIdentifier = prompt("Enter Folio Identifier (e.g., 1/sp12345):");
      
      if (!folioIdentifier) {
        setTitleSearchLoading(false);
        return; // User cancelled
      }
      
      // Call API to perform title search
      const response = await fetch("/api/lrs/title-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matterId: matter.id,
          folioIdentifier,
          productCode: "LRSTLS" // Basic title search
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to perform title search");
      }
      
      const result = await response.json();
      
      // Handle in progress status by polling
      if (result.status === "In Progress") {
        setIsPolling(true);
        pollForDocument(result.orderId);
      } else {
        // Refresh the list of title searches
        fetchTitleSearches();
      }
    } catch (error) {
      console.error("Title search error:", error);
      setTitleSearchError(error.message || "Failed to perform title search");
    } finally {
      setTitleSearchLoading(false);
    }
  };

  const pollForDocument = async (orderId) => {
    try {
      let attempts = 0;
      const maxAttempts = 10;
      const interval = 5000; // 5 seconds
      
      const pollStatus = async () => {
        if (attempts >= maxAttempts) {
          setIsPolling(false);
          setTitleSearchError("Document is taking too long to process. Please check back later.");
          return;
        }
        
        try {
          const response = await fetch(`/api/lrs/check-status?orderId=${orderId}`);
          const data = await response.json();
          
          if (data.status === "Closed") {
            setIsPolling(false);
            fetchTitleSearches(); // Refresh the list
            return;
          } else {
            attempts++;
            setTimeout(pollStatus, interval);
          }
        } catch (error) {
          console.error("Error polling for document:", error);
          attempts++;
          setTimeout(pollStatus, interval);
        }
      };
      
      pollStatus();
    } catch (error) {
      console.error("Polling error:", error);
      setIsPolling(false);
      setTitleSearchError("Error checking document status");
    }
  };

  const handleViewDocument = (documentUrl) => {
    window.open(documentUrl, '_blank');
  };

  const handleArchive = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/matters/${matter.id}/archive`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error("Failed to archive matter");
      }
      
      // Inform parent component to refresh the matters list
      if (onUpdate) {
        onUpdate();
      }
      
      // Close the detail view
      onClose();
    } catch (error) {
      console.error("Error archiving matter:", error);
      setError(error.message || "Failed to archive matter. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/matters/${matter.id}/archive`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error("Failed to unarchive matter");
      }
      
      // Inform parent component to refresh the matters list
      if (onUpdate) {
        onUpdate();
      }
      
      // Close the detail view
      onClose();
    } catch (error) {
      console.error("Error unarchiving matter:", error);
      setError(error.message || "Failed to unarchive matter. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = (updatedMatter) => {
    // Call the parent's onUpdate to refresh data
    if (onUpdate) onUpdate();
    // Close the edit form
    setIsEditing(false);
  };

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-lg ${isMobile ? 'w-full h-full' : 'w-full max-w-4xl max-h-[90vh]'} overflow-hidden flex flex-col`}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Matter Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded-md">
            {error}
          </div>
        )}

        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${activeTab === "details" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === "documents" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("documents")}
          >
            Documents
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === "titlesearch" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("titlesearch")}
          >
            Title Search
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-grow">
          {activeTab === "details" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Home size={20} className="mr-2 text-gray-500" />
                  Property Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{matter.property?.address || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Transaction Type</p>
                    <p className="font-medium">{matter.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium">{formatCurrency(matter.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div>{renderStatusBadge(matter.status)}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Users size={20} className="mr-2 text-gray-500" />
                  Parties
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Buyer</p>
                    <p className="font-medium">{matter.buyer?.name || "Not specified"}</p>
                    {matter.buyer?.email && (
                      <p className="text-sm text-gray-500">{matter.buyer.email}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Seller</p>
                    <p className="font-medium">{matter.seller?.name || "Not specified"}</p>
                    {matter.seller?.email && (
                      <p className="text-sm text-gray-500">{matter.seller.email}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Clock size={20} className="mr-2 text-gray-500" />
                  Dates
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Contract Date</p>
                    <p className="font-medium">{matter.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Settlement Date</p>
                    <p className="font-medium">{matter.settlement_date || "Not scheduled"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{new Date(matter.created_at).toLocaleDateString()}</p>
                  </div>
                  {matter.archived_at && (
                    <div>
                      <p className="text-sm text-gray-500">Archived</p>
                      <p className="font-medium">{new Date(matter.archived_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <FileText size={20} className="mr-2 text-gray-500" />
                  Conveyancer
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{matter.conveyancer?.name || "Not assigned"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{matter.conveyancer?.email || "Not available"}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "documents" ? (
            <MatterDocumentsTab matter={matter} />
          ) : (
            // Title Search tab content
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Title Searches</h3>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={fetchTitleSearches}
                    disabled={titleSearchLoading}
                    className="flex items-center"
                  >
                    <RefreshCw size={16} className={`mr-2 ${titleSearchLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleTitleSearch}
                    disabled={titleSearchLoading || isPolling}
                    className="flex items-center"
                  >
                    <Search size={16} className="mr-2" />
                    {isPolling ? "Searching..." : "New Title Search"}
                  </Button>
                </div>
              </div>

              {titleSearchError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
                  {titleSearchError}
                </div>
              )}

              {isPolling && (
                <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-md flex items-center">
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Title search is being processed. This may take a few moments...
                </div>
              )}

              {titleSearchLoading && !isPolling ? (
                <div className="flex justify-center items-center h-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : titleSearchResults.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">No title searches performed yet</p>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folio Identifier</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {titleSearchResults.map((search) => (
                        <tr key={search.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{search.orderId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{search.folioIdentifier}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={search.status === "Closed" ? "success" : "warning"}>
                              {search.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(search.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {search.status === "Closed" && search.document && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDocument(search.document)}
                                className="flex items-center"
                              >
                                <ExternalLink size={14} className="mr-1" />
                                View
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-between">
          {isArchived ? (
            <Button
              variant="outline"
              onClick={handleUnarchive}
              disabled={loading}
              className="flex items-center"
            >
              {loading ? (
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              ) : (
                <Archive size={16} className="mr-2" />
              )}
              Unarchive
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleArchive}
                disabled={loading || matter.status !== "Completed"}
                title={matter.status !== "Completed" ? "Only completed matters can be archived" : ""}
                className="flex items-center"
              >
                {loading ? (
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                ) : (
                  <Archive size={16} className="mr-2" />
                )}
                Archive
              </Button>
              <Button
                variant="primary"
                className="flex items-center"
                onClick={() => setIsEditing(true)}
              >
                <Edit size={16} className="mr-2" />
                Edit Matter
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Edit Matter Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Edit Matter</h2>
              <button 
                onClick={() => setIsEditing(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="overflow-y-auto flex-grow">
              <MatterForm 
                matter={matter}
                onClose={() => setIsEditing(false)}
                onSave={handleEditSave}
                isEditing={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatterDetail;