import { useState, useEffect } from "react";
import { cn } from "@/utils/cn";
import { ChevronDown, ChevronUp } from "lucide-react";

const ResponsiveTable = ({ 
  data = [], 
  columns = [], 
  onRowClick, 
  keyField = "id", 
  emptyMessage = "No data available" 
}) => {
  const [expandedRows, setExpandedRows] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
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

  const toggleRow = (rowId) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // Desktop view
  if (!isMobile) {
    return (
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key} 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={column.width ? { width: column.width } : {}}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row) => (
              <tr 
                key={row[keyField]} 
                className={cn(
                  "hover:bg-gray-50 transition-colors", 
                  onRowClick ? "cursor-pointer" : ""
                )}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column) => (
                  <td key={`${row[keyField]}-${column.key}`} className="px-4 py-3 whitespace-nowrap">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Mobile view - card layout
  return (
    <div className="space-y-3">
      {data.map((row) => {
        const isExpanded = expandedRows[row[keyField]];
        const mainColumns = columns.slice(0, 2); // First two columns always visible
        const detailColumns = columns.slice(2); // Rest of the columns in expanded view
        
        return (
          <div 
            key={row[keyField]} 
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div 
              className={cn(
                "p-4 flex flex-col",
                onRowClick && !isExpanded ? "cursor-pointer" : ""
              )}
              onClick={detailColumns.length > 0 ? () => toggleRow(row[keyField]) : null}
            >
              {mainColumns.map((column, index) => (
                <div key={`${row[keyField]}-${column.key}`} className={index > 0 ? "mt-1" : ""}>
                  {index === 0 ? (
                    <div className="flex justify-between items-center">
                      <div className="font-medium">
                        {column.render ? column.render(row) : row[column.key]}
                      </div>
                      {detailColumns.length > 0 && (
                        <button className="text-gray-400">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      {column.render ? column.render(row) : row[column.key]}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Expanded details */}
              {isExpanded && detailColumns.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  {detailColumns.map((column) => (
                    <div key={`${row[keyField]}-${column.key}-detail`} className="flex justify-between text-sm">
                      <span className="text-gray-500">{column.title}:</span>
                      <span className="font-medium">{column.render ? column.render(row) : row[column.key]}</span>
                    </div>
                  ))}
                  
                  {onRowClick && (
                    <button 
                      className="w-full mt-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md text-sm font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick(row);
                      }}
                    >
                      View Details
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ResponsiveTable;