// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Technicians from './pages/Technicians';
import EventDetails from './pages/EventDetails';
import ScheduleGrid from './pages/ScheduleGrid';
import { initializeDarkMode } from './utils/darkMode';
import './styles/App.css';

function App() {
  const [page, setPage] = useState('dashboard');
  const [selectedEventId, setSelectedEventId] = useState(null);

  useEffect(() => {
    initializeDarkMode();
  }, []);

  const handleNavigateToEvent = (eventId) => {
    setSelectedEventId(eventId);
    setPage('event-details');
  };

  return (
    <div className="app">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="nav-logo">Tech Mentor Louisville</h1>
          <div className="nav-menu">
            <button
              className={`nav-item ${page === 'dashboard' ? 'active' : ''}`}
              onClick={() => setPage('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`nav-item ${page === 'schedule-grid' ? 'active' : ''}`}
              onClick={() => setPage('schedule-grid')}
            >
              Schedule Grid
            </button>
            <button
              className={`nav-item ${page === 'technicians' ? 'active' : ''}`}
              onClick={() => setPage('technicians')}
            >
              Technicians
            </button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="main-content">
        {page === 'dashboard' && <Dashboard onNavigateToEvent={handleNavigateToEvent} />}
        {page === 'event-details' && selectedEventId && (
          <EventDetails
            eventId={selectedEventId}
            onBack={() => setPage('dashboard')}
          />
        )}
        {page === 'schedule-grid' && <ScheduleGrid />}
        {page === 'technicians' && <Technicians />}
      </main>
    </div>
  );
}

export default App;
