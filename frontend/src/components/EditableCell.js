// frontend/src/components/EditableCell.js
import React, { useState } from 'react';

const EditableCell = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <td style={{ padding: '0.5rem' }}>
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-text)',
          }}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          autoFocus
        />
      </td>
    );
  }

  return (
    <td
      onClick={() => setIsEditing(true)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      title="Click to edit"
    >
      {value || '—'}
    </td>
  );
};

export default EditableCell;
