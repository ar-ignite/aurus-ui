// src/components/Dashboard.jsx
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { fetchDocuments, processDocument } from '../utils/api';
import AuthContext from '../context/AuthContext';

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const { user } = useContext(AuthContext);

  // For chart/statistics
  const [stats, setStats] = useState({
    totalDocuments: 0,
    pendingDocuments: 0,
    processedDocuments: 0,
    documentTypes: {}
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchDocuments();
      setDocuments(data);
      
      // Calculate stats
      const pendingDocs = data.filter(doc => doc.status === 'pending');
      const processedDocs = data.filter(doc => doc.status === 'processed');
      
      // Count document types
      const docTypes = {};
      data.forEach(doc => {
        docTypes[doc.document_type] = (docTypes[doc.document_type] || 0) + 1;
      });
      
      setStats({
        totalDocuments: data.length,
        pendingDocuments: pendingDocs.length,
        processedDocuments: processedDocs.length,
        documentTypes: docTypes
      });
      
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessDocument = async (documentId) => {
    if (processingId) return; // Prevent multiple simultaneous processing
    
    setProcessingId(documentId);
    
    try {
      await processDocument(documentId);
      
      // Update the local state to reflect the change
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.id === documentId 
            ? { ...doc, status: 'processed', processed_at: new Date().toISOString() } 
            : doc
        )
      );
      
      // Update stats
      setStats(prevStats => ({
        ...prevStats,
        pendingDocuments: prevStats.pendingDocuments - 1,
        processedDocuments: prevStats.processedDocuments + 1
      }));
      
    } catch (err) {
      console.error('Error processing document:', err);
      // Optionally show an error toast/notification here
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

  // Get document type distribution for a simple visualization
  const getDocumentTypeData = () => {
    return Object.entries(stats.documentTypes).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / stats.totalDocuments) * 100) || 0
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <Link 
          to="/document-management" 
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
        >
          Upload Documents
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <h3 className="text-3xl font-bold text-gray-900">{loading ? '-' : stats.totalDocuments}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 mr-4">
              <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Documents</p>
              <h3 className="text-3xl font-bold text-gray-900">{loading ? '-' : stats.pendingDocuments}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Processed Documents</p>
              <h3 className="text-3xl font-bold text-gray-900">{loading ? '-' : stats.processedDocuments}</h3>
            </div>
          </div>
        </div>
      </div>
      
      {/* Document Type Distribution */}
      {stats.totalDocuments > 0 && (
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">Document Types</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {getDocumentTypeData().map(item => (
                <div key={item.type} className="flex items-center">
                  <span className="w-32 text-sm text-gray-600">{item.type}</span>
                  <div className="flex-1 ml-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-primary-500 h-2.5 rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="ml-2 text-sm text-gray-600">{item.count} ({item.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Recent Documents Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700">Recent Documents</h3>
          <button 
            onClick={fetchData} 
            className="text-primary-500 hover:text-primary-700 focus:outline-none"
            disabled={loading}
          >
            <svg className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        {loading && documents.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2">No documents found. Upload your first document from the Document Management page.</p>
            <Link 
              to="/document-management" 
              className="mt-4 inline-block bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
            >
              Upload Documents
            </Link>
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
                      {document.status === 'processed' && (
                        <span className="text-green-600 font-medium">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* User Information Card */}
      {user && (
        <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">User Information</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">User Details</h4>
                <dl className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Username:</dt>
                    <dd className="text-sm font-medium text-gray-900">{user.username}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Full Name:</dt>
                    <dd className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Email:</dt>
                    <dd className="text-sm font-medium text-gray-900">{user.email}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">System Info</h4>
                <dl className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Client ID:</dt>
                    <dd className="text-sm font-medium text-gray-900">{user.client_id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Application ID:</dt>
                    <dd className="text-sm font-medium text-gray-900">{user.application_id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">User ID:</dt>
                    <dd className="text-sm font-medium text-gray-900">{user.id}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;