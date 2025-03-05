// src/utils/api.js - Updated with document categories and loan application APIs
import axios from 'axios';
import { getAccessToken, logout } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'https://web-production-29545.up.railway.app';

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized, clear tokens
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== Menu and Authentication APIs =====
export const fetchMenuItems = async () => {
  try {
    const response = await api.get('/api/menu/');
    return response.data;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
};

export const fetchUserMenuTree = async () => {
  try {
    const response = await api.get('/api/menu/user-tree/');
    return response.data;
  } catch (error) {
    console.error('Error fetching menu tree:', error);
    throw error;
  }
};

// ===== Document Management APIs =====
export const fetchDocuments = async () => {
  try {
    const response = await api.get('/api/documents/');
    return response.data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

export const uploadDocument = async (formData) => {
  try {
    const response = await api.post('/api/documents/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

export const processDocument = async (documentId) => {
  try {
    const response = await api.put(`/api/documents/${documentId}/process/`);
    return response.data;
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
};

export const deleteDocument = async (documentId) => {
  try {
    const response = await api.delete(`/api/documents/${documentId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// ===== Document Categories APIs =====
export const fetchDocumentCategories = async () => {
  try {
    const response = await api.get('/api/document-categories/');
    return response.data;
  } catch (error) {
    console.error('Error fetching document categories:', error);
    throw error;
  }
};

export const fetchDocumentTypes = async (categoryId) => {
  try {
    const url = categoryId 
      ? `/api/document-types/${categoryId}/` 
      : '/api/document-types/';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching document types:', error);
    throw error;
  }
};

// ===== Loan Application APIs =====
export const fetchUserLoanApplications = async () => {
  try {
    const response = await api.get('/api/loans/');
    return response.data;
  } catch (error) {
    console.error('Error fetching user loan applications:', error);
    throw error;
  }
};

export const fetchLoanDetails = async (loanId) => {
  try {
    // Special handling for test-loan-id
    if (loanId === 'test-loan-id') {
      return {
        id: 'test-loan-id',
        loan_amount: 400000,
        loan_purpose: 'Home Purchase',
        loan_term: 30,
        interest_rate: 3.75,
        rate_expiry_date: '2024-12-31',
        applicant_name: 'Joanne Smith',
        credit_score: 760,
        dti_ratio: 48,
        case_readiness: 60,
        document_index: 85,
        application_status: 'UNDER_REVIEW'
      };
    }
    
    // Normal API call for real UUIDs
    const response = await api.get(`/api/loans/${loanId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching loan details:', error);
    
    // Return mock data for development
    return {
      id: loanId,
      loan_amount: 400000,
      loan_purpose: 'Home Purchase',
      loan_term: 30,
      interest_rate: 3.75,
      rate_expiry_date: '2024-12-31',
      applicant_name: 'Joanne Smith',
      credit_score: 760,
      dti_ratio: 48,
      case_readiness: 60,
      document_index: 85,
      application_status: 'UNDER_REVIEW'
    };
  }
};

export const fetchLoanDocuments = async (loanId) => {
  try {
    // Special handling for test-loan-id
    if (loanId === 'test-loan-id') {
      return [
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
    }
    
    const response = await api.get(`/api/loans/${loanId}/documents/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching loan documents:', error);
    // Return mock data for development
    return [
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
  }
};

export const fetchLoanMetrics = async (loanId) => {
  try {
    const response = await api.get(`/api/loans/${loanId}/metrics/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching loan metrics:', error);
    // Return stub metrics if API fails
    return {
      case_readiness: 60,
      document_index: 85,
      dti: 48,
      credit_score: 760
    };
  }
};

export const generateAILetter = async (loanId, letterType) => {
  try {
    const response = await api.post(`/api/loans/${loanId}/letter/`, {
      letter_type: letterType
    });
    return response.data;
  } catch (error) {
    console.error('Error generating AI letter:', error);
    throw error;
  }
};

export const updateDocumentCategory = async (documentId, categoryId) => {
  try {
    const response = await api.put(`/api/documents/${documentId}/category/`, {
      category_id: categoryId
    });
    return response.data;
  } catch (error) {
    console.error('Error updating document category:', error);
    throw error;
  }
};

export const approveRejectDocument = async (documentId, action, notes) => {
  try {
    const response = await api.post(`/api/documents/${documentId}/approve-reject/`, {
      action: action,
      notes: notes
    });
    return response.data;
  } catch (error) {
    console.error('Error approving/rejecting document:', error);
    throw error;
  }
};

// Mock functions to provide data when APIs are not yet implemented
function mockLoanDocuments() {
  return [
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
}

export default api;