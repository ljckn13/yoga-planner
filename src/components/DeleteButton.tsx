import React from 'react';

interface DeleteButtonProps {
  text: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  title?: string;
  variant?: 'danger' | 'default';
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
  text,
  onClick,
  disabled = false,
  style = {},
  title,
  variant = 'danger',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '6px 10px',
        fontSize: '11px',
        fontWeight: '500',
        fontFamily: 'var(--font-system)',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '6px',
        color: variant === 'danger' ? '#dc2626' : 'var(--color-text)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 0.7,
        textAlign: 'center',
        pointerEvents: disabled ? 'none' : 'auto',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        transition: 'all 0.2s ease',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = variant === 'danger' 
            ? 'rgba(220, 38, 38, 0.1)' 
            : 'hsl(0 0% 96.1%)';
          e.currentTarget.style.opacity = '1';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.opacity = '0.7';
        }
      }}
      title={title}
    >
      {text}
    </button>
  );
}; 