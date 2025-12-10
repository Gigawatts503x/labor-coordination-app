import React, { useState, useRef, useEffect } from 'react';

/**
 * EditableSelectCell - A table cell with a select dropdown
 * Becomes editable on double-click
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
      <td style={{ padding: '4px' }}>
        <select
          ref={selectRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '6px',
            border: '2px solid #3280be',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'inherit',
            backgroundColor: 'white'
          }}
        >
          <option value="">-- Select --</option>
          {options && options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </td>
    );
  }

  return (
    <td
      onDoubleClick={handleDoubleClick}
      style={{
        cursor: 'pointer',
        padding: '8px',
        userSelect: 'none',
        backgroundColor: 'transparent',
        transition: 'background-color 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f0f0f0';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {displayValue}
    </td>
  );
};

export default EditableSelectCell;
