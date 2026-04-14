import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Send, Search, Calendar, Users, TrendingUp, UserPlus } from 'lucide-react';
import './DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'User';
  const userId = localStorage.getItem('userId');
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    totalPlatformEvents: 0,
    myEvents: 0,
    courses: 0,
    auditions: 0,
    contests: 0,
    workshops: 0
  });

  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId]);

  const fetchStats = async () => {
    try {
      // Fetch User Stats (Followers/Connections)
      const profileResponse = await fetch(`/api/profile/${userId}`);
      let userData = { followers: 0, following: 0 };
      if (profileResponse.ok) {
        userData = await profileResponse.json();
      }
        
      // Fetch User Events
      const userEventsResponse = await fetch(`/api/events/user/${userId}`);
      let userEventsData = [];
      if (userEventsResponse.ok) {
        userEventsData = await userEventsResponse.json();
      }

      // Fetch Total Platform Events
      const allEventsResponse = await fetch('/api/events');
      let allEventsData = [];
      if (allEventsResponse.ok) {
        allEventsData = await allEventsResponse.json();
      }
          
      const breakdown = {
        courses: userEventsData.filter(e => e.eventType?.toLowerCase().includes('course')).length,
        auditions: userEventsData.filter(e => e.eventType?.toLowerCase().includes('audition')).length,
        contests: userEventsData.filter(e => e.eventType?.toLowerCase().includes('contest')).length,
        workshops: userEventsData.filter(e => e.eventType?.toLowerCase().includes('workshop')).length
      };

      setStats({
        followers: userData.followers || 0,
        following: userData.following || 0,
        totalPlatformEvents: allEventsData.length,
        myEvents: userEventsData.length,
        ...breakdown
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const quickActions = [
    { label: 'Post Feed', icon: <Plus size={24} />, color: '#ff8c00', path: '/' },
    { label: 'Message', icon: <Send size={24} />, color: '#ff4c3b', path: '/messages' },
    { label: 'Find Crew', icon: <Search size={24} />, color: '#10b981', path: '/search' },
    { label: 'Create Event', icon: <Calendar size={24} />, color: '#3b82f6', path: '/events' },
  ];

  return (
    <div className="dashboard-container">
      {/* Banner */}
      <div className="dashboard-banner">
        <img 
          src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=2070" 
          alt="Banner" 
          className="banner-image"
        />
      </div>

      {/* Welcome Message */}
      <div className="welcome-card card">
        <h1>Welcome To CrewCanvas !</h1>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-grid">
        {quickActions.map((action, index) => (
          <div 
            key={index} 
            className="action-card card"
            onClick={() => navigate(action.path)}
          >
            <div className="action-icon-circle" style={{ backgroundColor: action.color }}>
              {React.cloneElement(action.icon, { color: '#fff' })}
            </div>
            <span className="action-label">{action.label}</span>
          </div>
        ))}
      </div>

      {/* Stats Section */}
      <div className="stats-grid">
        <div className="stat-card card followers-card">
          <div className="card-accent-bar orange"></div>
          <div className="stat-header">
            <Users className="stat-icon orange-text" size={32} />
            <div className="stat-info">
              <span className="stat-label">Followers</span>
              <h2 className="stat-value">{stats.followers}</h2>
            </div>
          </div>
        </div>

        <div className="stat-card card following-card">
          <div className="card-accent-bar blue"></div>
          <div className="stat-header">
            <UserPlus className="stat-icon blue-text" size={32} />
            <div className="stat-info">
              <span className="stat-label">Following</span>
              <h2 className="stat-value">{stats.following}</h2>
            </div>
          </div>
        </div>

        <div className="stat-card card platform-card">
          <div className="card-accent-bar green"></div>
          <div className="stat-header">
            <TrendingUp className="stat-icon green-text" size={32} />
            <div className="stat-info">
              <span className="stat-label">Total Platform Events</span>
              <h2 className="stat-value">{stats.totalPlatformEvents}</h2>
            </div>
          </div>
        </div>

        <div className="stat-card card events-card">
          <div className="card-accent-bar dark"></div>
          <div className="stat-header">
             <div className="calendar-icon-bg">
                <Calendar size={24} className="orange-text" />
             </div>
             <div className="stat-info">
               <span className="stat-label text-uppercase">MY EVENTS</span>
               <h2 className="stat-value">{stats.myEvents}</h2>
             </div>
          </div>
          <div className="events-breakdown">
             <div className="breakdown-item">
                <span className="dot orange-dot"></span>
                <span className="breakdown-label">Courses</span>
                <span className="breakdown-value">{stats.courses}</span>
             </div>
             <div className="breakdown-item">
                <span className="dot blue-dot"></span>
                <span className="breakdown-label">Auditions</span>
                <span className="breakdown-value">{stats.auditions}</span>
             </div>
             <div className="breakdown-item">
                <span className="dot green-dot"></span>
                <span className="breakdown-label">Contests</span>
                <span className="breakdown-value">{stats.contests}</span>
             </div>
             <div className="breakdown-item">
                <span className="dot purple-dot"></span>
                <span className="breakdown-label">Workshops</span>
                <span className="breakdown-value">{stats.workshops}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
