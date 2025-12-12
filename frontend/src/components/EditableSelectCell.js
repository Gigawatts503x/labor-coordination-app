import React, { useState, useRef, useEffect } from 'react';

/**
 * EditableSelectCell - A table cell with select dropdown on double-click
 * FIXED: Properly handles selection changes without affecting other cells
 */
const EditableSelectCell = ({ value, options, onSave, displayValue }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const selectRef = useRef(null);

  // Update local state when prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Focus when entering edit mode
  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
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
      <select
        ref={selectRef}
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
      >
        {options.map(opt => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
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

export default EditableSelectCell;