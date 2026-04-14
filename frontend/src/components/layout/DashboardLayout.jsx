import React from 'react';
import Sidebar from './Sidebar';
import { Search, Bell, Settings } from 'lucide-react';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  const userName = localStorage.getItem('userName') || 'User';

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="header-spacer"></div>
          <div className="header-actions">
            <div className="user-profile-circle">
              {userName.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
