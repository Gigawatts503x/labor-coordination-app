// frontend/src/pages/Settings.js
import React, { useState, useEffect } from 'react';
import '../styles/Settings.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    // Business Settings
    companyName: localStorage.getItem('companyName') || 'Tech Mentor Louisville',
    companyPhone: localStorage.getItem('companyPhone') || '',
    companyEmail: localStorage.getItem('companyEmail') || '',
    companyAddress: localStorage.getItem('companyAddress') || '',
    
    // Invoice Settings
    invoicePrefix: localStorage.getItem('invoicePrefix') || 'INV',
    invoiceLogo: localStorage.getItem('invoiceLogo') || '',
    paymentTerms: localStorage.getItem('paymentTerms') || '30',
    
    // Display Settings
    theme: localStorage.getItem('theme') || 'light',
    dateFormat: localStorage.getItem('dateFormat') || 'MM/DD/YYYY',
    timeFormat: localStorage.getItem('timeFormat') || '12h',
    
    // Business Rules
    defaultHourlyRate: localStorage.getItem('defaultHourlyRate') || '50',
    defaultHalfDayRate: localStorage.getItem('defaultHalfDayRate') || '250',
    defaultFullDayRate: localStorage.getItem('defaultFullDayRate') || '500',
    hoursPerHalfDay: localStorage.getItem('hoursPerHalfDay') || '4',
    hoursPerFullDay: localStorage.getItem('hoursPerFullDay') || '8',
  });

  const [saveStatus, setSaveStatus] = useState('');
  const [activeTab, setActiveTab] = useState('business');

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = () => {
    // Save to localStorage
    Object.keys(settings).forEach(key => {
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
      Object.keys(defaults).forEach(key => {
        localStorage.setItem(key, defaults[key]);
      });
      setSaveStatus('✅ Settings reset to defaults!');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <h1>⚙️ Settings</h1>
        <p>Manage your app configuration and business settings</p>
      </div>

      {/* Save Status */}
      {saveStatus && (
        <div className="save-status">
          {saveStatus}
        </div>
      )}

      {/* Tabs */}
      <div className="settings-tabs">
        <button 
          className={`tab-btn ${activeTab === 'business' ? 'active' : ''}`}
          onClick={() => setActiveTab('business')}
        >
          🏢 Business
        </button>
        <button 
          className={`tab-btn ${activeTab === 'invoice' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoice')}
        >
          📄 Invoice
        </button>
        <button 
          className={`tab-btn ${activeTab === 'display' ? 'active' : ''}`}
          onClick={() => setActiveTab('display')}
        >
          🎨 Display
        </button>
        <button 
          className={`tab-btn ${activeTab === 'rates' ? 'active' : ''}`}
          onClick={() => setActiveTab('rates')}
        >
          💰 Rates
        </button>
      </div>

      {/* Settings Content */}
      <div className="settings-content">
        {/* Business Settings */}
        {activeTab === 'business' && (
          <div className="settings-section">
            <h2>Business Information</h2>
            <p className="section-description">Configure your company details</p>

            <div className="form-group">
              <label>Company Name</label>
              <input 
                type="text"
                value={settings.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Your company name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="tel"
                value={settings.companyPhone}
                onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                placeholder="(555) 123-4567"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email"
                value={settings.companyEmail}
                onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                placeholder="business@example.com"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea 
                value={settings.companyAddress}
                onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                placeholder="Street Address&#10;City, State ZIP"
                className="form-textarea"
                rows="3"
              />
            </div>
          </div>
        )}

        {/* Invoice Settings */}
        {activeTab === 'invoice' && (
          <div className="settings-section">
            <h2>Invoice Settings</h2>
            <p className="section-description">Configure invoice defaults</p>

            <div className="form-group">
              <label>Invoice Prefix</label>
              <input 
                type="text"
                value={settings.invoicePrefix}
                onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
                placeholder="INV"
                maxLength="5"
                className="form-input"
              />
              <small>Used for invoice numbering (INV-001, INV-002, etc.)</small>
            </div>

            <div className="form-group">
              <label>Payment Terms (days)</label>
              <input 
                type="number"
                value={settings.paymentTerms}
                onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                placeholder="30"
                min="0"
                max="180"
                className="form-input"
              />
              <small>Number of days before payment is due</small>
            </div>

            <div className="form-group">
              <label>Logo URL (optional)</label>
              <input 
                type="text"
                value={settings.invoiceLogo}
                onChange={(e) => handleInputChange('invoiceLogo', e.target.value)}
                placeholder="https://example.com/logo.png"
                className="form-input"
              />
              <small>URL to your company logo for invoices</small>
            </div>
          </div>
        )}

        {/* Display Settings */}
        {activeTab === 'display' && (
          <div className="settings-section">
            <h2>Display Settings</h2>
            <p className="section-description">Customize how information is displayed</p>

            <div className="form-group">
              <label>Theme</label>
              <select 
                value={settings.theme}
                onChange={(e) => handleInputChange('theme', e.target.value)}
                className="form-select"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date Format</label>
              <select 
                value={settings.dateFormat}
                onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                className="form-select"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY (United States)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (International)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Time Format</label>
              <select 
                value={settings.timeFormat}
                onChange={(e) => handleInputChange('timeFormat', e.target.value)}
                className="form-select"
              >
                <option value="12h">12-hour (2:30 PM)</option>
                <option value="24h">24-hour (14:30)</option>
              </select>
            </div>
          </div>
        )}

        {/* Rate Settings */}
        {activeTab === 'rates' && (
          <div className="settings-section">
            <h2>Default Technician Rates</h2>
            <p className="section-description">Set default billing rates for technicians</p>

            <div className="rate-group">
              <h3>Hourly Rates</h3>
              
              <div className="form-group">
                <label>Hourly Rate ($)</label>
                <input 
                  type="number"
                  value={settings.defaultHourlyRate}
                  onChange={(e) => handleInputChange('defaultHourlyRate', e.target.value)}
                  placeholder="50"
                  min="0"
                  step="0.01"
                  className="form-input"
                />
                <small>Rate per hour of work</small>
              </div>

              <div className="form-group">
                <label>Half-Day Rate ($)</label>
                <input 
                  type="number"
                  value={settings.defaultHalfDayRate}
                  onChange={(e) => handleInputChange('defaultHalfDayRate', e.target.value)}
                  placeholder="250"
                  min="0"
                  step="0.01"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Full-Day Rate ($)</label>
                <input 
                  type="number"
                  value={settings.defaultFullDayRate}
                  onChange={(e) => handleInputChange('defaultFullDayRate', e.target.value)}
                  placeholder="500"
                  min="0"
                  step="0.01"
                  className="form-input"
                />
              </div>
            </div>

            <div className="rate-group">
              <h3>Hour Definitions</h3>
              
              <div className="form-group">
                <label>Hours per Half-Day</label>
                <input 
                  type="number"
                  value={settings.hoursPerHalfDay}
                  onChange={(e) => handleInputChange('hoursPerHalfDay', e.target.value)}
                  placeholder="4"
                  min="1"
                  max="24"
                  className="form-input"
                />
                <small>Defines what constitutes a half-day</small>
              </div>

              <div className="form-group">
                <label>Hours per Full-Day</label>
                <input 
                  type="number"
                  value={settings.hoursPerFullDay}
                  onChange={(e) => handleInputChange('hoursPerFullDay', e.target.value)}
                  placeholder="8"
                  min="1"
                  max="24"
                  className="form-input"
                />
                <small>Defines what constitutes a full-day</small>
              </div>
            </div>

            <div className="rate-info">
              <p><strong>Example:</strong></p>
              <p>If hourly rate is $50/hr, half-day is $250, and full-day is $500:</p>
              <ul>
                <li>2 hours = $100 (hourly)</li>
                <li>4 hours = $250 (half-day)</li>
                <li>8 hours = $500 (full-day)</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="settings-actions">
        <button 
          onClick={handleSaveSettings}
          className="btn-save"
        >
          💾 Save Settings
        </button>
        <button 
          onClick={handleResetSettings}
          className="btn-reset"
        >
          🔄 Reset to Defaults
        </button>
      </div>

      {/* Info Box */}
      <div className="settings-info">
        <h3>ℹ️ About Settings</h3>
        <p>
          Settings are saved to your browser's local storage. They are specific to this device and browser. 
          If you clear your browser cache, settings will be reset to defaults. Consider backing up your settings 
          if you need them on multiple devices.
        </p>
      </div>
    </div>
  );
};

export default Settings;
