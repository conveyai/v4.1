// components/MatterDocumentsTab.js
import { useState, useEffect } from 'react';
import DocumentUpload from './DocumentUpload';
import DocumentList from './DocumentList';
import DocumentPreview from './DocumentPreview';

const MatterDocumentsTab = ({ matter }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [versioningDocument, setVersioningDocument] = useState(null);

  useEffect(() => {
    if (matter && matter.id) {
      fetchDocuments();
    }
  }, [matter]);

  const fetchDocuments = async () => {
    if (!matter || !matter.id) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/documents?matterId=${matter.id}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (newDocuments) => {
    // Add new documents to the list
    if (Array.isArray(newDocuments)) {
      setDocuments(prev => [...newDocuments, ...prev]);
    } else if (newDocuments) {
      setDocuments(prev => [newDocuments, ...prev]);
    }
    
    // Reset state
    setShowUpload(false);
    setVersioningDocument(null);
  };

  const handleShowUpload = () => {
    setShowUpload(true);
    setVersioningDocument(null);
  };

  const handleUploadVersion = (document) => {
    setVersioningDocument(document);
    setShowUpload(true);
  };

  const handlePreviewDocument = (document) => {
    setSelectedDocument(document);
    setShowPreview(true);
  };

  if (!matter || !matter.id) {
    return <div>Matter information is required to manage documents.</div>;
  }

  return (
    <div className="space-y-6">
      {!showUpload && !versioningDocument ? (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Matter Documents</h3>
          <button
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 flex items-center"
            onClick={handleShowUpload}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Documents
          </button>
        </div>
      ) : (
        <DocumentUpload 
          matterId={matter.id} 
          onUploadComplete={handleUploadComplete}
          originalDocument={versioningDocument}
          onCancel={() => {
            setShowUpload(false);
            setVersioningDocument(null);
          }}
        />
      )}
      
      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <DocumentList 
            matterId={matter.id} 
            documents={documents} 
            refreshDocuments={fetchDocuments}
            onUploadVersion={handleUploadVersion}
            onPreviewDocument={handlePreviewDocument}
          />
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mt-4">
            {error}
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {showPreview && selectedDocument && (
        <DocumentPreview 
          document={selectedDocument} 
          onClose={() => {
            setShowPreview(false);
            setSelectedDocument(null);
          }} 
        />
      )}
    </div>
  );
};

export default MatterDocumentsTab;