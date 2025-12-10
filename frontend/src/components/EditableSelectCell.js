import React, { useState, useRef, useEffect } from 'react';

/**
 * EditableSelectCell - A table cell with a select dropdown
 * Becomes editable on double-click
 * NOTE: This component returns content only, parent must wrap in <td>
 */
const EditableSelectCell = ({ value, options, onSave, displayValue }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const selectRef = useRef(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
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
          backgroundColor: 'white',
          boxSizing: 'border-box'
        }}
      >
        <option value="">-- Select --</option>
        {options && options.map((opt) => (
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
        userSelect: 'none'
      }}
      title="Double-click to edit"
    >
      {displayValue}
    </span>
  );
};

export default EditableSelectCell;
