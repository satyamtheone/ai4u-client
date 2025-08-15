import React, { useState } from 'react';
import { useAppSelector } from '../hooks/redux';
import { 
  Home, 
  Book, 
  Code, 
  MessageSquare, 
  Brain, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown 
} from 'lucide-react';

interface SidebarProps {
  showSidebar: boolean;
  currentView: string;
  setCurrentView: (view: string) => void;
  isSignedIn: boolean;
  setShowAuthModal: (show: boolean) => void;
  setIsSignedIn: (signedIn: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  showSidebar,
  currentView,
  setCurrentView,
  isSignedIn,
  setShowAuthModal,
  setIsSignedIn
}) => {
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  
  // Mock user data (replace with actual user from Redux if you have auth)
  const user = {
    name: 'Anil Kumar Gupta',
    email: 'guptaka691@gmail.com',
    username: 'guptaka69176872',
    avatar: '/api/placeholder/32/32'
  };

  return (
    <div className={`${showSidebar ? 'w-64' : 'w-16'} bg-gray-900 border-r border-gray-700 flex flex-col transition-all duration-300`}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          {showSidebar && (
            <span className="text-xl font-semibold text-white">AI4U</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          <button
            onClick={() => setCurrentView('home')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'home' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Home size={20} />
            {showSidebar && <span>Home</span>}
          </button>
          
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors">
            <Book size={20} />
            {showSidebar && <span>Library</span>}
          </button>
          
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors">
            <Code size={20} />
            {showSidebar && <span>Coding</span>}
          </button>
          
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors">
            <MessageSquare size={20} />
            {showSidebar && <span>Chats</span>}
          </button>
        </nav>

        {showSidebar && (
          <div className="mt-8">
            <h3 className="text-gray-400 text-sm font-medium mb-3">Library</h3>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors text-left">
              <span className="text-lg">+</span>
              Create a Thread
            </button>
          </div>
        )}
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-gray-700">
        {isSignedIn ? (
          <div className="relative">
            <button
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
              {showSidebar && (
                <>
                  <div className="flex-1 text-left">
                    <div className="text-white text-sm font-medium">{user.name}</div>
                    <div className="text-gray-400 text-xs">Pro</div>
                  </div>
                  <ChevronDown size={16} className="text-gray-400" />
                </>
              )}
            </button>

            {showAccountDropdown && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg">
                <button
                  onClick={() => {
                    setCurrentView('account');
                    setShowAccountDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <User size={16} />
                  Account
                </button>
                <button
                  onClick={() => {
                    setCurrentView('settings');
                    setShowAccountDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <Settings size={16} />
                  Settings
                </button>
                <button
                  onClick={() => setIsSignedIn(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 transition-colors border-t border-gray-600"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showSidebar ? 'Sign In' : <User size={20} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;