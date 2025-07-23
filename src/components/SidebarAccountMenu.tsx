import React, { useState } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { DeleteButton } from './DeleteButton';
import { X, MoreVertical } from 'lucide-react';

interface SidebarAccountMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const SidebarAccountMenu: React.FC<SidebarAccountMenuProps> = ({
  isOpen,
  onToggle,
}) => {
  const { user, signOut, deleteAccount } = useAuthContext();

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out? You will need to sign in again to access your account.')) {
      const result = await signOut();
      if (result.error) {
        console.error('Sign out error:', result.error);
      }
      onToggle();
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including canvases and preferences.')) {
      try {
        const result = await deleteAccount();
        if (result.error) {
          console.error('Account deletion error:', result.error);
          alert(`Failed to delete account: ${result.error}`);
        } else {
          console.log('Account deleted successfully');
          // User will be automatically redirected to sign-in page
        }
      } catch (error) {
        console.error('Unexpected error during account deletion:', error);
        alert('An unexpected error occurred while deleting your account');
      }
      onToggle();
    }
  };

  return (
    <div style={{
      width: '100%',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '8px',
      marginBottom: '8px',
      position: 'relative',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '8px 12px',
          backgroundColor: 'transparent',
          color: '#885050',
          border: 'none',
          borderRadius: isOpen ? '8px 8px 0 0' : '8px',
          fontSize: '12px',
          fontWeight: '600',
          fontFamily: 'var(--font-system)',
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'all 0.1s ease',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          height: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0px',
        }}
        title="Account Settings"
      >
        <span style={{ flex: '1', textAlign: 'left' }}>Account Settings</span>
        <div
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: '#885050',
            opacity: 0.5,
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px',
            marginLeft: '8px',
            zIndex: 20,
            position: 'relative',
            transition: 'opacity 0.2s ease, background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.backgroundColor = 'rgba(136, 80, 80, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.5';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Account Settings"
        >
          {isOpen ? (
            <X 
              size={12} 
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              style={{ opacity: 1 }} 
            />
          ) : (
            <MoreVertical size={12} style={{ opacity: 1 }} />
          )}
        </div>
      </button>
      
      {/* Expandable Account Settings Content */}
      <div
        style={{
          width: '100%',
          maxHeight: isOpen ? '400px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '0 0 8px 8px',
        }}
      >
        <div style={{ padding: '4px 8px 8px 8px' }}>
          {/* Email (read-only) */}
          <div style={{ marginBottom: '0px' }}>
            <input
              type="email"
              value={user.email || ''}
              disabled
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '11px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#BD8F8E',
                border: 'none',
                borderRadius: '6px',
                boxSizing: 'border-box',
                fontFamily: 'var(--font-system)',
              }}
            />
          </div>

          {/* Account Actions */}
          <div style={{
            borderTop: '1px solid var(--color-divider)',
            paddingTop: '12px',
          }}>
            <DeleteButton
              text="Sign Out"
              onClick={handleSignOut}
              variant="danger"
              style={{
                marginBottom: '6px',
              }}
              title="Sign out of your account"
            />

            <DeleteButton
              text="Delete Account"
              onClick={handleDeleteAccount}
              variant="danger"
              title="Delete your account permanently"
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 