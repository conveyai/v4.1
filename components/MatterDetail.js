// components/MatterDetail.js
import { useState } from "react";
import { 
  X, 
  Archive, 
  Edit, 
  Clock, 
  Home, 
  Users, 
  FileText,
  Check 
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import MatterDocumentsTab from "./MatterDocumentsTab";

const MatterDetail = ({ matter, onClose, onUpdate, isArchived = false }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
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
          ) : (
            <MatterDocumentsTab matter={matter} />
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
              >
                <Edit size={16} className="mr-2" />
                Edit Matter
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatterDetail;