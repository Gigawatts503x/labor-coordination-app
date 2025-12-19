// frontend/src/pages/Technicians.js
// Technicians management page - CRUD operations for technician records

import React, { useState, useMemo } from 'react';
import { useDataStore } from '../hooks/useDataStore';
import '../styles/Technicians.css';

const Technicians = () => {
  const {
    technicians,
    loading,
    error,
    updateTechnician,
    // NOTE: you must add addTechnician & deleteTechnician to DataStoreContext
    addTechnician,
    deleteTechnician,
  } = useDataStore();

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
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');

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
        await updateTechnician(editingId, formData);
        alert('✅ Technician updated successfully!');
      } else {
        await addTechnician(formData);
        alert('✅ Technician added successfully!');
      }

      resetForm();
      setShowForm(false);
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
        await deleteTechnician(id);
        alert('✅ Technician deleted successfully!');
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

  const filteredTechnicians = useMemo(() => {
    let list = technicians || [];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (t) =>
          t.name?.toLowerCase().includes(term) ||
          t.position?.toLowerCase().includes(term)
      );
    }

    if (positionFilter !== 'all') {
      list = list.filter((t) => t.position === positionFilter);
    }

    return list;
  }, [technicians, searchTerm, positionFilter]);

  if (loading && (!technicians || technicians.length === 0)) {
    return (
      <div className="technicians-page">
        <div className="loading-spinner">Loading technicians...</div>
      </div>
    );
  }

  return (
    <div className="technicians-page">
      <div className="technicians-header">
        <h2>Technicians</h2>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Add Technician
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Filters */}
      <div className="technicians-filters">
        <input
          type="text"
          placeholder="Search by name or position..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="filter-input"
        />

        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Positions</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="LD">LD</option>
          <option value="LD Op">LD Op</option>
          <option value="V1">V1</option>
          <option value="V2">V2</option>
          {/* Add positions as needed */}
        </select>
      </div>

      {/* Form Drawer */}
      {showForm && (
        <div className="technician-form-container">
          <h3>{editingId ? 'Edit Technician' : 'Add New Technician'}</h3>

          {formError && <div className="form-error">{formError}</div>}

          <form onSubmit={handleSubmit} className="technician-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Technician name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="position">Position</label>
                <input
                  id="position"
                  name="position"
                  type="text"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="e.g., A1, V1, LD"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="hourlyrate">Hourly Rate ($)</label>
                <input
                  id="hourlyrate"
                  name="hourlyrate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyrate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="halfdayrate">Half-Day Rate ($)</label>
                <input
                  id="halfdayrate"
                  name="halfdayrate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.halfdayrate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="fulldayrate">Full-Day Rate ($)</label>
                <input
                  id="fulldayrate"
                  name="fulldayrate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fulldayrate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Save Changes' : 'Add Technician'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Technicians Table */}
      <div className="technicians-table-container">
        {filteredTechnicians.length === 0 ? (
          <p className="empty-state">
            👤 No technicians yet. Add one to get started!
          </p>
        ) : (
          <table className="technicians-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Hourly Rate</th>
                <th>Half-Day Rate</th>
                <th>Full-Day Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTechnicians.map((tech) => (
                <tr key={tech.id}>
                  <td>{tech.name}</td>
                  <td>{tech.position || '—'}</td>
                  <td>${parseFloat(tech.hourlyrate || 0).toFixed(2)}</td>
                  <td>${parseFloat(tech.halfdayrate || 0).toFixed(2)}</td>
                  <td>${parseFloat(tech.fulldayrate || 0).toFixed(2)}</td>
                  <td>
                    <button
                      className="btn btn-small"
                      onClick={() => handleEdit(tech)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(tech.id, tech.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Technicians;
u