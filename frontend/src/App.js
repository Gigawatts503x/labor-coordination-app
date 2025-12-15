// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Technicians from './pages/Technicians';
import EventDetails from './pages/EventDetails';
import ScheduleGrid from './pages/ScheduleGrid';
import { initializeDarkMode } from './utils/darkMode';
import ScheduleGridAdvanced from './pages/ScheduleGridAdvanced';
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

  const handleNavigateToSchedule = (eventId) => {
    setSelectedEventId(eventId);
    setPage('schedule-grid');
  };

  const handleNavigateToAdvancedSchedule = (eventId) => {
    setSelectedEventId(eventId);
    setPage('schedule-advanced');
  };

  return (
    <div className="app">
      <header className="app-header">
        <button
          className="nav-button"
          onClick={() => setPage('dashboard')}
          style={{
            fontWeight: page === 'dashboard' ? 'bold' : 'normal',
          }}
        >
          📊 Dashboard
        </button>
        <button
          className="nav-button"
          onClick={() => setPage('technicians')}
          style={{
            fontWeight: page === 'technicians' ? 'bold' : 'normal',
          }}
        >
          👥 Technicians
        </button>
      </header>

      <main className="app-content">
        {page === 'dashboard' && (
          <Dashboard
            onSelectEvent={handleNavigateToEvent}
            onSelectSchedule={handleNavigateToSchedule}
            onSelectAdvancedSchedule={handleNavigateToAdvancedSchedule}
          />
        )}
        {page === 'technicians' && <Technicians />}
        {page === 'event-details' && (
          <EventDetails
            eventId={selectedEventId}
            onBack={() => setPage('dashboard')}
          />
        )}
        {page === 'schedule-grid' && (
          <ScheduleGrid
            eventId={selectedEventId}
            onBack={() => setPage('dashboard')}
          />
        )}
        {page === 'schedule-advanced' && (
          <ScheduleGridAdvanced
            eventId={selectedEventId}
            onBack={() => setPage('dashboard')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
