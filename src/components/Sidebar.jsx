// src/components/Sidebar.jsx - Main Sidebar Component that includes the menu

import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarMenu from './SidebarMenu';
import AuthContext from '../context/AuthContext';
import { logout } from '../utils/auth';

function Sidebar({ isOpen, toggleMenu }) {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/login');
  };

  return (
    <div 
      className={`bg-teal-800 text-white transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64' : 'w-0'
      } fixed md:relative inset-y-0 left-0 z-30 md:translate-x-0 overflow-y-auto flex flex-col`}
    >
      <div className={`${isOpen ? 'flex' : 'hidden'} flex-col h-full`}>
        <div className="p-4 border-b border-teal-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mortgage Document Suite</h2>
          <button 
            onClick={toggleMenu}
            className="md:hidden text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded-md"
          >
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Role and user information */}
        {user && (
          <div className="px-4 py-2 border-b border-teal-700">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-300">
                Logged in as:
              </span>
              <span className="text-sm font-bold text-white">
                {user.first_name} {user.last_name}
              </span>
              <span className="text-xs text-gray-400">
                Role: {user.role || 'No Role Assigned'}
              </span>
            </div>
          </div>
        )}
        
        {/* Menu component renders the dynamic menu tree */}
        <SidebarMenu />
        
        <div className="mt-auto p-4 border-t border-teal-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:bg-teal-600 hover:text-white rounded-md"
          >
            <svg className="mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;