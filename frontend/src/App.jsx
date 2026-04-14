import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage';
import EventsPage from './pages/EventsPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import MessagesPage from './pages/MessagesPage';
import DashboardLayout from './components/layout/DashboardLayout';
import './index.css';

function App() {
  const isAuthenticated = !!localStorage.getItem('userId');

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <FeedPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/auth" />
            )
          } 
        />

        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/auth" />
            )
          } 
        />

        <Route 
          path="/events" 
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <EventsPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/auth" />
            )
          } 
        />

        <Route 
          path="/messages" 
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <MessagesPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/auth" />
            )
          } 
        />

        <Route 
          path="/profile" 
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <ProfilePage />
              </DashboardLayout>
            ) : (
              <Navigate to="/auth" />
            )
          } 
        />

        <Route 
          path="/profile/:userId" 
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <ProfilePage />
              </DashboardLayout>
            ) : (
              <Navigate to="/auth" />
            )
          } 
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
