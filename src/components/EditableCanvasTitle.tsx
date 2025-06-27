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
        className={`text-primary ${className || ''}`}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          padding: 0,
          margin: 0,
          fontFamily: 'inherit',
          fontSize: 'inherit',
          fontWeight: 'inherit',
          color: 'inherit',
          width: '100%',
          ...style
        }}
      />
    );
  }

  const { fontWeight, ...otherStyles } = style || {};
  return (
    <div
      onDoubleClick={onStartEdit}
      className={`text-primary cursor-pointer w-full overflow-hidden text-ellipsis whitespace-nowrap ${className || ''}`}
      style={{
        ...otherStyles
      }}
      title={`Double-click to edit: ${title}`}
    >
      {title}
    </div>
  );
} 