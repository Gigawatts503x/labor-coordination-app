// frontend/src/App.js
import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import EventDetails from './pages/EventDetails';
import Technicians from './pages/Technicians';
import './styles/App.css';

const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard', 'technicians'

  return (
    <div className="app">
      <nav className="app-nav">
        <div className="nav-brand">
          <h1>Labor Coordination</h1>
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
              className={currentPage === 'technicians' ? 'active' : ''}
              onClick={() => setCurrentPage('technicians')}
            >
              👤 Technicians
            </button>
          </li>
        </ul>
      </nav>

      <main className="app-main">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'technicians' && <Technicians />}
      </main>
    </div>
  );
};

export default App;
