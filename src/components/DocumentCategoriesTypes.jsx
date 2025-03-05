// src/components/DocumentCategoriesTypes.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function DocumentCategoriesTypes() {
  const [loanDetails, setLoanDetails] = useState(null);
  const [metrics, setMetrics] = useState({
    case_readiness: 60,
    document_index: 85,
    dti: 48,
    credit_score: 760
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [letterContent, setLetterContent] = useState(null);
  const { user } = useContext(AuthContext);
  const { loanId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch loan details from API
        const loanResponse = await axios.get(`${API_URL}/api/loans/${loanId}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        setLoanDetails(loanResponse.data);
        
        // Fetch metrics from API
        // In a real implementation, this would come from the backend
        // For now, we'll use the stub values
        setMetrics({
          case_readiness: 60,
          document_index: 85,
          dti: 48,
          credit_score: 760
        });
        
        // Fetch document categories from API
        const categoriesResponse = await axios.get(`${API_URL}/api/loans/${loanId}/documents/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        // If API not yet implemented, use mock data
        const mockCategories = [
          {
            id: "1",
            name: "Identification and Personal Information",
            code: "identification",
            documents: [
              { id: "101", name: "Government-Issued ID", status: "PENDING" },
              { id: "102", name: "Social Security Number", status: "COMPLETED" },
              { id: "103", name: "Proof of Legal Residency", status: "PENDING" }
            ]
          },
          {
            id: "2",
            name: "Proof of Income",
            code: "income",
            documents: [
              { id: "201", name: "Pay Stubs", status: "PENDING" },
              { id: "202", name: "W-2 Forms", status: "PENDING" },
              { id: "203", name: "Tax Returns", status: "PENDING" }
            ]
          },
          {
            id: "3",
            name: "Asset Documentation",
            code: "asset",
            documents: [
              { id: "301", name: "Bank Statements", status: "PENDING" }
            ]
          }
        ];
        
        // Use response data if available, otherwise use mock data
        setCategories(categoriesResponse.data || mockCategories);
        
        // Set all categories to expanded by default
        const expanded = {};
        (categoriesResponse.data || mockCategories).forEach(category => {
          expanded[category.id] = true;
        });
        setExpandedCategories(expanded);
      } catch (err) {
        console.error('Error fetching loan data:', err);
        setError('Failed to load loan information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (loanId) {
      fetchData();
    }
  }, [loanId]);

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleGenerateLetter = async () => {
    setGeneratingLetter(true);
    
    try {
      // In a real implementation, this would be an API call
      // For now, we'll mock the response
      const response = {
        letter_content: `
Dear ${loanDetails?.applicant_name || 'Valued Customer'},

Thank you for your recent loan application with our institution. We are pleased to inform you that your application for a ${loanDetails?.loan_amount ? '$' + loanDetails.loan_amount.toLocaleString() : ''} loan is currently being processed.

We have received the following documents from you:
- Identification documents
- Proof of income
- Asset documentation

Your application is currently showing:
- Case Readiness: ${metrics.case_readiness}%
- Document Index: ${metrics.document_index}%
- DTI: ${metrics.dti}%
- Credit Score: ${metrics.credit_score}

If you have any questions about your application or need to provide additional documentation, please don't hesitate to contact our loan department.

Best regards,
Mortgage Document Management Suite
        `
      };
      
      setTimeout(() => {
        setLetterContent(response.letter_content);
        setGeneratingLetter(false);
      }, 1500);
    } catch (err) {
      console.error('Error generating letter:', err);
      setError('Failed to generate AI letter. Please try again later.');
      setGeneratingLetter(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with loan number */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Document Categories and Types</h1>
        <Link 
          to={`/document-upload/${loanId}`}
          className="mt-2 md:mt-0 px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
        >
          Upload New Document
        </Link>
      </div>
      
      {/* Metrics Display and Loan Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="col-span-1 lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Loan Metrics</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Case Readiness */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <svg className="w-24 h-24">
                  <circle 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    fill="none" 
                    stroke="#E6E6E6" 
                    strokeWidth="2" 
                    transform="translate(12, 12) scale(0.8)"
                  />
                  <circle 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    fill="none" 
                    stroke="#F59E0B" 
                    strokeWidth="2" 
                    strokeDasharray={`${metrics.case_readiness/100 * 62.83} 62.83`} 
                    transform="translate(12, 12) scale(0.8) rotate(-90)"
                    strokeLinecap="round"
                  />
                  <text 
                    x="12" 
                    y="16" 
                    textAnchor="middle" 
                    fontSize="8" 
                    fill="#374151"
                    transform="translate(12, 12)"
                  >
                    {metrics.case_readiness}
                  </text>
                </svg>
              </div>
              <span className="text-sm font-medium mt-2 text-gray-600">Case Readiness</span>
            </div>
            
            {/* Document Index */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <svg className="w-24 h-24">
                  <circle 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    fill="none" 
                    stroke="#E6E6E6" 
                    strokeWidth="2" 
                    transform="translate(12, 12) scale(0.8)"
                  />
                  <circle 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    fill="none" 
                    stroke="#10B981" 
                    strokeWidth="2" 
                    strokeDasharray={`${metrics.document_index/100 * 62.83} 62.83`} 
                    transform="translate(12, 12) scale(0.8) rotate(-90)"
                    strokeLinecap="round"
                  />
                  <text 
                    x="12" 
                    y="16" 
                    textAnchor="middle" 
                    fontSize="8" 
                    fill="#374151"
                    transform="translate(12, 12)"
                  >
                    {metrics.document_index}
                  </text>
                </svg>
              </div>
              <span className="text-sm font-medium mt-2 text-gray-600">Document Index</span>
            </div>
            
            {/* DTI */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <svg className="w-24 h-24">
                  <circle 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    fill="none" 
                    stroke="#E6E6E6" 
                    strokeWidth="2" 
                    transform="translate(12, 12) scale(0.8)"
                  />
                  <circle 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    fill="none" 
                    stroke="#F59E0B" 
                    strokeWidth="2" 
                    strokeDasharray={`${metrics.dti/100 * 62.83} 62.83`} 
                    transform="translate(12, 12) scale(0.8) rotate(-90)"
                    strokeLinecap="round"
                  />
                  <text 
                    x="12" 
                    y="16" 
                    textAnchor="middle" 
                    fontSize="8" 
                    fill="#374151"
                    transform="translate(12, 12)"
                  >
                    {metrics.dti}
                  </text>
                </svg>
              </div>
              <span className="text-sm font-medium mt-2 text-gray-600">DTI</span>
            </div>
            
            {/* Credit Score */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <svg className="w-24 h-24">
                  <circle 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    fill="none" 
                    stroke="#E6E6E6" 
                    strokeWidth="2" 
                    transform="translate(12, 12) scale(0.8)"
                  />
                  <circle 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    fill="none" 
                    stroke="#10B981" 
                    strokeWidth="2" 
                    strokeDasharray={`${(metrics.credit_score/850) * 62.83} 62.83`} 
                    transform="translate(12, 12) scale(0.8) rotate(-90)"
                    strokeLinecap="round"
                  />
                  <text 
                    x="12" 
                    y="16" 
                    textAnchor="middle" 
                    fontSize="8" 
                    fill="#374151"
                    transform="translate(12, 12)"
                  >
                    {metrics.credit_score}
                  </text>
                </svg>
              </div>
              <span className="text-sm font-medium mt-2 text-gray-600">Credit Score</span>
            </div>
          </div>
        </div>
        
        {/* Loan Details Card */}
        <div className="col-span-1 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-semibold">Loan Details</h2>
            <span className="text-xs text-gray-500">5</span>
          </div>
          
          <div className="mt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Loan Number:</span>
              <span className="text-sm font-medium">{loanDetails?.id ? loanDetails.id.substring(0, 8).toUpperCase() : 'GH456JK78'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Loan Amount:</span>
              <span className="text-sm font-medium">${loanDetails?.loan_amount ? loanDetails.loan_amount.toLocaleString() : '400,000'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Applicant Name:</span>
              <span className="text-sm font-medium">{loanDetails?.applicant_name || 'Joanne Smith'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Interest Rate:</span>
              <span className="text-sm font-medium">{loanDetails?.interest_rate || '3.75'}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Rate Expiry Date:</span>
              <span className="text-sm font-medium">
                {loanDetails?.rate_expiry_date ? new Date(loanDetails.rate_expiry_date).toLocaleDateString() : '2024-12-31'}
              </span>
            </div>
          </div>
          
          {/* AI Letter Generation Button */}
          <div className="mt-6">
            <button
              onClick={handleGenerateLetter}
              disabled={generatingLetter}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingLetter ? 'Generating...' : 'Send an AI-Generated Letter'}
            </button>
          </div>
        </div>
      </div>
      
      {/* AI Letter Modal */}
      {letterContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">AI-Generated Letter</h3>
                <button 
                  onClick={() => setLetterContent(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded whitespace-pre-line">
                {letterContent}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setLetterContent(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors mr-2"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // In a real app, this would download or send the letter
                    alert('Letter would be sent to the applicant');
                    setLetterContent(null);
                  }}
                  className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
                >
                  Send Letter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Document Categories and Types Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Document Categories and Types</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-6">
                  Expand All
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category / Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reviewed By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approval Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                    No documents found. Please upload documents using the "Upload New Document" button.
                  </td>
                </tr>
              ) : (
                categories.map((category, categoryIndex) => (
                  <React.Fragment key={category.id}>
                    <tr className="bg-gray-50 hover:bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => toggleCategory(category.id)}
                          className="focus:outline-none"
                        >
                          {expandedCategories[category.id] ? (
                            <span className="text-lg">-</span>
                          ) : (
                            <span className="text-lg">+</span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {categoryIndex + 1}. {category.name}
                      </td>
                      <td colSpan="7"></td>
                    </tr>
                    
                    {/* Document Rows */}
                    {expandedCategories[category.id] && category.documents.map((doc, docIndex) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4"></td>
                        <td className="px-6 py-4 whitespace-nowrap pl-10">
                          {doc.name}
                        </td>
                        <td className="px-6 py-4">
                          {getDocumentDescription(category.code, doc.name)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            doc.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {doc.status === 'COMPLETED' ? 'Received' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getMockReviewer(docIndex)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getMockDate(docIndex)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getApprovalStatus(docIndex)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {getMockNotes(category.code, docIndex)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            className="text-indigo-600 hover:text-indigo-900 bg-white py-1 px-3 border border-gray-300 rounded-md shadow-sm"
                          >
                            Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper functions for mock data
function getDocumentDescription(categoryCode, documentName) {
  const lowerName = documentName.toLowerCase();
  
  const descriptions = {
    identification: {
      default: "Government-issued identification document",
      license: "Driver's license, passport, or state ID",
      passport: "Government-issued passport",
      ssn: "Social Security Number card or documentation"
    },
    income: {
      default: "Documentation of income sources",
      w2: "W-2 form showing annual income",
      paystub: "Recent pay stubs showing income details",
      tax: "Tax returns from previous years"
    },
    asset: {
      default: "Documentation of owned assets",
      bank: "Bank statements showing account balances",
      investment: "Investment account statements",
      property: "Property deeds or ownership documents"
    }
  };

  // Look up the category
  const categoryDescriptions = descriptions[categoryCode] || { default: "Supporting documentation" };
  
  // Find a matching description based on document name
  for (const [key, description] of Object.entries(categoryDescriptions)) {
    if (key !== 'default' && lowerName.includes(key)) {
      return description;
    }
  }
  
  // Return default description if no match found
  return categoryDescriptions.default;
}

function getMockReviewer(index) {
  const reviewers = ['John Doe', 'Jane Smith', 'Michael Johnson', 'Sarah Williams'];
  return reviewers[index % reviewers.length];
}

function getMockDate(index) {
  const today = new Date();
  const date = new Date(today);
  date.setDate(today.getDate() - index * 1);
  return `2024-12-${20 - index}`;
}

function getApprovalStatus(index) {
  const statuses = ['Under Review', 'Approved', 'Under Review', 'Incomplete'];
  return statuses[index % statuses.length];
}

function getMockNotes(categoryCode, index) {
  const notesByCategory = {
    identification: [
      "Requires updated ID",
      "All details verified",
      "Awaiting documents",
      "ID expired - needs renewal"
    ],
    income: [
      "Missing recent paystub",
      "Income verified",
      "Need additional documentation",
      "Inconsistent with reported income"
    ],
    asset: [
      "Missing recent statements",
      "Assets verified",
      "Need additional months",
      "Insufficient funds"
    ],
    default: [
      "Additional review needed",
      "Documentation complete",
      "Missing information",
      "Please resubmit"
    ]
  };
  
  const notes = notesByCategory[categoryCode] || notesByCategory.default;
  return notes[index % notes.length];
}

export default DocumentCategoriesTypes;