// frontend/src/pages/Dashboard.js
import React, { useState } from 'react';
import { useEvents } from '../hooks/useEvents';
import EventDetails from './EventDetails';
import '../styles/Dashboard.css';
import TechSchedule from './TechSchedule';
import GanttTimeline from './GanttTimeline';



const Dashboard = () => {
  const { events, loading, error, addEvent } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [viewMode, setViewMode] = useState('events'); // 'events' or 'schedule'
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    client_name: '',
    client_contact: '',
    client_phone: '',
    client_email: '',
    client_address: '',
    po_number: '',
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
    try {
      await addEvent(formData);
      setFormData({
        name: '',
        client_name: '',
        client_contact: '',
        client_phone: '',
        client_email: '',
        client_address: '',
        po_number: '',
      });
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  if (loading) return <div className="dashboard">Loading events...</div>;
  if (error) return <div className="dashboard error">Error: {error}</div>;

  if (selectedEventId) {
    return (
      <EventDetails 
        eventId={selectedEventId}
        onBack={() => setSelectedEventId(null)}
      />
    );
  }

    return (
<div className="dashboard">
  <header className="dashboard-header">
    <h1>Labor Coordinator Dashboard</h1>
    <div className="view-tabs">
      <button 
        className={`tab ${viewMode === 'events' ? 'active' : ''}`}
        onClick={() => setViewMode('events')}
      >
        Events
      </button>
      <button 
        className={`tab ${viewMode === 'gantt' ? 'active' : ''}`}
        onClick={() => setViewMode('gantt')}
      >
      Gantt Timeline
      </button>

      <button 
        className={`tab ${viewMode === 'schedule' ? 'active' : ''}`}
        onClick={() => setViewMode('schedule')}
      >
        Tech Schedule
      </button>
    </div>
    {viewMode === 'events' && (
      <button
        className="btn btn-primary"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? 'Cancel' : '+ New Event'}
      </button>
    )}
  </header>

  {viewMode === 'events' ? (
    // Events view
    <>
      {showForm && (
        <form className="event-form" onSubmit={handleSubmit}>
          <h2>Create New Event</h2>
          <div className="form-group">
            <label>Event Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Client Name *</label>
              <input
                type="text"
                name="client_name"
                value={formData.client_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Contact Person</label>
              <input
                type="text"
                name="client_contact"
                value={formData.client_contact}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="client_phone"
                value={formData.client_phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="client_email"
                value={formData.client_email}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="client_address"
              value={formData.client_address}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>PO Number</label>
            <input
              type="text"
              name="po_number"
              value={formData.po_number}
              onChange={handleInputChange}
            />
          </div>

          <button type="submit" className="btn btn-success">
            Create Event
          </button>
        </form>
      )
      }
    
      <div className="events-list">
        <h2>Events ({events.length})</h2>
        {events.length === 0 ? (
          <p className="empty-state">No events yet. Create one to get started!</p>
        ) : (
          <div className="cards">
            {events.map((event) => (
              <div key={event.id} className="event-card">
                <h3>{event.name}</h3>
                <p><strong>Client:</strong> {event.client_name}</p>
                <p><strong>Contact:</strong> {event.client_contact}</p>
                <p><strong>Phone:</strong> {event.client_phone}</p>
                <p><strong>Email:</strong> {event.client_email}</p>
                <p><strong>Address:</strong> {event.client_address}</p>
                <p><strong>PO #:</strong> {event.po_number}</p>
                <p className="date">
                  Created: {new Date(event.created_at).toLocaleDateString()}
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setSelectedEventId(event.id)}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
) : viewMode === 'schedule' ? (
  <TechSchedule onBack={() => setViewMode('events')} />
) : (
  <GanttTimeline />
)}


  {selectedEventId && (
    <EventDetails 
      eventId={selectedEventId}
      onBack={() => setSelectedEventId(null)}
    />
  )}
</div>
  );
};

export default Dashboard;
