// src/components/SidebarMenu.jsx - Updated with Document Categories menu item
import { useState, useEffect, useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { fetchUserMenuTree, fetchUserLoanApplications } from '../utils/api';

function SidebarMenu() {
  const [menuItems, setMenuItems] = useState([]);
  const [loanApplications, setLoanApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const location = useLocation();

  useEffect(() => {
    const getMenuItems = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchUserMenuTree();
        setMenuItems(data);
        
        // If user is a Loan Applicant, fetch their loan applications 
        if (user?.role === 'Loan Applicant') {
          try {
            const loanData = await fetchUserLoanApplications();
            setLoanApplications(loanData);
          } catch (err) {
            console.error('Failed to fetch loan applications:', err);
          }
        }
      } catch (err) {
        console.error('Failed to fetch menu items:', err);
        setError('Failed to load menu. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    getMenuItems();
  }, [user]);

  // Auto-expand menus based on current location
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Create a copy of the expanded menus state
    const newExpandedMenus = { ...expandedMenus };
    
    // Recursively check menu items and expand parent menus
    const checkAndExpandParents = (items) => {
      for (const item of items) {
        // If this item's path matches or is a parent path of current location, expand it
        if (currentPath.startsWith(item.path)) {
          if (item.children && item.children.length > 0) {
            newExpandedMenus[item.id] = true;
          }
        }
        
        // Check children recursively
        if (item.children && item.children.length > 0) {
          checkAndExpandParents(item.children);
        }
      }
    };
    
    checkAndExpandParents(menuItems);
    setExpandedMenus(newExpandedMenus);
  }, [location.pathname, menuItems]);

  const toggleSubmenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const renderMenuItems = (items, level = 0) => {
    return items.map((item) => (
      <div key={item.id} className={`menu-item level-${level}`}>
        {item.children && item.children.length > 0 ? (
          // Parent menu with children - render as dropdown
          <div className="submenu-container">
            <button 
              onClick={() => toggleSubmenu(item.id)}
              className={`sidebar-menu-item ${level > 0 ? 'ml-4' : ''} flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-300 hover:bg-teal-600 hover:text-white rounded-md`}
            >
              <span>{item.name}</span>
              <svg 
                className={`h-4 w-4 transition-transform duration-200 ${expandedMenus[item.id] ? 'transform rotate-180' : ''}`} 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Submenu - conditionally rendered based on expanded state */}
            <div 
              className={`submenu transition-all duration-200 overflow-hidden ${
                expandedMenus[item.id] ? 'max-h-96' : 'max-h-0'
              }`}
            >
              {renderMenuItems(item.children, level + 1)}
            </div>
          </div>
        ) : (
          // Leaf menu item - render as link
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              `sidebar-menu-item ${level > 0 ? 'ml-4' : ''} flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-teal-700 text-white'
                  : 'text-gray-300 hover:bg-teal-600 hover:text-white'
              }`
            }
          >
            {item.name}
          </NavLink>
        )}
      </div>
    ));
  };

  // Render loan application links for Loan Applicant users
  const renderLoanApplicationLinks = () => {
    if (!loanApplications || loanApplications.length === 0) {
      return (
        <div className="px-4 py-2 text-gray-400 text-sm">
          No loan applications found
        </div>
      );
    }

    return loanApplications.map(loan => (
      <NavLink
        key={loan.id}
        to={`/document-categories/${loan.id}`}
        className={({ isActive }) =>
          `sidebar-menu-item ml-4 flex items-center px-4 py-2 text-sm font-medium rounded-md ${
            isActive
              ? 'bg-teal-700 text-white'
              : 'text-gray-300 hover:bg-teal-600 hover:text-white'
          }`
        }
      >
        Loan #{loan.id.substring(0, 8).toUpperCase()}
      </NavLink>
    ));
  };

  // Manually construct default menu for development
  const defaultMenu = [
    { id: 'dashboard', name: 'Dashboard', path: '/dashboard' },
    { 
      id: 'document-management', 
      name: 'Document Management', 
      path: '/document-management',
      children: [
        { id: 'upload-document', name: 'Upload Document', path: '/document-management' },
        { id: 'view-track', name: 'View/Track Document Status', path: '/document-management' },
        { id: 'approve-reject', name: 'Approve/Reject Document', path: '/document-management' }
      ]
    },
    { id: 'ai-analytics', name: 'AI & Analytics', path: '/ai-analytics' },
    { id: 'compliance', name: 'Compliance', path: '/compliance' },
    { id: 'user-management', name: 'User Management', path: '/user-management' },
    { 
      id: 'support', 
      name: 'Support', 
      path: '/support',
      children: [
        { id: 'submit-ticket', name: 'Submit Support Ticket', path: '/support' },
        { id: 'track-ticket', name: 'Track Support Ticket Status', path: '/support' }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-2 text-red-300">
        {error}
      </div>
    );
  }

  // Use API menu items if available, otherwise fallback to default menu
  const displayMenuItems = menuItems.length > 0 ? menuItems : defaultMenu;
  
  return (
    <div className="mt-5 px-2 space-y-1">
      <div className="sidebar-header px-4 py-2 text-lg font-semibold text-white">
        Funding Institution
      </div>
      
      {/* Render main menu */}
      {renderMenuItems(displayMenuItems)}
      
      {/* Special section for Loan Applicant role */}
      {user?.role === 'Loan Applicant' && (
        <div className="mt-6">
          <div className="sidebar-header px-4 py-2 text-sm font-semibold text-white border-t border-teal-700 pt-4">
            My Loan Applications
          </div>
          {renderLoanApplicationLinks()}
          
          {/* Add a link to view document categories for the first loan application */}
          {loanApplications && loanApplications.length > 0 && (
            <div className="mt-2">
              <div className="sidebar-header px-4 py-2 text-sm font-semibold text-white">
                Document Categories
              </div>
              <NavLink
                to={`/document-categories/${loanApplications[0].id}`}
                className={({ isActive }) =>
                  `sidebar-menu-item ml-4 flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-teal-700 text-white'
                      : 'text-gray-300 hover:bg-teal-600 hover:text-white'
                  }`
                }
              >
                View Documents
              </NavLink>
            </div>
          )}
        </div>
      )}
      
      {/* For development/testing: Direct link to document categories page */}
      <div className="mt-6">
        <div className="sidebar-header px-4 py-2 text-sm font-semibold text-white border-t border-teal-700 pt-4">
          Development Links
        </div>
        <NavLink
          to="/document-categories/test-loan-id"
          className={({ isActive }) =>
            `sidebar-menu-item flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              isActive
                ? 'bg-teal-700 text-white'
                : 'text-gray-300 hover:bg-teal-600 hover:text-white'
            }`
          }
        >
          Document Categories Demo
        </NavLink>
      </div>
    </div>
  );
}

export default SidebarMenu;