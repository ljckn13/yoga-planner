import { useState, useEffect } from 'react'
import { useAuthContext } from './AuthProvider'
import { useUser } from '../hooks/useUser'

export function UserProfile() {
  const { user } = useAuthContext()
  const { 
    profile, 
    isLoading, 
    error, 
    updateProfile, 
    updatePreferences,
    getPreference,
  } = useUser()
  
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [defaultCanvasTitle, setDefaultCanvasTitle] = useState('')
  const [autoSaveDelay, setAutoSaveDelay] = useState(200)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load profile data when user changes
  useEffect(() => {

    if (user && profile) {

      setDisplayName(profile.display_name || '')
      setDefaultCanvasTitle(getPreference('default_canvas_title', 'Untitled Canvas'))
      setAutoSaveDelay(getPreference('auto_save_delay', 200))
    }
  }, [user, profile, getPreference])

  const handleSaveProfile = async () => {
    if (!profile) {

      return
    }


    const result = await updateProfile({
      display_name: displayName.trim() || undefined
    })

    
          if (result.success) {
      setIsEditing(false)
      setSaveSuccess(true)
      // The profile state should be updated by the useUser hook
    } else {
      console.error('Failed to update profile:', result.error)
      // You might want to show an error message to the user here
    }
  }

  const handleSavePreferences = async () => {
    if (!profile) {

      return
    }


    const result = await updatePreferences({
      default_canvas_title: defaultCanvasTitle.trim() || 'Untitled Canvas',
      auto_save_delay: autoSaveDelay
    })

    
          if (result.success) {
      setIsEditing(false)
      setSaveSuccess(true)
      // The profile state should be updated by the useUser hook
    } else {
      console.error('Failed to update preferences:', result.error)
      // You might want to show an error message to the user here
    }
  }

  const handleSave = async () => {

    await handleSaveProfile()
    await handleSavePreferences()

  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          Error loading profile: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Debug Section - Remove in production */}
      <div className="bg-gray-100 p-3 rounded-md text-xs">
        <h4 className="font-semibold mb-2">Debug Info:</h4>
        <div>User ID: {user?.id || 'None'}</div>
        <div>User Email: {user?.email || 'None'}</div>
        <div>Profile: {profile ? 'Loaded' : 'Not loaded'}</div>
        <div>Profile ID: {profile?.id || 'None'}</div>
        <div>Is Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>Error: {error || 'None'}</div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">User Profile</h3>
        <button
          onClick={() => {
            setIsEditing(!isEditing)
            setSaveSuccess(false)
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          Profile updated successfully!
        </div>
      )}

      {/* Email (read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={profile?.email || user?.email || ''}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
        />
      </div>

      {/* Display Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Display Name
        </label>
        {isEditing ? (
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter display name"
          />
        ) : (
          <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
            {profile?.display_name || 'No display name set'}
          </div>
        )}
      </div>

      {/* Preferences Section */}
      <div className="border-t pt-4">
        <h4 className="text-md font-medium text-gray-900 mb-3">Preferences</h4>
        
        {/* Default Canvas Title */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Canvas Title
          </label>
          {isEditing ? (
            <input
              type="text"
              value={defaultCanvasTitle}
              onChange={(e) => setDefaultCanvasTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Untitled Canvas"
            />
          ) : (
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              {getPreference('default_canvas_title', 'Untitled Canvas')}
            </div>
          )}
        </div>

        {/* Auto-save Delay */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Auto-save Delay (ms)
          </label>
          {isEditing ? (
            <input
              type="number"
              min="0"
              max="5000"
              step="100"
              value={autoSaveDelay}
              onChange={(e) => setAutoSaveDelay(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              {getPreference('auto_save_delay', 200)}ms
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      {isEditing && (
        <div className="flex gap-2 pt-4 border-t">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
} 