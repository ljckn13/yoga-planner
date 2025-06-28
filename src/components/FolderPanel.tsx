import React, { useState } from 'react';
import { Plus, Edit, Trash, Folder as FolderIcon, FolderOpen } from 'lucide-react';
import type { Folder } from '../lib/supabase';

interface FolderPanelProps {
  folders: Folder[];
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: (name: string, description?: string) => Promise<string>;
  onUpdateFolder: (id: string, updates: { name?: string; description?: string; color?: string }) => Promise<boolean>;
  onDeleteFolder: (id: string) => Promise<boolean>;
  isLoading?: boolean;
}

export const FolderPanel: React.FC<FolderPanelProps> = ({
  folders,
  currentFolderId,
  onFolderSelect,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  isLoading = false,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await onCreateFolder(newFolderName.trim(), newFolderDescription.trim() || undefined);
      setNewFolderName('');
      setNewFolderDescription('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleUpdateFolder = async (folderId: string) => {
    if (!editingName.trim()) return;
    
    try {
      await onUpdateFolder(folderId, {
        name: editingName.trim(),
        description: editingDescription.trim() || undefined,
      });
      setEditingFolderId(null);
      setEditingName('');
      setEditingDescription('');
    } catch (error) {
      console.error('Failed to update folder:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (confirm('Are you sure you want to delete this folder? Canvases will be moved to the root level.')) {
      try {
        await onDeleteFolder(folderId);
      } catch (error) {
        console.error('Failed to delete folder:', error);
      }
    }
  };

  const startEditing = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setEditingName(folder.name);
    setEditingDescription(folder.description || '');
  };

  const cancelEditing = () => {
    setEditingFolderId(null);
    setEditingName('');
    setEditingDescription('');
  };

  return (
    <div className="folder-panel" style={{
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      padding: '12px',
      boxShadow: 'var(--shadow-neumorphic)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '600',
          color: '#885050',
          fontFamily: 'var(--font-system)',
        }}>
          Folders
        </h3>
        <button
          onClick={() => setIsCreating(true)}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            color: '#885050',
            transition: 'all 0.1s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Create new folder"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Create Folder Form */}
      {isCreating && (
        <div style={{
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <input
            type="text"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') setIsCreating(false);
            }}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '6px',
              color: '#885050',
              marginBottom: '4px',
              fontFamily: 'var(--font-system)',
            }}
            autoFocus
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newFolderDescription}
            onChange={(e) => setNewFolderDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') setIsCreating(false);
            }}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '6px',
              color: '#885050',
              marginBottom: '8px',
              fontFamily: 'var(--font-system)',
            }}
          />
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || isLoading}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: '#885050',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: newFolderName.trim() && !isLoading ? 1 : 0.5,
                fontFamily: 'var(--font-system)',
              }}
            >
              Create
            </button>
            <button
              onClick={() => setIsCreating(false)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: 'transparent',
                color: '#885050',
                border: '1px solid #885050',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'var(--font-system)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Root Level Option */}
      <div
        onClick={() => onFolderSelect(null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '8px',
          backgroundColor: currentFolderId === null ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
          transition: 'all 0.1s ease',
        }}
        onMouseEnter={(e) => {
          if (currentFolderId !== null) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (currentFolderId !== null) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <FolderIcon size={16} style={{ color: '#885050', marginRight: '8px' }} />
        <span style={{
          fontSize: '12px',
          color: '#885050',
          fontWeight: currentFolderId === null ? '600' : '400',
          fontFamily: 'var(--font-system)',
        }}>
          All Canvases
        </span>
      </div>

      {/* Folders List */}
      {folders.map((folder) => (
        <div key={folder.id} style={{ marginBottom: '4px' }}>
          {editingFolderId === folder.id ? (
            // Edit Mode
            <div style={{
              padding: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateFolder(folder.id);
                  if (e.key === 'Escape') cancelEditing();
                }}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#885050',
                  marginBottom: '4px',
                  fontFamily: 'var(--font-system)',
                }}
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateFolder(folder.id);
                  if (e.key === 'Escape') cancelEditing();
                }}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#885050',
                  marginBottom: '6px',
                  fontFamily: 'var(--font-system)',
                }}
              />
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => handleUpdateFolder(folder.id)}
                  disabled={!editingName.trim() || isLoading}
                  style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    backgroundColor: '#885050',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    opacity: editingName.trim() && !isLoading ? 1 : 0.5,
                    fontFamily: 'var(--font-system)',
                  }}
                >
                  Save
                </button>
                <button
                  onClick={cancelEditing}
                  style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    backgroundColor: 'transparent',
                    color: '#885050',
                    border: '1px solid #885050',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-system)',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // View Mode
            <div
              onClick={() => onFolderSelect(folder.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: currentFolderId === folder.id ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                transition: 'all 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (currentFolderId !== folder.id) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentFolderId !== folder.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <FolderOpen size={16} style={{ color: '#885050', marginRight: '8px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#885050',
                    fontWeight: currentFolderId === folder.id ? '600' : '400',
                    fontFamily: 'var(--font-system)',
                  }}>
                    {folder.name}
                  </div>
                  {folder.description && (
                    <div style={{
                      fontSize: '10px',
                      color: '#BD8F8E',
                      fontFamily: 'var(--font-system)',
                    }}>
                      {folder.description}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Folder Actions */}
              <div style={{ display: 'flex', gap: '2px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(folder);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#885050',
                    opacity: 0.7,
                    transition: 'all 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.opacity = '0.7';
                  }}
                  title="Edit folder"
                >
                  <Edit size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#885050',
                    opacity: 0.7,
                    transition: 'all 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.opacity = '0.7';
                  }}
                  title="Delete folder"
                >
                  <Trash size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Empty State */}
      {folders.length === 0 && !isCreating && (
        <div style={{
          textAlign: 'center',
          padding: '16px',
          color: '#BD8F8E',
          fontSize: '12px',
          fontFamily: 'var(--font-system)',
        }}>
          No folders yet
        </div>
      )}
    </div>
  );
}; 