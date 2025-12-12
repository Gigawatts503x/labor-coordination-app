import React, { useState, useRef, useEffect } from 'react';

/**
 * EditableCell - A table cell content that becomes editable on double-click
 * Supports text, date, time, and number inputs
 * FIXED: Properly handles inline editing without affecting other cells
 */
const EditableCell = ({ value, type = 'text', onSave, displayValue }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef(null);

  // Update local state when prop changes (when data refreshes)
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Only call onSave if value actually changed
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          padding: '6px',
          border: '2px solid #1a73e8',
          borderRadius: '4px',
          fontSize: '14px',
          fontFamily: 'inherit',
          boxSizing: 'border-box'
        }}
      />
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        display: 'block',
        padding: '4px'
      }}
      title="Double-click to edit"
    >
      {displayValue || '—'}
    </span>
  );
};

export default EditableCell;