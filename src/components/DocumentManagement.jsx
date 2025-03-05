// src/components/DocumentManagement.jsx
import { useState, useEffect, useCallback, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import { fetchDocuments, uploadDocument, deleteDocument, processDocument, fetchUserLoanApplications } from '../utils/api';
import AuthContext from '../context/AuthContext';

function DocumentManagement() {
  const [files, setFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [documentType, setDocumentType] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [loanApplications, setLoanApplications] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [processingId, setProcessingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const { user } = useContext(AuthContext);

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocumentList();
    fetchLoanApplications();
  }, []);

  const fetchDocumentList = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoanApplications = async () => {
    setLoadingLoans(true);
    try {
      const data = await fetchUserLoanApplications();
      setLoanApplications(data);
      // Select the first loan by default if available
      if (data.length > 0 && !selectedLoanId) {
        setSelectedLoanId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching loan applications:', err);
    } finally {
      setLoadingLoans(false);
    }
  };

  const onDrop = useCallback(acceptedFiles => {
    setFiles(prev => [
      ...prev,
      ...acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
      }))
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10485760, // 10MB
  });

  const handleRemoveFile = (index) => {
    const newFiles = [...files];
    URL.revokeObjectURL(newFiles[index].preview);
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage({ text: 'Please select at least one file', type: 'error' });
      return;
    }

    if (!documentType) {
      setMessage({ text: 'Please select a document type', type: 'error' });
      return;
    }

    if (!selectedLoanId) {
      setMessage({ text: 'Please select a loan application', type: 'error' });
      return;
    }

    setUploading(true);
    setMessage({ text: '', type: '' });
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);

      // Process each file upload
      const uploadedDocs = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', documentType);
        formData.append('loan_application_id', selectedLoanId);
        
        const response = await uploadDocument(formData);
        uploadedDocs.push(response);
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Update documents list with newly uploaded files
      setDocuments(prev => [...uploadedDocs, ...prev]);
      
      setMessage({ 
        text: `${files.length} document${files.length > 1 ? 's' : ''} uploaded successfully! They will be processed shortly.`, 
        type: 'success' 
      });
      
      setFiles([]);
      
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 1500);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setMessage({ 
        text: 'Failed to upload documents. Please try again.', 
        type: 'error' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (deletingId) return;
    
    setDeletingId(documentId);
    
    try {
      await deleteDocument(documentId);
      
      // Update the document list by removing the deleted document
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
      
    } catch (err) {
      console.error('Error deleting document:', err);
      setMessage({
        text: 'Failed to delete document. Please try again.',
        type: 'error'
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleProcessDocument = async (documentId) => {
    if (processingId) return;
    
    setProcessingId(documentId);
    
    try {
      const updatedDoc = await processDocument(documentId);
      
      // Update the document list
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.id === documentId ? { ...doc, status: 'processed', processed_at: new Date().toISOString() } : doc
        )
      );
      
    } catch (err) {
      console.error('Error processing document:', err);
      setMessage({
        text: 'Failed to process document. Please try again.',
        type: 'error'
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  // Clean up file previews on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  // Helper function to get file size in human-readable format
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Document Management</h2>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('upload')}
          >
            Upload Documents
          </button>
          <button
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'manage'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('manage')}
          >
            Manage Documents
          </button>
        </nav>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Upload Documents Tab */}
      {activeTab === 'upload' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">Upload Your Document(s)</h3>
          </div>

          <div className="p-6">
            {/* Loan Application Selector */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Loan Application <span className="text-red-500">*</span>
              </label>
              {loadingLoans ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
                  <span className="text-gray-500">Loading loan applications...</span>
                </div>
              ) : loanApplications.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
                  <p>No loan applications found. Please create a loan application first.</p>
                </div>
              ) : (
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={selectedLoanId}
                  onChange={(e) => setSelectedLoanId(e.target.value)}
                  disabled={uploading}
                >
                  <option value="">Select a loan application</option>
                  {loanApplications.map(loan => (
                    <option key={loan.id} value={loan.id}>
                      {loan.loan_purpose} - ${loan.loan_amount.toLocaleString()} ({loan.applicant_name})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Document Type Selector */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                disabled={uploading}
              >
                <option value="">Select document type</option>
                <option value="Government ID">Government-Issued ID</option>
                <option value="Social Security">Social Security Card</option>
                <option value="Proof of Residency">Proof of Legal Residency</option>
                <option value="Pay Stubs">Pay Stubs</option>
                <option value="W-2 Forms">W-2 Forms</option>
                <option value="Tax Returns">Tax Returns</option>
                <option value="Bank Statements">Bank Statements</option>
                <option value="Investment Accounts">Investment Account Statements</option>
                <option value="Credit Report">Credit Report</option>
                <option value="Property Appraisal">Property Appraisal</option>
                <option value="Home Inspection">Home Inspection</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-6 mb-6 text-center cursor-pointer transition-colors ${
                isDragActive && !isDragReject ? 'border-primary-500 bg-primary-50' : 
                isDragReject ? 'border-red-500 bg-red-50' :
                'border-gray-300 hover:border-primary-500'
              }`}
            >
              <input {...getInputProps()} disabled={uploading} />
              
              {isDragActive && !isDragReject && (
                <p className="text-primary-500">Drop the files here...</p>
              )}
              
              {isDragReject && (
                <p className="text-red-500">Some files are not supported!</p>
              )}
              
              {!isDragActive && (
                <>
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-1 text-gray-500">Drag and drop your file(s) here or click to browse</p>
                  <p className="mt-1 text-sm text-gray-400">Supported file types: PDF, JPEG, PNG, DOC, DOCX (Max 10MB)</p>
                </>
              )}
            </div>

            {uploadProgress > 0 && (
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary-500 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1 text-right">{uploadProgress}%</p>
              </div>
            )}

            {files.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-2 text-gray-700">Selected Files:</h4>
                <ul className="divide-y divide-gray-200">
                  {files.map((file, index) => (
                    <li key={index} className="py-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-primary-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-gray-700">{file.name}</span>
                        <span className="text-gray-500 text-sm ml-2">({formatFileSize(file.size)})</span>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        disabled={uploading}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between">
              <button
                onClick={handleUpload}
                disabled={uploading || files.length === 0 || !documentType || !selectedLoanId || loanApplications.length === 0}
                className={`bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 mb-4 sm:mb-0 ${
                  (uploading || files.length === 0 || !documentType || !selectedLoanId || loanApplications.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : 'Upload Document(s)'}
              </button>

              <button
                onClick={() => document.querySelector('input[type="file"]').click()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                disabled={uploading}
              >
                Browse Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Documents Tab */}
      {activeTab === 'manage' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-700">Your Documents</h3>
            <button 
              onClick={fetchDocumentList} 
              className="text-primary-500 hover:text-primary-700 focus:outline-none"
              disabled={loading}
            >
              <svg className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="p-6 text-center text-red-500">
              {error}
            </div>
          )}
          
          {loading && documents.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2">No documents found. Upload your first document from the Upload tab.</p>
              <button 
                onClick={() => setActiveTab('upload')} 
                className="mt-4 inline-block bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                Go to Upload
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded At
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Processed At
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((document) => (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {document.document_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {document.document_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          document.status === 'processed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {document.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(document.uploaded_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(document.processed_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          {document.status === 'pending' && (
                            <button
                              onClick={() => handleProcessDocument(document.id)}
                              disabled={processingId === document.id}
                              className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                                processingId === document.id ? 'opacity-50 cursor-wait' : ''
                              }`}
                            >
                              {processingId === document.id ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing...
                                </>
                              ) : 'Process'}
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteDocument(document.id)}
                            disabled={deletingId === document.id}
                            className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                              deletingId === document.id ? 'opacity-50 cursor-wait' : ''
                            }`}
                          >
                            {deletingId === document.id ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Deleting...
                              </>
                            ) : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Information Box */}
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Document Processing Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Uploaded documents are stored in a temporary table with the following structure:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>document_name (varchar)</li>
                <li>document_type (varchar)</li>
                <li>status (varchar)</li>
                <li>uploaded_at (timestamp)</li>
                <li>processed_at (timestamp)</li>
                <li>metadata (jsonb)</li>
                <li>document_path (varchar)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentManagement;