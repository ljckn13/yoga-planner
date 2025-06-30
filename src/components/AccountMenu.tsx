import { useState, useEffect } from 'react'
import { useAuthContext } from './AuthProvider'
import { useUser } from '../hooks/useUser'
import { DeleteButton } from './DeleteButton'

interface AccountMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function AccountMenu({ isOpen, onClose }: AccountMenuProps) {
  const { user, signOut, profile } = useAuthContext()
  const { updateProfile } = useUser()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load profile data when user changes
  useEffect(() => {
    if (user && profile) {
      setDisplayName(profile.display_name || '')
    }
  }, [user, profile])

  

  if (!isOpen) {
          return null
  }

  

  const handleSignOut = async () => {
    const result = await signOut()
    if (result.error) {
      console.error('Sign out error:', result.error)
    }
    onClose()
  }

  const handleDeleteAccount = async () => {
    // TODO: Implement account deletion
    
    setShowDeleteConfirm(false)
    onClose()
  }

  const handleDisplayNameChange = async (newName: string) => {
    setDisplayName(newName)
    
    if (!profile) return

    const result = await updateProfile({
      display_name: newName.trim() || undefined
    })

    if (result.success) {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000) // Hide success message after 2 seconds
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50" style={{ zIndex: 99999 }}>
      <div 
        className="tlui-panel"
        style={{
          maxWidth: '200px',
          width: '200px',
          maxHeight: '80vh',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          border: '1px solid var(--color-divider)',
          borderRadius: '12px',
          boxShadow: '0px 0px 2px hsl(0, 0%, 0%, 16%), 0px 2px 3px hsl(0, 0%, 0%, 24%), 0px 2px 6px hsl(0, 0%, 0%, 0.1), inset 0px 0px 0px 1px hsl(0, 0%, 100%)',
          position: 'fixed',
          bottom: '0px',
          left: '0px'
        }}
      >
        {/* Header */}
        <div 
          className="tlui-panel__header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px 8px 16px',
            borderBottom: '1px solid var(--color-divider)',
            backgroundColor: '#ffffff'
          }}
        >
          <h2 
            className="tlui-text tlui-text__h3"
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--color-text)',
              marginRight: '20px'
            }}
          >
            Account Settings
          </h2>
          <button
            onClick={onClose}
            className="tlui-button tlui-button__icon"
            style={{
              width: '16px !important',
              height: '16px !important',
              padding: '0 0 0 20px !important',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#9ca3af',
              transition: 'all 0.1s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-hover)'
              e.currentTarget.style.color = 'var(--color-text)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#9ca3af'
            }}
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div 
          style={{
            overflowY: 'auto',
            maxHeight: '60vh',
            padding: '16px'
          }}
        >
          {/* Success Message */}
          {saveSuccess && (
            <div 
              style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #0ea5e9',
                color: '#0c4a6e',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                marginBottom: '12px'
              }}
            >
              Profile updated successfully!
            </div>
          )}

          {/* Email (read-only) */}
          <div style={{ marginBottom: '12px' }}>
            <input
              type="email"
              value={profile?.email || user?.email || ''}
              disabled
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '11px',
                backgroundColor: 'hsl(0 0% 96.1%)',
                color: '#9ca3af',
                border: '1px solid var(--color-divider)',
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Display Name - Directly editable */}
          <div style={{ marginBottom: '16px' }}>
            <label 
              className="tlui-text"
              style={{
                display: 'block',
                fontSize: '10px',
                fontWeight: '500',
                color: 'var(--color-text-3)',
                marginBottom: '4px'
              }}
            >
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              onFocus={() => setIsEditingDisplayName(true)}
              onBlur={() => setIsEditingDisplayName(false)}
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '11px',
                backgroundColor: isEditingDisplayName ? '#ffffff' : 'hsl(0 0% 96.1%)',
                color: 'var(--color-text)',
                border: isEditingDisplayName ? '1px solid var(--color-text)' : '1px solid var(--color-divider)',
                borderRadius: '6px',
                boxSizing: 'border-box',
                transition: 'all 0.1s ease'
              }}
              placeholder="Enter display name"
            />
          </div>

          {/* Account Actions */}
          <div 
            style={{
              borderTop: '1px solid var(--color-divider)',
              paddingTop: '12px'
            }}
          >
            <div>
              <DeleteButton
                text="Sign Out"
                onClick={handleSignOut}
                variant="default"
                style={{
                  marginBottom: '6px',
                  height: '32px',
                  borderRadius: '8px',
                }}
                title="Sign out of your account"
              />

              <DeleteButton
                text="Delete Account"
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  height: '32px',
                  borderRadius: '8px',
                }}
                title="Delete your account permanently"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 999999 }}>
          <div 
            className="tlui-panel"
            style={{
              maxWidth: '400px',
              width: '90vw',
              padding: '20px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--color-divider)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            <h3 
              className="tlui-text tlui-text__h4"
              style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--color-text)'
              }}
            >
              Delete Account
            </h3>
            <p 
              className="tlui-text"
              style={{
                fontSize: '12px',
                color: 'var(--color-text-3)',
                margin: '0 0 20px 0',
                lineHeight: '1.4'
              }}
            >
              Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including canvases and preferences.
            </p>
            <div 
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
              }}
            >
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="tlui-button tlui-button__small"
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: 'var(--color-panel)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-divider)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-panel)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="tlui-button tlui-button__small"
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: '1px solid #dc2626',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#b91c1c'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626'
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 