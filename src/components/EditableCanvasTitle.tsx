import React from 'react';

interface EditableCanvasTitleProps {
  title: string;
  onSave: (newTitle: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  style?: React.CSSProperties;
  className?: string;
  isCurrent?: boolean; // Add this prop to know the background color
}

export function EditableCanvasTitle({ 
  title, 
  onSave, 
  isEditing, 
  onStartEdit, 
  onCancelEdit,
  style,
  className,
  isCurrent = false
}: EditableCanvasTitleProps) {
  const [editValue, setEditValue] = React.useState(title);
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  React.useEffect(() => {
    setEditValue(title);
  }, [title]);

  // Check if text is overflowing
  React.useEffect(() => {
    const checkOverflow = () => {
      if (titleRef.current) {
        const textElement = titleRef.current;
        const containerElement = textElement.parentElement;
        
        if (!containerElement) return;
        
        // Get the actual text width by creating a temporary element
        const tempElement = document.createElement('span');
        tempElement.style.cssText = `
          position: absolute;
          visibility: hidden;
          white-space: nowrap;
          font-family: ${getComputedStyle(textElement).fontFamily};
          font-size: ${getComputedStyle(textElement).fontSize};
          font-weight: ${getComputedStyle(textElement).fontWeight};
        `;
        tempElement.textContent = title;
        document.body.appendChild(tempElement);
        
        const textWidth = tempElement.offsetWidth;
        const containerWidth = containerElement.offsetWidth;
        
        // Account for settings button if current
        const availableWidth = isCurrent ? containerWidth - 28 : containerWidth;
        
        const overflowing = textWidth > availableWidth;
        
        document.body.removeChild(tempElement);
        setIsOverflowing(overflowing);
      }
    };

    // Check immediately and after a delay
    checkOverflow();
    const timeoutId = setTimeout(checkOverflow, 100);
    
    return () => clearTimeout(timeoutId);
  }, [title, isCurrent]);

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
          cursor: 'text',
          userSelect: 'text',
          WebkitUserSelect: 'text',
          MozUserSelect: 'text',
          msUserSelect: 'text',
          ...style
        }}
        onMouseDown={(e) => {
          // Prevent drag from starting when clicking on the input
          e.stopPropagation();
        }}
      />
    );
  }

  const { fontWeight, ...otherStyles } = style || {};
  
  return (
    <div
      onDoubleClick={onStartEdit}
      className={`text-primary cursor-pointer w-full overflow-hidden whitespace-nowrap ${className || ''}`}
      style={{
        position: 'relative',
        ...otherStyles
      }}
      title={`Double-click to edit: ${title}`}
    >
      {/* The actual title text */}
      <div
        ref={titleRef}
        style={{
          position: 'relative',
          zIndex: 1,
          // Use CSS mask to fade the text itself
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          // Apply mask only when overflowing
          ...(isOverflowing && {
            WebkitMaskImage: `linear-gradient(to right, black 0%, black calc(100% - 20px), transparent 100%)`,
            maskImage: `linear-gradient(to right, black 0%, black calc(100% - 20px), transparent 100%)`,
          })
        }}
      >
        {title}
      </div>
      
      {/* Remove the overlay approach */}
    </div>
  );
} 