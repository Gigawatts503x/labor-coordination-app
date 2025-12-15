// frontend/src/pages/Technicians.js
// Technicians management page - CRUD operations for technician records

import React, { useState } from 'react';
import { useTechnicians } from '../hooks/useTechnicians';
import '../styles/Technicians.css';

const Technicians = () => {
  const { technicians, loading, error, addTechnician, updateTech, deleteTech, refetch } =
    useTechnicians();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    hourlyrate: '',
    halfdayrate: '',
    fulldayrate: '',
  });

  const [formError, setFormError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        value === ''
          ? ''
          : name.includes('rate')
            ? parseFloat(value) || ''
            : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      hourlyrate: '',
      halfdayrate: '',
      fulldayrate: '',
    });
    setEditingId(null);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      setFormError('Technician name is required');
      return;
    }

    try {
      setFormError(null);

      if (editingId) {
        await updateTech(editingId, formData);
        alert('✅ Technician updated successfully!');
      } else {
        await addTechnician(formData);
        alert('✅ Technician added successfully!');
      }

      resetForm();
      setShowForm(false);
      await refetch();
    } catch (err) {
      console.error('Failed to save technician:', err);
      setFormError(err.message || 'Failed to save technician');
    }
  };

  const handleEdit = (tech) => {
    setFormData({
      name: tech.name || '',
      position: tech.position || '',
      hourlyrate: tech.hourlyrate || '',
      halfdayrate: tech.halfdayrate || '',
      fulldayrate: tech.fulldayrate || '',
    });
    setEditingId(tech.id);
    setShowForm(true);
    setFormError(null);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete technician "${name}"? This cannot be undone.`)) {
      try {
        await deleteTech(id);
        alert('✅ Technician deleted successfully!');
        await refetch();
      } catch (err) {
        console.error('Failed to delete technician:', err);
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  if (loading) {
    return <div className="technicians-page loading">Loading technicians...</div>;
  }

  return (
    <div className="technicians-page">
      <header className="page-header">
        <h1>Technicians Management</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Technician'}
        </button>
      </header>

      {error && <div className="error-banner">Error: {error}</div>}

      {/* Add/Edit Form */}
      {showForm && (
        <form className="technician-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit Technician' : 'Add New Technician'}</h2>

          {formError && <div className="form-error">{formError}</div>}

          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Technician name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="position">Position</label>
            <input
              id="position"
              type="text"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              placeholder="e.g., Lighting Tech, Sound Engineer"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="hourlyrate">Hourly Rate ($)</label>
              <input
                id="hourlyrate"
                type="number"
                name="hourlyrate"
                value={formData.hourlyrate}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="50.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="halfdayrate">Half Day Rate ($)</label>
              <input
                id="halfdayrate"
                type="number"
                name="halfdayrate"
                value={formData.halfdayrate}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="250.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="fulldayrate">Full Day Rate ($)</label>
              <input
                id="fulldayrate"
                type="number"
                name="fulldayrate"
                value={formData.fulldayrate}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="500.00"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingId ? 'Update Technician' : 'Add Technician'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Technicians List */}
      <section className="technicians-section">
        <h2>Technicians ({technicians.length})</h2>

        {technicians.length === 0 ? (
          <div className="empty-state">
            <p>👤 No technicians yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="technicians-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Hourly Rate</th>
                  <th>Half Day Rate</th>
                  <th>Full Day Rate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map((tech) => (
                  <tr key={tech.id}>
                    <td className="tech-name">{tech.name}</td>
                    <td>{tech.position || '—'}</td>
                    <td className="rate">
                      ${parseFloat(tech.hourlyrate || 0).toFixed(2)}
                    </td>
                    <td className="rate">
                      ${parseFloat(tech.halfdayrate || 0).toFixed(2)}
                    </td>
                    <td className="rate">
                      ${parseFloat(tech.fulldayrate || 0).toFixed(2)}
                    </td>
                    <td className="actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(tech)}
                        title="Edit"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(tech.id, tech.name)}
                        title="Delete"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Stats Footer */}
      {technicians.length > 0 && (
        <footer className="page-footer">
          <p>Total Technicians: {technicians.length}</p>
          <p>
            Average Hourly Rate: $
            {(
              technicians.reduce((sum, t) => sum + (parseFloat(t.hourlyrate) || 0), 0) /
              technicians.length
            ).toFixed(2)}
          </p>
        </footer>
      )}
    </div>
  );
};

export default Technicians;
