// components/DocumentList.js
import React, { useState, useEffect } from 'react';

const DocumentList = ({ 
  matterId, 
  documents, 
  refreshDocuments, 
  onUploadVersion,
  onPreviewDocument 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [groupedDocuments, setGroupedDocuments] = useState({});
  const [expandedDocumentId, setExpandedDocumentId] = useState(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Process and group documents when the documents prop changes
  useEffect(() => {
    if (!documents || documents.length === 0) {
      setGroupedDocuments({});
      return;
    }

    // First group by category
    const byCategory = documents.reduce((acc, doc) => {
      const category = doc.category || 'GENERAL';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(doc);
      return acc;
    }, {});

    // Then for each category, group versions
    const processed = {};
    Object.keys(byCategory).forEach(category => {
      const docs = byCategory[category];
      
      // Group versions
      const byOriginalId = docs.reduce((acc, doc) => {
        const id = doc.original_id || doc.id;
        if (!acc[id]) {
          acc[id] = [];
        }
        acc[id].push(doc);
        return acc;
      }, {});
      
      // Sort versions within each group
      Object.keys(byOriginalId).forEach(id => {
        byOriginalId[id].sort((a, b) => b.version - a.version);
      });
      
      processed[category] = byOriginalId;
    });
    
    setGroupedDocuments(processed);
  }, [documents]);

  // Calculate the counts for each category
  const getCategoryCounts = () => {
    const counts = { ALL: 0 };
    
    Object.keys(groupedDocuments).forEach(category => {
      const categoryDocs = groupedDocuments[category];
      // Count document groups (not individual versions)
      counts[category] = Object.keys(categoryDocs).length;
      counts.ALL += Object.keys(categoryDocs).length;
    });
    
    return counts;
  };

  const categoryCounts = getCategoryCounts();

  // Determine icon based on file extension or MIME type
  const getFileIcon = (document) => {
    if (!document || (!document.name && !document.file_type)) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    
    // Check MIME type first if available
    if (document.file_type) {
      if (document.file_type.includes('pdf')) {
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      } else if (document.file_type.includes('word') || document.file_type.includes('msword')) {
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      } else if (document.file_type.includes('excel') || document.file_type.includes('spreadsheet') || document.file_type.includes('csv')) {
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      } else if (document.file_type.includes('image')) {
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      }
    }
    
    // Fallback to extension from name
    const extension = document.name.split('.').pop().toLowerCase();
    
    if (['pdf'].includes(extension)) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (['doc', 'docx'].includes(extension)) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Get category label
  const getCategoryLabel = (category) => {
    const labels = {
      'GENERAL': 'General',
      'CONTRACT': 'Contracts',
      'CORRESPONDENCE': 'Correspondence',
      'IDENTIFICATION': 'Identification',
      'FINANCIAL': 'Financial',
      'LEGAL': 'Legal Documents'
    };
    
    return labels[category] || category;
  };
  
  // Get category badge color
  const getCategoryColor = (category) => {
    const colors = {
      'GENERAL': 'default',
      'CONTRACT': 'success',
      'CORRESPONDENCE': 'info',
      'IDENTIFICATION': 'warning',
      'FINANCIAL': 'primary',
      'LEGAL': 'secondary'
    };
    
    return colors[category] || 'default';
  };

  // Handle document preview
  const handlePreview = (document) => {
    if (onPreviewDocument) {
      onPreviewDocument(document);
    } else {
      // Fallback to opening in a new tab
      window.open(document.file_path, '_blank');
    }
  };
  
  // Handle version upload
  const handleUploadVersion = (document) => {
    if (onUploadVersion) {
      onUploadVersion(document);
    }
  };

  // Add this new function to handle document deletion
  const handleDeleteDocument = async (documentId) => {
    if (!documentId) return;
    
    setDeletingDocumentId(documentId);
    setDeleteConfirmOpen(true);
  };

  // Add this function to confirm and execute the delete
  const confirmDelete = async () => {
    if (!deletingDocumentId) {
      setDeleteConfirmOpen(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/documents/${deletingDocumentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete document');
      }
      
      // Close the dialog
      setDeleteConfirmOpen(false);
      
      // Refresh the documents list
      if (refreshDocuments) {
        await refreshDocuments();
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err.message || 'Failed to delete document');
    } finally {
      setLoading(false);
      setDeletingDocumentId(null);
    }
  };

  // Toggle expanded state for document versions
  const toggleExpand = (documentId) => {
    setExpandedDocumentId(expandedDocumentId === documentId ? null : documentId);
  };

  // Refresh documents list
  const handleRefresh = async () => {
    if (!matterId || !refreshDocuments) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await refreshDocuments();
    } catch (err) {
      console.error('Error refreshing documents:', err);
      setError('Failed to refresh documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render the list of documents
  const renderDocumentList = () => {
    if (Object.keys(groupedDocuments).length === 0) {
      return (
        <div className="text-center py-6 bg-gray-50 rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 mt-2">No documents uploaded yet</p>
          <button 
            className="mt-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={handleRefresh}
          >
            Refresh
          </button>
        </div>
      );
    }
    
    // Filter categories by active category
    const categories = activeCategory === 'ALL' 
      ? Object.keys(groupedDocuments) 
      : [activeCategory];
      
    if (categories.length === 0 || (activeCategory !== 'ALL' && !groupedDocuments[activeCategory])) {
      return (
        <div className="text-center py-6 bg-gray-50 rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 mt-2">No documents in this category</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {categories.map(category => {
          const documentGroups = groupedDocuments[category];
          
          if (!documentGroups || Object.keys(documentGroups).length === 0) {
            return null;
          }
          
          return (
            <div key={category} className="border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getCategoryColor(category) === 'success' ? 'bg-green-100 text-green-800' :
                    getCategoryColor(category) === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    getCategoryColor(category) === 'info' ? 'bg-blue-100 text-blue-800' :
                    getCategoryColor(category) === 'primary' ? 'bg-purple-100 text-purple-800' :
                    getCategoryColor(category) === 'secondary' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getCategoryLabel(category)}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({Object.keys(documentGroups).length} document{Object.keys(documentGroups).length !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>
              
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.keys(documentGroups).map(groupId => {
                    // Get latest version as the main document
                    const documents = documentGroups[groupId];
                    const mainDocument = documents[0]; // First item is the latest version
                    const hasMultipleVersions = documents.length > 1;
                    
                    return (
                      <React.Fragment key={groupId}>
                        <tr className={`hover:bg-gray-50 ${expandedDocumentId === groupId ? 'bg-blue-50' : ''}`}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 mr-2">
                                {getFileIcon(mainDocument)}
                              </div>
                              <div className="truncate max-w-xs">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {mainDocument.name}
                                  {hasMultipleVersions && (
                                    <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                      v{mainDocument.version}
                                    </span>
                                  )}
                                </div>
                                {mainDocument.description && (
                                  <div className="text-xs text-gray-500 truncate">
                                    {mainDocument.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatFileSize(mainDocument.file_size)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatDate(mainDocument.uploaded_at)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 flex items-center"
                                onClick={() => handlePreview(mainDocument)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Preview
                              </button>
                              
                              <button 
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 flex items-center"
                                onClick={() => handleUploadVersion(mainDocument)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                New Version
                              </button>
                              
                              {hasMultipleVersions && (
                                <button 
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 flex items-center"
                                  onClick={() => toggleExpand(groupId)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  History
                                </button>
                              )}
                              
                              {/* Add delete button */}
                              <button 
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 flex items-center"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row click
                                  handleDeleteDocument(mainDocument.id);
                                }}
                                title="Delete document"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Render version history if expanded */}
                        {expandedDocumentId === groupId && documents.slice(1).map((versionDoc) => (
                          <tr key={versionDoc.id} className="bg-gray-50">
                            <td className="px-4 py-2 pl-10 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 mr-2">
                                  {getFileIcon(versionDoc)}
                                </div>
                                <div className="truncate max-w-xs">
                                  <div className="text-sm text-gray-600 truncate">
                                    {versionDoc.name}
                                    <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                      v{versionDoc.version}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {formatFileSize(versionDoc.file_size)}
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {formatDate(versionDoc.uploaded_at)}
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100"
                                onClick={() => handlePreview(versionDoc)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Documents</h3>
        <button 
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? (
            <div className="animate-spin mr-1 h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Refresh
        </button>
      </div>
      
      {error && (
        <div className="flex items-center text-red-600 text-sm mb-4 p-2 bg-red-50 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      
      {/* Category tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex overflow-x-auto">
          <button
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
              activeCategory === 'ALL' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveCategory('ALL')}
          >
            All Documents ({categoryCounts.ALL || 0})
          </button>
          
          {Object.keys(groupedDocuments).map(category => (
            <button
              key={category}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                activeCategory === category 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {getCategoryLabel(category)} ({categoryCounts[category] || 0})
            </button>
          ))}
        </div>
      </div>
      
      {renderDocumentList()}
      
      <div className="mt-2 text-xs text-gray-500 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Click &quot;Preview&quot; to view documents directly in the browser
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-medium mb-4">Confirm Delete</h3>
            <p className="mb-6">Are you sure you want to delete this document? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeletingDocumentId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;