// frontend/src/App.js
import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Technicians from './pages/Technicians';
import './styles/App.css';

function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <div className="App">
      <nav className="app-nav">
        <div className="nav-container">
          <h2 className="app-title">Labor Coordinator</h2>
          <ul className="nav-links">
            <li>
              <button
                className={`nav-link ${page === 'dashboard' ? 'active' : ''}`}
                onClick={() => setPage('dashboard')}
              >
                Events
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${page === 'technicians' ? 'active' : ''}`}
                onClick={() => setPage('technicians')}
              >
                Technicians
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <main className="app-main">
        {page === 'dashboard' && <Dashboard />}
        {page === 'technicians' && <Technicians />}
      </main>
    </div>
  );
}

export default App;
