
/**
 * AssignmentEditModal.jsx
 * Modal form for editing technician assignments
 */

import React, { useState, useEffect } from 'react';
import './AssignmentEditModal.css';

const AssignmentEditModal = ({ assignment, onUpdate, onDelete, onClose }) => {
  
  const [formData, setFormData] = useState({
    startTime: assignment.startTime,
    endTime: assignment.endTime,
    location: assignment.location || 'TBD',
    position: assignment.position || '',
    rateType: assignment.rateType || 'hourly',
    rate: assignment.rate || 0,
    notes: assignment.notes || '',
    status: assignment.status || 'scheduled',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [hours, setHours] = useState(0);
  const [totalPay, setTotalPay] = useState(0);
  
  /**
   * calculateHours()
   * Convert startTime and endTime to hours worked
   */
  const calculateHours = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.round(diffHours * 100) / 100;
  };
  
  /**
   * calculateTotalPay()
   * Based on rate type, compute expected payout
   */
  const calculateTotalPay = () => {
    const h = calculateHours();
    const rate = parseFloat(formData.rate) || 0;
    
    switch (formData.rateType) {
      case 'hourly':
        return h * rate;
      case 'half-day':
        return h <= 4 ? rate : rate * 1.5;
      case 'full-day':
        return h <= 8 ? rate : rate * 1.5;
      default:
        return h * rate;
    }
  };
  
  // Update calculations when form changes
  useEffect(() => {
    setHours(calculateHours());
    setTotalPay(calculateTotalPay());
  }, [formData.startTime, formData.endTime, formData.rate, formData.rateType]);
  
  // Track unsaved changes
  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify({
      startTime: assignment.startTime,
      endTime: assignment.endTime,
      location: assignment.location || 'TBD',
      position: assignment.position || '',
      rateType: assignment.rateType || 'hourly',
      rate: assignment.rate || 0,
      notes: assignment.notes || '',
      status: assignment.status || 'scheduled',
    });
    setHasChanges(changed);
  }, [formData, assignment]);
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };
  
  const handleStartTimeChange = (e) => {
    const newStart = e.target.value;
    
    if (formData.endTime && newStart >= formData.endTime) {
      setError('Start time must be before end time');
      return;
    }
    
    handleInputChange('startTime', newStart);
  };
  
  const handleEndTimeChange = (e) => {
    const newEnd = e.target.value;
    
    if (formData.startTime && newEnd <= formData.startTime) {
      setError('End time must be after start time');
      return;
    }
    
    handleInputChange('endTime', newEnd);
  };
  
  const handleSave = async () => {
    if (formData.startTime >= formData.endTime) {
      setError('Start time must be before end time');
      return;
    }
    
    if (!formData.location.trim()) {
      setError('Location is required');
      return;
    }
    
    if (parseFloat(formData.rate) < 0) {
      setError('Rate cannot be negative');
      return;
    }
    
    setIsSaving(true);
    try {
      await onUpdate(formData);
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!window.confirm('Delete this assignment?')) return;
    
    setIsSaving(true);
    try {
      await onDelete(assignment.id);
    } catch (err) {
      setError(err.message || 'Failed to delete');
      setIsSaving(false);
    }
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <h2>Edit Assignment</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        
        <div className="modal-body">
          
          {error && <div className="alert alert-error">{error}</div>}
          
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">Start Time</label>
                <input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime?.slice(0, 16)}
                  onChange={handleStartTimeChange}
                  disabled={isSaving}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="endTime">End Time</label>
                <input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime?.slice(0, 16)}
                  onChange={handleEndTimeChange}
                  disabled={isSaving}
                />
              </div>
            </div>
            
            <div className="duration-display">
              <span className="duration-hours">{hours} hours</span>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  placeholder="e.g., Main Stage"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  disabled={isSaving}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="position">Position</label>
                <input
                  id="position"
                  type="text"
                  placeholder="e.g., LED Tech"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="rateType">Rate Type</label>
                <select
                  id="rateType"
                  value={formData.rateType}
                  onChange={(e) => handleInputChange('rateType', e.target.value)}
                  disabled={isSaving}
                >
                  <option value="hourly">Hourly</option>
                  <option value="half-day">Half Day</option>
                  <option value="full-day">Full Day</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="rate">Rate Amount</label>
                <div className="rate-input-group">
                  <span className="currency">$</span>
                  <input
                    id="rate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.rate}
                    onChange={(e) => handleInputChange('rate', parseFloat(e.target.value) || 0)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
            
            <div className="pay-preview">
              <div className="preview-label">Estimated Payout:</div>
              <div className="preview-amount">${totalPay.toFixed(2)}</div>
              <div className="preview-note">
                {formData.rateType === 'hourly' && `${hours}h × $${formData.rate}/hr`}
                {formData.rateType === 'half-day' && `Half-day: $${formData.rate}`}
                {formData.rateType === 'full-day' && `Full-day: $${formData.rate}`}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  disabled={isSaving}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="no-show">No-Show</option>
                  <option value="substituted">Substituted</option>
                </select>
              </div>
            </div>
            
            <div className="form-group full-width">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                placeholder="Add notes..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                disabled={isSaving}
                rows="3"
              />
            </div>
            
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={isSaving}
              >
                🗑️ Delete
              </button>
              
              <div className="footer-spacer"></div>
              
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};