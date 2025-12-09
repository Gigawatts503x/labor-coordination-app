// frontend/src/pages/TechSchedule.js
import React, { useState, useEffect } from 'react';
import { getTechnicians, getTechSchedule, updateAssignment, deleteAssignment } from '../utils/api';
import '../styles/TechSchedule.css';

const TechSchedule = ({ onBack }) => {
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState(null);
  const [selectedTech, setSelectedTech] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // Load all technicians on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getTechnicians();
        setTechnicians(res.data);
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, []);

  // Load tech's schedule when selected
  useEffect(() => {
    if (!selectedTechId) return;

    const load = async () => {
      try {
        setLoading(true);
        const [techRes, schedRes] = await Promise.all([
          getTechnicians(),
          getTechSchedule(selectedTechId)
        ]);

        const tech = techRes.data.find(t => t.id === selectedTechId);
        setSelectedTech(tech);
        setAssignments(schedRes.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedTechId]);

  const handleEditStart = (assignment) => {
    setEditingId(assignment.id);
    setEditData({ ...assignment });
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = async () => {
    try {
      await updateAssignment(editingId, editData);
      setAssignments(assignments.map(a => a.id === editingId ? editData : a));
      setEditingId(null);
      setEditData({});
    } catch (err) {
      console.error('Failed to update assignment', err);
      setError(err.message);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Remove this assignment?')) return;
    try {
      await deleteAssignment(id);
      setAssignments(assignments.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete assignment', err);
      setError(err.message);
    }
  };

  // Calculate total pay and bill for selected tech
  const totalPay = assignments.reduce((sum, a) => sum + (a.calculated_pay || 0), 0);
  const totalBill = assignments.reduce((sum, a) => sum + (a.customer_bill || 0), 0);

  return (
    <div className="tech-schedule">
      <button className="btn btn-secondary" onClick={onBack}>
        ← Back
      </button>

      <header className="schedule-header">
        <div className="tech-selector">
          <label>Select Technician</label>
          <select
            value={selectedTechId || ''}
            onChange={(e) => setSelectedTechId(e.target.value)}
          >
            <option value="">Choose a technician...</option>
            {technicians.map(tech => (
              <option key={tech.id} value={tech.id}>
                {tech.name} ({tech.position || 'No position'})
              </option>
            ))}
          </select>
        </div>

        {selectedTech && (
          <div className="tech-info">
            <h1>{selectedTech.name}</h1>
            <p><strong>Primary Position:</strong> {selectedTech.position || 'N/A'}</p>
            <div className="totals">
              <div className="total-card">
                <p className="label">Total Tech Pay</p>
                <p className="amount">${totalPay.toFixed(2)}</p>
              </div>
              <div className="total-card">
                <p className="label">Total Customer Bill</p>
                <p className="amount">${totalBill.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </header>

      {error && <div className="error-message">{error}</div>}

      {selectedTechId && (
        <section className="schedule-section">
          <h2>Schedule</h2>

          {loading ? (
            <p>Loading schedule...</p>
          ) : assignments.length === 0 ? (
            <p className="empty-state">No assignments yet for this technician.</p>
          ) : (
            <div className="schedule-table-container">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Position</th>
                    <th>Hours</th>
                    <th>Rate Type</th>
                    <th>Tech Pay</th>
                    <th>Customer Bill</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(assignment => (
                    <tr key={assignment.id} className={editingId === assignment.id ? 'editing' : ''}>
                      {editingId === assignment.id ? (
                        <>
                          <td>{assignment.event_name}</td>
                          <td>{assignment.client_name}</td>
                          <td>
                            <input
                              type="date"
                              value={editData.assignment_date || ''}
                              onChange={(e) => handleEditChange('assignment_date', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="time"
                              value={editData.start_time || ''}
                              onChange={(e) => handleEditChange('start_time', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="time"
                              value={editData.end_time || ''}
                              onChange={(e) => handleEditChange('end_time', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={editData.position || ''}
                              onChange={(e) => handleEditChange('position', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.25"
                              value={editData.hours_worked || ''}
                              onChange={(e) => handleEditChange('hours_worked', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td>
                            <select
                              value={editData.rate_type || ''}
                              onChange={(e) => handleEditChange('rate_type', e.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="hourly">Hourly</option>
                              <option value="half-day">Half-Day</option>
                              <option value="full-day">Full-Day</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              value={editData.calculated_pay || ''}
                              onChange={(e) => handleEditChange('calculated_pay', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              value={editData.customer_bill || ''}
                              onChange={(e) => handleEditChange('customer_bill', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={editData.notes || ''}
                              onChange={(e) => handleEditChange('notes', e.target.value)}
                              placeholder="Notes"
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={handleSaveEdit}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{assignment.event_name}</td>
                          <td>{assignment.client_name}</td>
                          <td>{assignment.assignment_date || '—'}</td>
                          <td>{assignment.start_time || '—'}</td>
                          <td>{assignment.end_time || '—'}</td>
                          <td>{assignment.position}</td>
                          <td>{assignment.hours_worked}</td>
                          <td>{assignment.rate_type}</td>
                          <td>${(assignment.calculated_pay || 0).toFixed(2)}</td>
                          <td>${(assignment.customer_bill || 0).toFixed(2)}</td>
                          <td>{assignment.notes || '—'}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-edit"
                              onClick={() => handleEditStart(assignment)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-delete"
                              onClick={() => handleDeleteAssignment(assignment.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default TechSchedule;
