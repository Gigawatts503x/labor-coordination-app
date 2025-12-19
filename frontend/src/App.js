import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ScheduleGrid from './pages/ScheduleGrid';
import EventDetails from './pages/EventDetails';
import Technicians from './pages/Technicians';
import Settings from './pages/Settings';
import { DataStoreProvider } from './context/DataStoreContext';
import './styles/App.css';

/**
 * Main App Content Component
 * Contains all pages and navigation
 * This is INSIDE the DataStoreProvider
 */
function AppContent() {
  const [activeNav, setActiveNav] = useState('dashboard');

  const handleNavClick = (navItem) => {
    setActiveNav(navItem);
  };

  return (
    <Router>
      <div className="app-container">
        {/* Navigation Header */}
        <nav className="app-nav">
          <div className="nav-brand">
            <h1>AV Labor Coordinator</h1>
          </div>
          <div className="nav-menu">
            <Link
              to="/"
              className={`nav-link ${activeNav === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick('dashboard')}
            >
              Dashboard
            </Link>
            <Link
              to="/schedule"
              className={`nav-link ${activeNav === 'schedule' ? 'active' : ''}`}
              onClick={() => handleNavClick('schedule')}
            >
              Schedule
            </Link>
            <Link
              to="/technicians"
              className={`nav-link ${activeNav === 'technicians' ? 'active' : ''}`}
              onClick={() => handleNavClick('technicians')}
            >
              Technicians
            </Link>
            <Link
              to="/settings"
              className={`nav-link ${activeNav === 'settings' ? 'active' : ''}`}
              onClick={() => handleNavClick('settings')}
            >
              Settings
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/schedule" element={<ScheduleGrid />} />
            <Route path="/event/:eventId" element={<EventDetails />} />
            <Route path="/technicians" element={<Technicians />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

/**
 * Root App Component
 * Wraps everything with DataStoreProvider
 * This is the ONLY function named "App"
 */
function App() {
  return (
    <DataStoreProvider>
      <AppContent />
    </DataStoreProvider>
  );
}

export default App;