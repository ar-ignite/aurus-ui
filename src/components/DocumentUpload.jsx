// src/components/DocumentUpload.jsx
import React, { useState, useCallback, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import AuthContext from '../context/AuthContext';
import { uploadDocument, fetchLoanDetails } from '../utils/api';

function DocumentUpload() {
  const [files, setFiles] = useState([]);
  const [documentType, setDocumentType] = useState('');
  const [loanDetails, setLoanDetails] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const { loanId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLoan = async () => {
      if (!loanId) return;
      
      setLoading(true);
      try {
        const data = await fetchLoanDetails(loanId);
        setLoanDetails(data);
      } catch (error) {
        console.error('Failed to fetch loan details:', error);
        setMessage({
          text: 'Failed to load loan application details. Please try again.',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLoan();
  }, [loanId]);

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
    
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(newFiles[index].preview);
    
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleUpload = async () => {
    if (!loanId) {
      setMessage({
        text: 'No loan application selected',
        type: 'error'
      });
      return;
    }

    if (files.length === 0) {
      setMessage({
        text: 'Please select at least one file to upload',
        type: 'error'
      });
      return;
    }

    if (!documentType) {
      setMessage({
        text: 'Please select a document type',
        type: 'error'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setMessage({ text: '', type: '' });

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

      // Upload each file
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', documentType);
        formData.append('loan_application_id', loanId);
        
        try {
          return await uploadDocument(formData);
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          throw error;
        }
      });

      await Promise.all(uploadPromises);

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setMessage({
        text: `Successfully uploaded ${files.length} document${files.length > 1 ? 's' : ''}. AI is now processing your documents.`,
        type: 'success'
      });
      
      // Clear files after successful upload
      files.forEach(file => URL.revokeObjectURL(file.preview));
      setFiles([]);
      setDocumentType('');
      
      // Redirect to document categories page after short delay
      setTimeout(() => {
        navigate(`/document-categories/${loanId}`);
      }, 3000);
      
    } catch (error) {
      console.error('Error uploading documents:', error);
      
      setMessage({
        text: 'An error occurred while uploading your documents. Please try again.',
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      files.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload Your Document(s)</h1>
      
      {/* Loan details section */}
      {loading ? (
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      ) : loanDetails ? (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-2">Loan Application</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-gray-600 text-sm">Loan ID:</span>
              <p className="font-medium">{loanId.substring(0, 8).toUpperCase()}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Applicant:</span>
              <p className="font-medium">{loanDetails.applicant_name}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Loan Amount:</span>
              <p className="font-medium">${loanDetails.loan_amount?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Loading loan details... If this persists, please refresh the page.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Upload status message */}
      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-400 text-green-700' 
            : 'bg-red-50 border border-red-400 text-red-700'
        }`}>
          {message.text}
        </div>
      )}
      
      {/* Upload area */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">Upload Documents</h2>
        </div>
        
        <div className="p-6">
          {/* Document Type Selector */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
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
          
          {/* Dropzone */}
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive && !isDragReject ? 'border-teal-500 bg-teal-50' : 
              isDragReject ? 'border-red-500 bg-red-50' :
              'border-gray-300 hover:border-teal-500'
            }`}
          >
            <input {...getInputProps()} disabled={uploading} />
            
            {isDragActive && !isDragReject && (
              <p className="text-teal-500">Drop the files here...</p>
            )}
            
            {isDragReject && (
              <p className="text-red-500">Some files are not supported!</p>
            )}
            
            {!isDragActive && (
              <>
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-gray-500">Drag and drop your file(s) here or click to browse</p>
                <p className="mt-1 text-sm text-gray-400">Supported file types: PDF, JPEG, PNG, DOC, DOCX (Max 10MB)</p>
              </>
            )}
          </div>

          {/* Upload progress bar */}
          {uploadProgress > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-teal-500 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">Uploading and processing...</span>
                <span className="text-xs text-gray-500">{uploadProgress}%</span>
              </div>
            </div>
          )}

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files ({files.length})</h3>
              <ul className="border rounded-md divide-y divide-gray-200">
                {files.map((file, index) => (
                  <li key={index} className="p-3 flex justify-between items-center">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-teal-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      disabled={uploading}
                      className="ml-2 text-gray-400 hover:text-gray-500 focus:outline-none disabled:opacity-50"
                    >
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upload button */}
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={uploading}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || files.length === 0 || !documentType}
              className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Documents'}
            </button>
          </div>
        </div>
      </div>
      
      {/* AI Processing Information */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">AI Document Processing</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>After uploading, our AI system will automatically:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Analyze document contents</li>
                <li>Categorize documents based on their type</li>
                <li>Extract key information</li>
                <li>Update your loan application status</li>
              </ul>
              <p className="mt-2">Processing typically takes 30-60 seconds per document.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentUpload;