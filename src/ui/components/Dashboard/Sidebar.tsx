import React from 'react';
import type { TabConfig } from '../types';

interface SidebarProps {
  isRequesting: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabNames: TabConfig;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isRequesting,
  activeTab,
  setActiveTab,
  tabNames,
  onLogout
}) => {
  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 text-xl font-bold border-b">CRM</div>
      <nav className="flex-1 p-4 space-y-2">
        {Object.keys(tabNames).map((tab) => (
          <button
            key={tab}
            className={`flex items-center w-full text-left px-4 py-2 rounded ${
              activeTab === tab
                ? 'bg-green-500 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab(tab)}
            disabled={isRequesting} // ⬅ disable while running
          >
            <span className="mr-2">{tabNames[tab].icon}</span>
            {tabNames[tab].label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={onLogout}
          className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          disabled={isRequesting} // ⬅ disable while running
        >
          Logout
        </button>
      </div>
    </aside>
  );
};