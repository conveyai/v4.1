import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Badge,
  Button
} from "@/components/ui";
import { Clock, User, FileText, RefreshCw } from "lucide-react";

const AuditLogView = ({ matterId }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (matterId) {
      fetchAuditLogs();
    }
  }, [matterId]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/matters/${matterId}/audit-logs`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAuditLogs(data);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      setError("Failed to load audit history. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAuditLogs();
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString();
  };

  // Get badge color based on action type
  const getActionBadge = (action) => {
    const variants = {
      "CREATED": "primary",
      "UPDATED": "warning",
      "ARCHIVED": "info",
      "UNARCHIVED": "success",
      "DELETED": "danger"
    };
    
    return <Badge variant={variants[action] || "default"}>{action}</Badge>;
  };

  // Render changes in a readable format
  const renderChanges = (logEntry) => {
    try {
      if (!logEntry.details) return null;
      
      const details = typeof logEntry.details === 'string' 
        ? JSON.parse(logEntry.details) 
        : logEntry.details;
      
      if (!details.changes) return null;
      
      return (
        <div className="mt-2 space-y-1 text-sm">
          {Object.entries(details.changes).map(([field, change]) => (
            <div key={field} className="grid grid-cols-3 gap-2">
              <span className="font-medium">{formatFieldName(field)}:</span>
              <span className="text-red-600 line-through">{formatValue(field, change.from)}</span>
              <span className="text-green-600">{formatValue(field, change.to)}</span>
            </div>
          ))}
        </div>
      );
    } catch (error) {
      console.error("Error rendering changes:", error);
      return <p className="text-sm text-red-500">Error displaying changes</p>;
    }
  };

  // Format field names for display
  const formatFieldName = (field) => {
    const fieldNameMap = {
      'type': 'Transaction Type',
      'date': 'Transaction Date',
      'settlement_date': 'Settlement Date',
      'amount': 'Amount',
      'status': 'Status',
      'propertyId': 'Property',
      'buyerId': 'Buyer',
      'sellerId': 'Seller',
    };
    
    return fieldNameMap[field] || field;
  };

  // Format values for display
  const formatValue = (field, value) => {
    if (value === null || value === undefined) return "—";
    
    // Format dates
    if (field === 'date' || field === 'settlement_date') {
      return value ? new Date(value).toLocaleDateString() : "—";
    }
    
    // Format amount as currency
    if (field === 'amount') {
      return value ? new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value) : "—";
    }
    
    return value.toString();
  };

  if (loading && !refreshing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Audit History</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin mr-2" : "mr-2"} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {auditLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No audit history available.</p>
        ) : (
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div key={log.id} className="border-b pb-4 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText size={18} className="text-gray-400" />
                    <span className="font-medium">{getActionBadge(log.action)}</span>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center space-x-2">
                    <Clock size={14} />
                    <span>{formatDateTime(log.created_at)}</span>
                  </div>
                </div>
                
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <User size={14} className="mr-1" />
                  <span>By {log.user?.name || "Unknown user"}</span>
                </div>
                
                {renderChanges(log)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditLogView;