import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Modal, 
  Button, 
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge
} from "@/components/ui";
import { Edit, MapPin, Calendar, DollarSign, Home, FileText } from "lucide-react";

const PropertyDetail = ({ property, onClose, onEdit, onUpdate }) => {
  const { data: session } = useSession();
  const [relatedMatters, setRelatedMatters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch matters related to this property
  useEffect(() => {
    const fetchRelatedMatters = async () => {
      if (!property || !property.id) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/properties/${property.id}/matters`);
        if (!response.ok) {
          throw new Error("Failed to fetch related matters");
        }
        const data = await response.json();
        setRelatedMatters(data);
      } catch (error) {
        console.error("Error fetching related matters:", error);
        setError("Failed to load related matters");
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedMatters();
  }, [property]);

  // Helper function to render status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      "Available": "success",
      "Pending": "warning",
      "Sold": "primary"
    };
    
    return <Badge variant={statusMap[status] || "default"}>{status}</Badge>;
  };

  // Format currency values
  const formatCurrency = (amount) => {
    if (!amount) return "—";
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  };

  // Format date values
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Property Details" size="lg">
      <div className="space-y-6">
        {/* Property Info Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Property Information</CardTitle>
            <Button 
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex items-center space-x-1"
            >
              <Edit size={16} />
              <span>Edit</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <MapPin className="text-gray-400 mt-1 flex-shrink-0" size={18} />
                <div>
                  <p className="font-medium text-lg">{property.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="text-gray-400 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Listing Price</p>
                    <p className="font-semibold">{formatCurrency(property.listing_price)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Home className="text-gray-400 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div>{getStatusBadge(property.status)}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="text-gray-400 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Date Added</p>
                    <p>{formatDate(property.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related Matters */}
        <Card>
          <CardHeader>
            <CardTitle>Related Matters</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-700 p-3 rounded-md">
                {error}
              </div>
            ) : relatedMatters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto mb-2 text-gray-400" size={32} />
                <p>No matters associated with this property yet.</p>
              </div>
            ) : (
              <div className="divide-y">
                {relatedMatters.map(matter => (
                  <div key={matter.id} className="py-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{matter.type} - {formatDate(matter.date)}</p>
                        <p className="text-sm text-gray-500">
                          {matter.buyer?.name ? `Buyer: ${matter.buyer.name}` : ''}
                          {matter.buyer?.name && matter.seller?.name ? ' | ' : ''}
                          {matter.seller?.name ? `Seller: ${matter.seller.name}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-700">{formatCurrency(matter.amount)}</span>
                        <Badge 
                          variant={
                            matter.status === "Completed" ? "success" : 
                            matter.status === "Pending" ? "warning" : 
                            "default"
                          }
                        >
                          {matter.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end">
          <Button 
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PropertyDetail;