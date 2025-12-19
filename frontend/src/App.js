// frontend/src/App.js
import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import EventDetails from './pages/EventDetails';
import Technicians from './pages/Technicians';
import ScheduleGrid from './pages/ScheduleGrid';
import Settings from './pages/Settings';
import './styles/App.css';
import { DataStoreProvider } from './context/DataStoreContext';

function App() {
  return (
    <DataStoreProvider>
      <Router>{/* your content */}</Router>
    </DataStoreProvider>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedEventId, setSelectedEventId] = useState(null);

  const handleNavigateToEvent = (eventId) => {
    setSelectedEventId(eventId);
    setCurrentPage('event-details');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    setSelectedEventId(null);
  };

  return (
    <div className="app">
      {/* Navigation Bar */}
      <nav className="app-nav">
        <div className="nav-brand">
          <h1>📋 Labor Coordinator</h1>
        </div>
        <ul className="nav-links">
          <li>
            <button 
              className={currentPage === 'dashboard' ? 'active' : ''}
              onClick={() => setCurrentPage('dashboard')}
            >
              📅 Events
            </button>
          </li>
          <li>
            <button 
              className={currentPage === 'schedule' ? 'active' : ''}
              onClick={() => setCurrentPage('schedule')}
            >
              🗓️ Schedule
            </button>
          </li>
          <li>
            <button 
              className={currentPage === 'technicians' ? 'active' : ''}
              onClick={() => setCurrentPage('technicians')}
            >
              👤 Technicians
            </button>
          </li>
          <li>
            <button 
              className={currentPage === 'settings' ? 'active' : ''}
              onClick={() => setCurrentPage('settings')}
            >
              ⚙️ Settings
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {currentPage === 'dashboard' && (
          <Dashboard onNavigateToEvent={handleNavigateToEvent} />
        )}
        
        {currentPage === 'event-details' && selectedEventId && (
          <EventDetails 
            eventId={selectedEventId}
            onBackToDashboard={handleBackToDashboard}
          />
        )}
        
        {currentPage === 'technicians' && (
          <Technicians />
        )}
        
        {currentPage === 'schedule' && (
          <ScheduleGrid onNavigateToEvent={handleNavigateToEvent} />
        )}

        {currentPage === 'settings' && (
          <Settings />
        )}
      </main>
    </div>
  );
}

export default App;
