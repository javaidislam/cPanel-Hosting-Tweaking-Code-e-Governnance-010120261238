
import React from 'react';
import { Department, Official, DesignationLevel } from '../types/shared.ts';

interface SidebarProps {
  currentModule: string;
  onChangeModule: (module: string) => void;
  currentUser: Official;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentModule, onChangeModule, currentUser, onLogout }) => {
  // Define available menu items
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt', minLevel: DesignationLevel.CLERK },
    { id: 'notesheet', label: 'e-Note Sheet', icon: 'fa-file-signature', minLevel: DesignationLevel.CLERK },
    { id: 'assets', label: 'Asset Management', icon: 'fa-building', minLevel: DesignationLevel.SUPERINTENDENT },
    { id: 'config', label: 'System Configuration', icon: 'fa-cogs', minLevel: DesignationLevel.SECTION_OFFICER },
  ];

  const menuItems = allMenuItems.filter(item => currentUser.level <= item.minLevel);

  return (
    <div className="w-64 bg-gov-green h-screen flex flex-col fixed left-0 top-0 shadow-xl z-50 text-white">
      <div className="p-6 flex flex-col items-center border-b border-green-700 bg-green-900">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg overflow-hidden">
           <i className="fas fa-star-and-crescent text-gov-green text-4xl"></i>
        </div>
        <h1 className="text-xl font-serif font-bold text-center leading-tight">Govt. of Province</h1>
        <p className="text-xs text-green-200 mt-1 uppercase tracking-wider">Secretariat ERP</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul>
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onChangeModule(item.id)}
                className={`w-full flex items-center px-6 py-4 text-left transition-colors duration-200 ${
                  currentModule === item.id
                    ? 'bg-gov-gold text-green-900 font-semibold shadow-inner'
                    : 'text-green-100 hover:bg-green-700'
                }`}
              >
                <i className={`fas ${item.icon} w-6 text-center mr-3`}></i>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-green-700 bg-green-900">
        <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 text-sm text-green-100 hover:text-white hover:bg-green-800 py-2 rounded transition-colors"
        >
          <i className="fas fa-sign-out-alt"></i>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};