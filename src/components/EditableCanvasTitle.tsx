import React from 'react';

interface EditableCanvasTitleProps {
  title: string;
  onSave: (newTitle: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export function EditableCanvasTitle({ 
  title, 
  onSave, 
  isEditing, 
  onStartEdit, 
  onCancelEdit,
  style,
  className
}: EditableCanvasTitleProps) {
  const [editValue, setEditValue] = React.useState(title);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  React.useEffect(() => {
    setEditValue(title);
  }, [title]);

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== title) {
      onSave(trimmedValue);
    } else {
      setEditValue(title); // Reset to original if empty or unchanged
    }
    onCancelEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(title);
      onCancelEdit();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        style={{
          width: '100%',
          padding: '4px 8px',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          fontWeight: 'inherit',
          backgroundColor: '#ffffff',
          color: 'var(--color-text)',
          border: '2px solid var(--color-selected)',
          borderRadius: '4px',
          outline: 'none',
          boxSizing: 'border-box',
          ...style
        }}
        className={className}
      />
    );
  }

  return (
    <div
      onDoubleClick={onStartEdit}
      style={{
        cursor: 'pointer',
        width: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        ...style
      }}
      className={className}
      title={`Double-click to edit: ${title}`}
    >
      {title}
    </div>
  );
} 