// components/DocumentUpload.js
import { useState, useRef, useCallback } from 'react';

const DocumentUpload = ({ 
  matterId, 
  onUploadComplete,
  originalDocument = null, // For versioning
  categories = ['GENERAL', 'CONTRACT', 'CORRESPONDENCE', 'IDENTIFICATION', 'FINANCIAL', 'LEGAL'],
  onCancel
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [category, setCategory] = useState(originalDocument?.category || 'GENERAL');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Get label for category
  const getCategoryLabel = (cat) => {
    const labels = {
      'GENERAL': 'General',
      'CONTRACT': 'Contracts',
      'CORRESPONDENCE': 'Correspondence',
      'IDENTIFICATION': 'Identification',
      'FINANCIAL': 'Financial',
      'LEGAL': 'Legal Documents'
    };
    
    return labels[cat] || cat;
  };

  // Handle drag events
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.add('border-blue-500', 'bg-blue-50');
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-blue-500', 'bg-blue-50');
  }, []);

  const processFiles = useCallback((fileList) => {
    const newFiles = Array.from(fileList).map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    setError(null);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-blue-500', 'bg-blue-50');
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleRemoveFile = (index) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      
      // Release object URL if it's an image preview
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      
      newFiles.splice(index, 1);
      return newFiles;
    });
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

  // Handle upload
  const handleUpload = () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    setProgress(10);
    setError(null);

    try {
      const formData = new FormData();
      
      // Append each file
      files.forEach(fileObj => {
        formData.append('file', fileObj.file);
      });
      
      // Append other fields
      formData.append('matterId', matterId);
      formData.append('category', category);
      formData.append('description', description);
      
      // If this is a new version of an existing document
      if (originalDocument) {
        formData.append('originalId', originalDocument.id);
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 15;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 500);

      // Use XMLHttpRequest instead of fetch for better control
      const xhr = new XMLHttpRequest();
      
      xhr.open('POST', '/api/uploadDocument', true);
      
      // Setup handlers
      xhr.onload = function() {
        clearInterval(progressInterval);
        setProgress(100);
        
        let responseData;
        
        try {
          responseData = JSON.parse(xhr.responseText);
        } catch (e) {
          console.error('Error parsing response:', e);
          setError('Failed to parse server response');
          setUploading(false);
          return;
        }
        
        if (xhr.status >= 200 && xhr.status < 300) {
          // Success case
          // Release any image preview URLs
          files.forEach(fileObj => {
            if (fileObj.preview) {
              URL.revokeObjectURL(fileObj.preview);
            }
          });
          
          // Clear the file input and state
          setFiles([]);
          setDescription('');
          if (fileInputRef.current) fileInputRef.current.value = '';
          
          // Call the callback with the uploaded document data
          if (onUploadComplete) {
            onUploadComplete(responseData.documents);
          }
        } else {
          // Error case
          setError(responseData.message || `Upload failed with status ${xhr.status}`);
        }
        
        setUploading(false);
      };
      
      xhr.onerror = function() {
        clearInterval(progressInterval);
        console.error('Request error');
        setError('Network error occurred while uploading');
        setUploading(false);
      };
      
      xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(percentComplete);
        }
      };
      
      // Send the form data
      xhr.send(formData);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload documents');
      setUploading(false);
    }
  };

  return (
    <div className="mt-4 border border-gray-200 rounded-md p-4">
      <h3 className="text-lg font-medium mb-2">
        {originalDocument ? 'Upload New Version' : 'Upload Documents'}
      </h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={uploading || (originalDocument && originalDocument.category)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={uploading}
          placeholder="Brief description of the document"
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div 
        ref={dropZoneRef}
        className="border-2 border-dashed border-gray-300 rounded-md p-6 mt-4 mb-4 transition-colors"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              Drag and drop your files here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, Word, Excel, Images and other common document formats accepted
            </p>
          </div>
        </div>
        <input
          id="document-upload"
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </div>
      
      {/* Preview of selected files */}
      {files.length > 0 && (
        <div className="border border-gray-200 rounded-md overflow-hidden mb-4">
          <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
            Selected Files ({files.length})
          </div>
          <ul className="divide-y divide-gray-200">
            {files.map((file, index) => (
              <li key={index} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-2">
                    {file.preview ? (
                      <img src={file.preview} alt="Preview" className="h-10 w-10 object-cover rounded" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  disabled={uploading}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {error && (
        <div className="mb-4 flex items-center text-red-600 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      
      {progress > 0 && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {progress < 100 ? 'Uploading...' : 'Upload complete!'}
          </p>
        </div>
      )}
      
      <div className="flex justify-between">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        )}
        
        <button
          type="button"
          onClick={() => {
            // Release any image preview URLs
            files.forEach(fileObj => {
              if (fileObj.preview) {
                URL.revokeObjectURL(fileObj.preview);
              }
            });
            setFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          disabled={uploading || files.length === 0}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Clear
        </button>
        
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
        >
          {uploading ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Uploading...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {originalDocument ? 'Upload New Version' : `Upload ${files.length > 0 ? files.length : ''} Document${files.length !== 1 ? 's' : ''}`}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DocumentUpload;