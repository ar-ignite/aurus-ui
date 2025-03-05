// src/App.jsx with updated routes
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DocumentManagement from './components/DocumentManagement';
import DocumentCategoriesTypes from './components/DocumentCategoriesTypes';
import DocumentUpload from './components/DocumentUpload';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AuthContext from './context/AuthContext';
import { getUser } from './utils/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const userData = getUser();
      setUser(userData);
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Default route */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Main routes */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="document-management" element={<DocumentManagement />} />
            
            {/* New document routes */}
            <Route path="document-categories/:loanId" element={<DocumentCategoriesTypes />} />
            <Route path="document-upload/:loanId" element={<DocumentUpload />} />
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;