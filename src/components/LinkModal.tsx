import React, { useEffect, useRef, useState } from 'react';
import type { Link } from '../api';
import { 
  X, 
  FileText, 
  FileSpreadsheet, 
  Presentation,
  FolderOpen, 
  Code, 
  Globe, 
  Paintbrush, 
  Layers
} from 'lucide-react';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (alias: string, url: string) => void;
  link?: Link | null; // If editing
}

// Frontend link-type detection helper for live icon preview
function getDetectedIcon(url: string) {
  if (!url) return <Globe size={18} />;
  
  try {
    let urlString = url;
    if (!/^https?:\/\//i.test(url)) {
      urlString = 'https://' + url;
    }
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    if (host.includes('github.com') || host.includes('gitlab.com')) {
      return <Code size={18} />;
    }
    if (host.includes('docs.google.com')) {
      if (path.includes('/document/')) return <FileText size={18} style={{ color: '#2684fc' }} />;
      if (path.includes('/spreadsheets/')) return <FileSpreadsheet size={18} style={{ color: '#0f9d58' }} />;
      if (path.includes('/presentation/')) return <Presentation size={18} style={{ color: '#f4b400' }} />;
      return <FolderOpen size={18} style={{ color: '#f4b400' }} />;
    }
    if (host.includes('drive.google.com')) {
      return <FolderOpen size={18} style={{ color: '#0f9d58' }} />;
    }
    if (host.includes('figma.com')) {
      return <Paintbrush size={18} style={{ color: '#f24e1e' }} />;
    }
    if (host.includes('notion.so') || host.includes('notion.site')) {
      return <Layers size={18} style={{ color: '#000000' }} />;
    }
    return <Globe size={18} />;
  } catch (e) {
    return <Globe size={18} />;
  }
}

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  link
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [alias, setAlias] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (link) {
      setAlias(link.alias);
      setUrl(link.url);
    } else {
      setAlias('');
      setUrl('');
    }
  }, [link, isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim() || !url.trim()) return;
    
    // Add protocol if missing
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }
    
    onSave(alias.trim(), formattedUrl);
    onClose();
  };

  // Light-dismiss click outside content area fallback for unsupported browsers
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (e.target !== dialog) return;

    const rect = dialog.getBoundingClientRect();
    const isClickInside = (
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width
    );

    if (!isClickInside) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onClose={onClose}
      id="link-dialog"
      aria-labelledby="link-dialog-title"
      style={{
        padding: '1.75rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        maxWidth: '420px',
        width: '90%'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 id="link-dialog-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
          {link ? 'Edit Link' : 'Add Link'}
        </h2>
        <button 
          onClick={onClose} 
          className="btn-icon" 
          type="button"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="link-alias" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Alias (display name)
          </label>
          <input
            id="link-alias"
            type="text"
            className="input-field"
            placeholder="e.g. Project Repository, Figma Mockup..."
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            required
            autoFocus
            maxLength={60}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="link-url" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            URL
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div 
              style={{ 
                position: 'absolute', 
                left: '1rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--text-muted)'
              }}
            >
              {getDetectedIcon(url)}
            </div>
            <input
              id="link-url"
              type="text"
              className="input-field"
              placeholder="e.g. github.com/user/project"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={!alias.trim() || !url.trim()}
          >
            {link ? 'Save Changes' : 'Add Link'}
          </button>
        </div>
      </form>
    </dialog>
  );
};
