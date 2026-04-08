import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-content animate-fade">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
