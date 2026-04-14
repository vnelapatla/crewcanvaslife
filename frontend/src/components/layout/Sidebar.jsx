import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Newspaper, Search, MessageSquare, Film, Settings, LogOut } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const mainNavItems = [
    { icon: <Newspaper size={20} />, label: 'Feed', path: '/' },
    { icon: <Home size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Search size={20} />, label: 'Crew Search', path: '/search' },
    { icon: <MessageSquare size={20} />, label: 'Messages', path: '/messages' },
    { icon: <Film size={20} />, label: 'Events', path: '/events' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/auth';
  };

  return (
    <aside className="sidebar glass">
      <div className="sidebar-brand">
        <h2 className="gradient-text">CrewCanvas</h2>
        <p>Where all crafts connect</p>
      </div>

      <nav className="sidebar-nav">
        {mainNavItems.map((item) => (
          <NavLink 
            key={item.label} 
            to={item.path} 
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
        <NavLink 
          to="/settings" 
          className={({ isActive }) => `sidebar-item mobile-hidden ${isActive ? 'active' : ''}`}
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          <span>Exit Studio</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
