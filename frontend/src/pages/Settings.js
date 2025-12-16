// frontend/src/pages/Settings.js - UPDATED with POSITIONS MANAGEMENT

import React, { useState, useEffect } from 'react';
import { getPositions, createPosition, deletePosition } from '../utils/api';
import '../styles/Settings.css';

// ==================== POSITIONS DIALOG ====================

const PositionsDialog = ({ isOpen, onClose, onSave }) => {
  const [positions, setPositions] = useState([]);
  const [newPosition, setNewPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Load positions on mount
  useEffect(() => {
    if (isOpen) {
      loadPositions();
    }
  }, [isOpen]);

  const loadPositions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getPositions();
      setPositions(response.data || []);
    } catch (err) {
      console.error('Error loading positions:', err);
      setError('Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPosition = async () => {
    if (!newPosition.trim()) return;

    // Check for duplicates
    if (positions.includes(newPosition.trim())) {
      setError(`"${newPosition}" already exists`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      await createPosition(newPosition.trim());
      setPositions([...positions, newPosition.trim()].sort());
      setNewPosition('');
    } catch (err) {
      console.error('Error adding position:', err);
      setError(err.response?.data?.error || 'Failed to add position');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePosition = async (positionName) => {
    if (!window.confirm(`Remove "${positionName}"?`)) return;

    try {
      setLoading(true);
      setError('');
      await deletePosition(positionName);
      setPositions(positions.filter(p => p !== positionName));
    } catch (err) {
      console.error('Error deleting position:', err);
      setError(err.response?.data?.error || 'Failed to delete position');
    } finally {
      setLoading(false);
    }
  };

  const filteredPositions = positions.filter(p =>
    p.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Positions</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-alert">{error}</div>}

          {/* Add Position */}
          <div className="form-group">
            <label htmlFor="new-position">Add New Position</label>
            <div className="input-group">
              <input
                id="new-position"
                type="text"
                className="form-control"
                placeholder="e.g., A1, LED Operator, Camera Op"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAddPosition();
                }}
                disabled={loading}
              />
              <button
                className="btn btn--primary"
                onClick={handleAddPosition}
                disabled={loading || !newPosition.trim()}
              >
                Add
              </button>
            </div>
          </div>

          {/* Search Filter */}
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search positions..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>

          {/* Positions List */}
          <div className="positions-list">
            {loading && filteredPositions.length === 0 ? (
              <p className="loading-text">Loading...</p>
            ) : filteredPositions.length === 0 ? (
              <p className="empty-text">
                {positions.length === 0
                  ? 'No positions yet. Add one to get started!'
                  : 'No positions match your search'}
              </p>
            ) : (
              filteredPositions.map((position) => (
                <div key={position} className="position-item">
                  <span className="position-name">{position}</span>
                  <button
                    className="btn btn--sm btn--outline"
                    onClick={() => handleDeletePosition(position)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="position-count">
            Total: {positions.length} position{positions.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn--primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN SETTINGS COMPONENT ====================

const Settings = () => {
  const [settings, setSettings] = useState({
    companyName: localStorage.getItem('companyName') || 'Tech Mentor Louisville',
    companyPhone: localStorage.getItem('companyPhone') || '',
    companyEmail: localStorage.getItem('companyEmail') || '',
    companyAddress: localStorage.getItem('companyAddress') || '',
    invoicePrefix: localStorage.getItem('invoicePrefix') || 'INV',
    invoiceLogo: localStorage.getItem('invoiceLogo') || '',
    paymentTerms: localStorage.getItem('paymentTerms') || '30',
    theme: localStorage.getItem('theme') || 'light',
    dateFormat: localStorage.getItem('dateFormat') || 'MM/DD/YYYY',
    timeFormat: localStorage.getItem('timeFormat') || '12h',
    defaultHourlyRate: localStorage.getItem('defaultHourlyRate') || '50',
    defaultHalfDayRate: localStorage.getItem('defaultHalfDayRate') || '250',
    defaultFullDayRate: localStorage.getItem('defaultFullDayRate') || '500',
    hoursPerHalfDay: localStorage.getItem('hoursPerHalfDay') || '4',
    hoursPerFullDay: localStorage.getItem('hoursPerFullDay') || '8',
  });

  const [saveStatus, setSaveStatus] = useState('');
  const [activeTab, setActiveTab] = useState('business');
  const [positionsDialogOpen, setPositionsDialogOpen] = useState(false);

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSettings = () => {
    Object.keys(settings).forEach((key) => {
      localStorage.setItem(key, settings[key]);
    });
    setSaveStatus('✅ Settings saved successfully!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure? This will reset all settings to defaults.')) {
      const defaults = {
        companyName: 'Tech Mentor Louisville',
        companyPhone: '',
        companyEmail: '',
        companyAddress: '',
        invoicePrefix: 'INV',
        invoiceLogo: '',
        paymentTerms: '30',
        theme: 'light',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        defaultHourlyRate: '50',
        defaultHalfDayRate: '250',
        defaultFullDayRate: '500',
        hoursPerHalfDay: '4',
        hoursPerFullDay: '8',
      };
      setSettings(defaults);
      Object.keys(defaults).forEach((key) => {
        localStorage.setItem(key, defaults[key]);
      });
      setSaveStatus('✅ Settings reset to defaults!');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your app configuration and business settings</p>
      </div>

      {saveStatus && <div className="save-status">{saveStatus}</div>}

      {/* Tab Navigation */}
      <div className="settings-tabs">
        <button
          className={`tab-btn ${activeTab === 'business' ? 'active' : ''}`}
          onClick={() => setActiveTab('business')}
        >
          Business
        </button>
        <button
          className={`tab-btn ${activeTab === 'positions' ? 'active' : ''}`}
          onClick={() => setActiveTab('positions')}
        >
          Positions
        </button>
        <button
          className={`tab-btn ${activeTab === 'invoice' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoice')}
        >
          Invoice
        </button>
        <button
          className={`tab-btn ${activeTab === 'display' ? 'active' : ''}`}
          onClick={() => setActiveTab('display')}
        >
          Display
        </button>
        <button
          className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          Billing Rates
        </button>
      </div>

      {/* BUSINESS TAB */}
      {activeTab === 'business' && (
        <div className="settings-content">
          <div className="settings-section">
            <h2>Company Details</h2>
            <p className="section-description">Configure your company information</p>

            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                className="form-input"
                value={settings.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                className="form-input"
                value={settings.companyPhone}
                onChange={(e) => handleInputChange('companyPhone', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="form-input"
                value={settings.companyEmail}
                onChange={(e) => handleInputChange('companyEmail', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                className="form-textarea"
                value={settings.companyAddress}
                onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                rows="3"
              />
            </div>

            <div className="button-group">
              <button className="btn btn--primary" onClick={handleSaveSettings}>
                Save Settings
              </button>
              <button className="btn btn--outline" onClick={handleResetSettings}>
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POSITIONS TAB ✅ NEW */}
      {activeTab === 'positions' && (
        <div className="settings-content">
          <div className="settings-section">
            <h2>Job Positions</h2>
            <p className="section-description">
              Manage the list of positions available for scheduling (e.g., A1, Camera Op, LED, etc.)
            </p>

            <div className="positions-section">
              <p>These positions will appear in the Schedule Grid for drag-and-drop assignment.</p>
              <button
                className="btn btn--primary btn--lg"
                onClick={() => setPositionsDialogOpen(true)}
              >
                Manage Positions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE TAB */}
      {activeTab === 'invoice' && (
        <div className="settings-content">
          <div className="settings-section">
            <h2>Invoice Settings</h2>
            <p className="section-description">Configure invoice defaults</p>

            <div className="form-group">
              <label>Invoice Prefix</label>
              <input
                type="text"
                className="form-input"
                value={settings.invoicePrefix}
                onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
                placeholder="INV"
              />
              <small>Example: INV-2024-001</small>
            </div>

            <div className="form-group">
              <label>Payment Terms (Days)</label>
              <input
                type="number"
                className="form-input"
                value={settings.paymentTerms}
                onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
              />
            </div>

            <button className="btn btn--primary" onClick={handleSaveSettings}>
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* DISPLAY TAB */}
      {activeTab === 'display' && (
        <div className="settings-content">
          <div className="settings-section">
            <h2>Display Settings</h2>
            <p className="section-description">Customize how information is displayed</p>

            <div className="form-group">
              <label>Theme</label>
              <select
                className="form-select"
                value={settings.theme}
                onChange={(e) => handleInputChange('theme', e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date Format</label>
              <select
                className="form-select"
                value={settings.dateFormat}
                onChange={(e) => handleInputChange('dateFormat', e.target.value)}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div className="form-group">
              <label>Time Format</label>
              <select
                className="form-select"
                value={settings.timeFormat}
                onChange={(e) => handleInputChange('timeFormat', e.target.value)}
              >
                <option value="12h">12 Hour (AM/PM)</option>
                <option value="24h">24 Hour</option>
              </select>
            </div>

            <button className="btn btn--primary" onClick={handleSaveSettings}>
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* BILLING RATES TAB */}
      {activeTab === 'billing' && (
        <div className="settings-content">
          <div className="settings-section">
            <h2>Billing Rates</h2>
            <p className="section-description">Set default billing rates for technicians</p>

            <div className="rate-group">
              <h3>Hourly Rates</h3>

              <div className="form-group">
                <label>Hourly Rate ($)</label>
                <input
                  type="number"
                  className="form-input"
                  value={settings.defaultHourlyRate}
                  onChange={(e) => handleInputChange('defaultHourlyRate', e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="rate-group">
              <h3>Daily Rates</h3>

              <div className="form-group">
                <label>Half-Day Rate ($)</label>
                <input
                  type="number"
                  className="form-input"
                  value={settings.defaultHalfDayRate}
                  onChange={(e) => handleInputChange('defaultHalfDayRate', e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Full-Day Rate ($)</label>
                <input
                  type="number"
                  className="form-input"
                  value={settings.defaultFullDayRate}
                  onChange={(e) => handleInputChange('defaultFullDayRate', e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Hours per Half-Day</label>
                <input
                  type="number"
                  className="form-input"
                  value={settings.hoursPerHalfDay}
                  onChange={(e) => handleInputChange('hoursPerHalfDay', e.target.value)}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Hours per Full-Day</label>
                <input
                  type="number"
                  className="form-input"
                  value={settings.hoursPerFullDay}
                  onChange={(e) => handleInputChange('hoursPerFullDay', e.target.value)}
                  min="1"
                />
              </div>

              <div className="rate-info">
                <p>
                  <strong>Example:</strong>
                </p>
                <p>
                  If hourly rate is ${settings.defaultHourlyRate}/hr, half-day is $
                  {settings.defaultHalfDayRate}, and full-day is ${settings.defaultFullDayRate}:
                </p>
                <ul>
                  <li>3 hours = Hourly rate applied</li>
                  <li>{settings.hoursPerHalfDay} hours = Half-day rate</li>
                  <li>{settings.hoursPerFullDay}+ hours = Full-day rate</li>
                </ul>
              </div>
            </div>

            <button className="btn btn--primary" onClick={handleSaveSettings}>
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Positions Dialog */}
      <PositionsDialog
        isOpen={positionsDialogOpen}
        onClose={() => setPositionsDialogOpen(false)}
      />
    </div>
  );
};

export default Settings;