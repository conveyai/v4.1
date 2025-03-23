// components/DocumentPreview.js
import { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut,
  Rotate,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui';

const DocumentPreview = ({ document, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [supportsPreview, setSupportsPreview] = useState(false);

  useEffect(() => {
    if (!document) return;
    
    // Check if document can be previewed based on file type
    checkFilePreviewSupport();
  }, [document]);

  const checkFilePreviewSupport = () => {
    if (!document || !document.file_path) {
      setSupportsPreview(false);
      setError('Document cannot be previewed');
      return;
    }

    // Determine if document can be previewed
    const fileType = document.file_type || '';
    const fileName = document.name || '';
    const ext = fileName.split('.').pop().toLowerCase();
    
    // Supported file types for preview
    const supportedTypes = [
      // PDFs
      'application/pdf',
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml',
      // Text files
      'text/plain', 'text/csv',
      // HTML
      'text/html',
    ];
    
    // Extensions that can be previewed
    const supportedExts = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'txt', 'csv', 'html'];
    
    const canPreview = supportedTypes.some(type => fileType.includes(type)) || 
                       supportedExts.includes(ext);
    
    setSupportsPreview(canPreview);
    setLoading(canPreview);
    
    if (!canPreview) {
      setError('This file type does not support preview. Please download the file to view it.');
    }
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const rotateClockwise = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (!document || !document.file_path) return;
    
    window.open(document.file_path, '_blank');
  };

  const renderPreview = () => {
    if (!document || !document.file_path) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No document selected</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <FileText size={48} className="text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleDownload} className="flex items-center">
            <Download size={16} className="mr-2" />
            Download File
          </Button>
        </div>
      );
    }

    if (loading && supportsPreview) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    // Determine file type to render appropriate preview
    const fileType = document.file_type || '';
    const fileName = document.name || '';
    const ext = fileName.split('.').pop().toLowerCase();
    
    // PDF preview
    if (fileType.includes('pdf') || ext === 'pdf') {
      return (
        <iframe 
          src={`${document.file_path}#toolbar=0`}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          title={document.name}
        />
      );
    }
    
    // Image preview
    if (fileType.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) {
      return (
        <div className="flex items-center justify-center h-full">
          <img 
            src={document.file_path}
            alt={document.name}
            className="max-h-full max-w-full object-contain transition-all"
            style={{ 
              transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
            }}
            onLoad={() => setLoading(false)}
          />
        </div>
      );
    }
    
    // Text file preview
    if (fileType.includes('text') || ext === 'txt' || ext === 'csv') {
      return (
        <iframe 
          src={document.file_path}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          title={document.name}
        />
      );
    }
    
    // HTML preview
    if (fileType.includes('html') || ext === 'html') {
      return (
        <iframe 
          src={document.file_path}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          title={document.name}
          sandbox="allow-same-origin"
        />
      );
    }
    
    // Fallback - shouldn't reach here if checkFilePreviewSupport is working correctly
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <FileText size={48} className="text-gray-400 mb-4" />
        <p className="text-gray-600 mb-4">Preview not available for this file type</p>
        <Button onClick={handleDownload} className="flex items-center">
          <Download size={16} className="mr-2" />
          Download File
        </Button>
      </div>
    );
  };

  // If no document is provided, don't render anything
  if (!document) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold truncate max-w-md">{document.name}</h2>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDownload}
              className="flex items-center"
            >
              <Download size={16} className="mr-1" />
              Download
            </Button>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        {/* Document preview */}
        <div className="flex-grow relative overflow-auto bg-gray-100">
          {renderPreview()}
        </div>
        
        {/* Controls */}
        {supportsPreview && !error && fileType && fileType.includes('image') && (
          <div className="p-2 border-t bg-gray-50 flex items-center justify-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={zoomOut}
              disabled={zoomLevel <= 50}
              className="flex items-center"
            >
              <ZoomOut size={16} />
            </Button>
            <span className="text-sm">{zoomLevel}%</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={zoomIn}
              disabled={zoomLevel >= 200}
              className="flex items-center"
            >
              <ZoomIn size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={rotateClockwise}
              className="flex items-center"
            >
              <Rotate size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentPreview;