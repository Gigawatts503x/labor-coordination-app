// frontend/src/pages/Technicians.js
import React, { useState } from 'react';
import { useTechnicians } from '../hooks/useTechnicians';
import '../styles/Technicians.css';

const Technicians = () => {
  const { technicians, loading, error, addTechnician, updateTech, deleteTech } = useTechnicians();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    hourly_rate: '',
    half_day_rate: '',
    full_day_rate: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? '' : (name.includes('rate') ? parseFloat(value) || '' : value),
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      hourly_rate: '',
      half_day_rate: '',
      full_day_rate: '',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateTech(editingId, formData);
      } else {
        await addTechnician(formData);
      }
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error('Failed to save technician:', err);
    }
  };

  const handleEdit = (tech) => {
    setFormData(tech);
    setEditingId(tech.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this technician?')) {
      try {
        await deleteTech(id);
      } catch (err) {
        console.error('Failed to delete technician:', err);
      }
    }
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  if (loading) return <div className="technicians">Loading technicians...</div>;
  if (error) return <div className="technicians error">Error: {error}</div>;

  return (
    <div className="technicians">
      <header className="technicians-header">
        <h1>Technicians</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancel' : '+ New Technician'}
        </button>
      </header>

      {showForm && (
        <form className="technician-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit Technician' : 'Add New Technician'}</h2>

          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Position *</label>
            <input
              type="text"
              name="position"
              placeholder="e.g., V1, V2, Lead Tech"
              value={formData.position}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Hourly Rate ($)</label>
              <input
                type="number"
                name="hourly_rate"
                step="0.01"
                min="0"
                value={formData.hourly_rate}
                onChange={handleInputChange}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>Half Day Rate ($)</label>
              <input
                type="number"
                name="half_day_rate"
                step="0.01"
                min="0"
                value={formData.half_day_rate}
                onChange={handleInputChange}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>Full Day Rate ($)</label>
              <input
                type="number"
                name="full_day_rate"
                step="0.01"
                min="0"
                value={formData.full_day_rate}
                onChange={handleInputChange}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success">
              {editingId ? 'Update' : 'Add'} Technician
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="technicians-list">
        <h2>Team Members ({technicians.length})</h2>
        {technicians.length === 0 ? (
          <p className="empty-state">No technicians yet. Add one to get started!</p>
        ) : (
          <div className="table-container">
            <table className="technicians-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Hourly Rate</th>
                  <th>Half Day</th>
                  <th>Full Day</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map((tech) => (
                  <tr key={tech.id}>
                    <td className="name">{tech.name}</td>
                    <td>{tech.position}</td>
                    <td>${parseFloat(tech.hourly_rate || 0).toFixed(2)}</td>
                    <td>${parseFloat(tech.half_day_rate || 0).toFixed(2)}</td>
                    <td>${parseFloat(tech.full_day_rate || 0).toFixed(2)}</td>
                    <td className="actions">
                      <button
                        className="btn btn-small btn-edit"
                        onClick={() => handleEdit(tech)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-small btn-delete"
                        onClick={() => handleDelete(tech.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Technicians;

