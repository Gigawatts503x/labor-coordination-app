import React, { useState, useRef, useEffect } from 'react';

/**
 * EditableCell - A table cell content that becomes editable on double-click
 * Supports text, date, time, and number inputs
 * NOTE: This component returns content only, parent must wrap in <td>
 */
const EditableCell = ({ value, type = 'text', onSave, displayValue }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const inputRef = useRef(null);

  // Sync inputValue when the value prop changes (from parent)
  useEffect(() => {
    if (!isEditing) {
      setInputValue(value || '');
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (inputValue !== value) {
      onSave(inputValue);
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setInputValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyPress}
        style={{
          padding: '4px',
          fontSize: '14px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
      />
    );
  }

  return (
    <span
      onDoubleClick={() => setIsEditing(true)}
      style={{ cursor: 'pointer', padding: '4px' }}
    >
      {displayValue || value || '-'}
    </span>
  );
};

export default EditableCell;
