import React, { useEffect, useRef, useState } from 'react';
import type { Project } from '../api';
import { X } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string, description: string) => void;
  project?: Project | null; // If editing
}

const COLORS = [
  { name: 'indigo', label: 'Indigo' },
  { name: 'coral', label: 'Coral' },
  { name: 'emerald', label: 'Emerald' },
  { name: 'amber', label: 'Amber' },
  { name: 'rose', label: 'Rose' },
  { name: 'cyan', label: 'Cyan' },
  { name: 'teal', label: 'Teal' },
  { name: 'purple', label: 'Purple' }
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  project
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('indigo');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setColor(project.color);
    } else {
      setName('');
      setDescription('');
      setColor('indigo');
    }
  }, [project, isOpen]);

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
    if (!name.trim()) return;
    onSave(name.trim(), color, description.trim());
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
      id="project-dialog"
      aria-labelledby="project-dialog-title"
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
        <h2 id="project-dialog-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
          {project ? 'Rename Project' : 'New Project'}
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
          <label htmlFor="project-name" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Project Name
          </label>
          <input
            id="project-name"
            type="text"
            className="input-field"
            placeholder="e.g. My Website Redesign"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            maxLength={40}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="project-description" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Description (optional)
          </label>
          <input
            id="project-description"
            type="text"
            className="input-field"
            placeholder="e.g. Spec docs, figma layout files, and repo"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={100}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Color Tag
          </span>
          <div className="color-picker">
            {COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                className={`color-option color-option-${c.name} ${color === c.name ? 'selected' : ''}`}
                onClick={() => setColor(c.name)}
                title={c.label}
                aria-label={`Select color ${c.label}`}
              />
            ))}
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
            disabled={!name.trim()}
          >
            {project ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>
    </dialog>
  );
};
