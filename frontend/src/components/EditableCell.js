import React, { useState, useRef, useEffect } from 'react';

/**
 * EditableCell - A table cell that becomes editable on double-click
 * Supports text, date, time, and number inputs
 */
const EditableCell = ({ value, type = 'text', onSave, displayValue }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

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
            border: '2px solid #3280be',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'inherit'
          }}
        />
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

export default EditableCell;
