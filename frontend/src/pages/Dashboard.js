// frontend/src/pages/Dashboard.js
// Main dashboard - displays events list and allows event creation

import React, { useState } from 'react';
import { useEvents } from '../hooks/useEvents';
import EventDetails from './EventDetails';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { events, loading, error, addEvent } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    clientname: '',
    clientcontact: '',
    clientphone: '',
    clientemail: '',
    clientaddress: '',
    ponumber: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      alert('Event name is required');
      return;
    }

    try {
      await addEvent(formData);
      setFormData({
        name: '',
        clientname: '',
        clientcontact: '',
        clientphone: '',
        clientemail: '',
        clientaddress: '',
        ponumber: '',
      });
      setShowForm(false);
      alert('✅ Event created successfully!');
    } catch (err) {
      console.error('Failed to create event:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId);
  };

  const handleBackFromDetails = () => {
    setSelectedEventId(null);
  };

  if (loading) {
    return <div className="dashboard loading">Loading events...</div>;
  }

  // Show event details if one is selected
  if (selectedEventId) {
    return (
      <EventDetails eventId={selectedEventId} onBack={handleBackFromDetails} />
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Labor Coordination Dashboard</h1>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ New Event'}
        </button>
      </header>

      {error && <div className="error-banner">Error: {error}</div>}

      {/* Create Event Form */}
      {showForm && (
        <form className="event-form" onSubmit={handleSubmit}>
          <h2>Create New Event</h2>

          <div className="form-group">
            <label htmlFor="name">Event Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Concert 2025"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clientname">Client Name</label>
              <input
                id="clientname"
                type="text"
                name="clientname"
                value={formData.clientname}
                onChange={handleInputChange}
                placeholder="Client name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="clientcontact">Contact Person</label>
              <input
                id="clientcontact"
                type="text"
                name="clientcontact"
                value={formData.clientcontact}
                onChange={handleInputChange}
                placeholder="Contact name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clientphone">Phone</label>
              <input
                id="clientphone"
                type="tel"
                name="clientphone"
                value={formData.clientphone}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="clientemail">Email</label>
              <input
                id="clientemail"
                type="email"
                name="clientemail"
                value={formData.clientemail}
                onChange={handleInputChange}
                placeholder="client@example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="clientaddress">Address</label>
            <input
              id="clientaddress"
              type="text"
              name="clientaddress"
              value={formData.clientaddress}
              onChange={handleInputChange}
              placeholder="Event venue address"
            />
          </div>

          <div className="form-group">
            <label htmlFor="ponumber">PO Number</label>
            <input
              id="ponumber"
              type="text"
              name="ponumber"
              value={formData.ponumber}
              onChange={handleInputChange}
              placeholder="Purchase order number"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Create Event
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Events List */}
      <section className="events-section">
        <h2>Events ({events.length})</h2>

        {events.length === 0 ? (
          <div className="empty-state">
            <p>📅 No events yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <div key={event.id} className="event-card">
                <div className="event-card-header">
                  <h3>{event.name}</h3>
                  <button
                    className="btn-view"
                    onClick={() => handleSelectEvent(event.id)}
                  >
                    View Details →
                  </button>
                </div>

                <div className="event-card-body">
                  {event.clientname && (
                    <div className="event-field">
                      <strong>Client:</strong> {event.clientname}
                    </div>
                  )}

                  {event.clientcontact && (
                    <div className="event-field">
                      <strong>Contact:</strong> {event.clientcontact}
                    </div>
                  )}

                  {event.clientphone && (
                    <div className="event-field">
                      <strong>Phone:</strong>{' '}
                      <a href={`tel:${event.clientphone}`}>{event.clientphone}</a>
                    </div>
                  )}

                  {event.clientemail && (
                    <div className="event-field">
                      <strong>Email:</strong>{' '}
                      <a href={`mailto:${event.clientemail}`}>{event.clientemail}</a>
                    </div>
                  )}

                  {event.clientaddress && (
                    <div className="event-field">
                      <strong>Address:</strong> {event.clientaddress}
                    </div>
                  )}

                  {event.ponumber && (
                    <div className="event-field">
                      <strong>PO #:</strong> {event.ponumber}
                    </div>
                  )}

                  {event.startdate && (
                    <div className="event-field">
                      <strong>Start:</strong> {event.startdate}
                    </div>
                  )}

                  {event.enddate && (
                    <div className="event-field">
                      <strong>End:</strong> {event.enddate}
                    </div>
                  )}

                  <div className="event-field meta">
                    <small>
                      Created: {new Date(event.createdat).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
