import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { User, Project, Link } from '../api';
import { ProjectModal } from './ProjectModal';
import { LinkModal } from './LinkModal';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Copy, 
  Check, 
  RotateCcw, 
  Moon, 
  Sun, 
  Key, 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  FolderOpen, 
  Code, 
  Globe, 
  Paintbrush, 
  Layers,
  Archive,
  RefreshCw,
  X,
  LogOut,
  Share2
} from 'lucide-react';

interface FaviconIconProps {
  url: string;
  type: string;
  getLinkIcon: (type: string) => React.ReactNode;
}

const FaviconIcon: React.FC<FaviconIconProps> = ({ url, type, getLinkIcon }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getCustomFaviconUrl = (linkUrl: string, linkType: string): string => {
    const lowerUrl = linkUrl.toLowerCase();
    
    // 1. Google Ecosystem Overrides
    if (lowerUrl.includes('drive.google.com')) {
      return 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png';
    }
    if (lowerUrl.includes('docs.google.com/spreadsheets') || lowerUrl.includes('sheets.new')) {
      return 'https://ssl.gstatic.com/docs/spreadsheets/favicon3.ico';
    }
    if (lowerUrl.includes('docs.google.com/document') || lowerUrl.includes('docs.new')) {
      return 'https://ssl.gstatic.com/docs/documents/images/kix-favicon-2023q4.ico';
    }
    if (lowerUrl.includes('docs.google.com/presentation') || lowerUrl.includes('slides.new')) {
      return 'https://ssl.gstatic.com/docs/presentations/images/favicon5.ico';
    }
    if (lowerUrl.includes('photos.google.com') || lowerUrl.includes('photos.app.goo.gl')) {
      return 'https://www.gstatic.com/social/photosui/images/logo/2025/favicon_alldp.ico';
    }
    if (lowerUrl.includes('meet.google.com')) {
      return 'https://ssl.gstatic.com/images/branding/product/1x/meet_2020q4_48dp.png';
    }
    if (lowerUrl.includes('calendar.google.com')) {
      return 'https://ssl.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png';
    }
    if (lowerUrl.includes('mail.google.com') || lowerUrl.includes('gmail.com')) {
      return 'https://ssl.gstatic.com/images/branding/product/1x/gmail_2020q4_48dp.png';
    }
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      return 'https://www.youtube.com/favicon.ico';
    }

    // 2. Microsoft Ecosystem Overrides
    if (lowerUrl.includes('onedrive.live.com') || lowerUrl.includes('onedrive.com')) {
      return 'https://photos.onedrive.com/favicon.ico';
    }
    if (lowerUrl.includes('excel.office.com') || lowerUrl.includes('excel.live.com')) {
      return 'https://res-1.cdn.office.net/files/sp-bootstrap/1.0.0/excel_favicon.ico';
    }
    if (lowerUrl.includes('word.office.com') || lowerUrl.includes('word.live.com')) {
      return 'https://res-1.cdn.office.net/files/sp-bootstrap/1.0.0/word_favicon.ico';
    }
    if (lowerUrl.includes('powerpoint.office.com') || lowerUrl.includes('powerpoint.live.com')) {
      return 'https://res-1.cdn.office.net/files/sp-bootstrap/1.0.0/powerpoint_favicon.ico';
    }
    if (lowerUrl.includes('teams.microsoft.com') || lowerUrl.includes('teams.live.com')) {
      return 'https://statics.teams.cdn.office.net/evergreen-assets/apps/teams_favicon.ico';
    }

    // 3. Other Popular Development & Collaboration Overrides
    if (lowerUrl.includes('github.com')) {
      return 'https://github.com/favicon.ico';
    }
    if (lowerUrl.includes('gitlab.com')) {
      return 'https://gitlab.com/favicon.ico';
    }
    if (lowerUrl.includes('figma.com')) {
      return 'https://www.figma.com/favicon.ico';
    }
    if (lowerUrl.includes('canva.com')) {
      return 'https://www.canva.com/favicon.ico';
    }
    if (lowerUrl.includes('notion.so') || lowerUrl.includes('notion.site')) {
      return 'https://www.notion.so/images/favicon.ico';
    }
    if (lowerUrl.includes('trello.com')) {
      return 'https://trello.com/favicon.ico';
    }
    if (lowerUrl.includes('slack.com')) {
      return 'https://slack.com/favicon.ico';
    }
    if (lowerUrl.includes('discord.com') || lowerUrl.includes('discord.gg')) {
      return 'https://discord.com/favicon.ico';
    }
    if (lowerUrl.includes('zoom.us') || lowerUrl.includes('zoom.com')) {
      return 'https://zoom.us/favicon.ico';
    }
    if (lowerUrl.includes('dropbox.com')) {
      return 'https://www.dropbox.com/static/images/favicon.ico';
    }
    if (lowerUrl.includes('jira.com') || lowerUrl.includes('atlassian.net')) {
      return 'https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon.png';
    }
    if (lowerUrl.includes('linkedin.com')) {
      return 'https://www.linkedin.com/favicon.ico';
    }
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      return 'https://x.com/favicon.ico';
    }
    if (lowerUrl.includes('spotify.com')) {
      return 'https://open.spotifycdn.com/cdn/images/favicon32.b64ecc03.png';
    }
    if (lowerUrl.includes('icloud.com')) {
      return 'https://www.icloud.com/favicon.ico';
    }
    if (lowerUrl.includes('adobe.com')) {
      return 'https://www.adobe.com/favicon.ico';
    }

    // 4. Type fallback overrides (e.g. when typing docs.google.com without full paths)
    if (linkType === 'doc') {
      return 'https://ssl.gstatic.com/docs/documents/images/kix-favicon-2023q4.ico';
    }
    if (linkType === 'sheet') {
      return 'https://ssl.gstatic.com/docs/spreadsheets/favicon3.ico';
    }
    if (linkType === 'slide') {
      return 'https://ssl.gstatic.com/docs/presentations/images/favicon5.ico';
    }
    if (linkType === 'drive') {
      return 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png';
    }
    if (linkType === 'figma') {
      return 'https://www.figma.com/favicon.ico';
    }
    if (linkType === 'repo') {
      return 'https://github.com/favicon.ico';
    }
    if (linkType === 'notion') {
      return 'https://www.notion.so/images/favicon.ico';
    }

    // 5. Fallback: DuckDuckGo favicon service (better quality & fallback than Google s2)
    try {
      const hostname = new URL(linkUrl.startsWith('http') ? linkUrl : 'https://' + linkUrl).hostname;
      return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
    } catch (e) {
      return '';
    }
  };

  const faviconUrl = getCustomFaviconUrl(url, type);

  return (
    <div className="link-tile-icon-wrapper" style={{ position: 'relative' }}>
      {!hasError && faviconUrl ? (
        <img 
          src={faviconUrl}
          alt=""
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          style={{ 
            width: '1.75rem', 
            height: '1.75rem', 
            objectFit: 'contain',
            display: isLoading ? 'none' : 'block',
            zIndex: 2
          }}
        />
      ) : null}
      {(hasError || !faviconUrl || isLoading) && (
        <div className="favicon-fallback" style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          {getLinkIcon(type)}
        </div>
      )}
    </div>
  );
};

interface DashboardViewProps {
  user: User;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onLogout }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(user.theme_preference);
  const [recoveryCode, setRecoveryCode] = useState(user.recovery_code);
  const [showCode, setShowCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active selection
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  const [showArchivedDialog, setShowArchivedDialog] = useState(false);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // URL Hash routing to synchronize active project and allow browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/project/')) {
        const projId = hash.replace('#/project/', '');
        setSelectedProjectId(projId || null);
      } else {
        setSelectedProjectId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Sync initial hash on mount

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleShareProject = (projectId: string) => {
    const shareUrl = `${window.location.origin}/#/share/${projectId}`;
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };
  
  // Fetch data
  const fetchData = async () => {
    try {
      const fetchedProjects = await api.getProjects(false);
      const fetchedLinks = await api.getLinks();
      setProjects(fetchedProjects);
      setLinks(fetchedLinks);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const fetchArchivedProjects = async () => {
    try {
      const fetched = await api.getProjects(true);
      setArchivedProjects(fetched.filter(p => p.archived_at !== null));
    } catch (err) {
      console.error('Error fetching archived projects:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showArchivedDialog) {
      fetchArchivedProjects();
    }
  }, [showArchivedDialog]);

  // Handle Theme Toggle
  const toggleTheme = async () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('linkhub_theme', nextTheme);
    document.documentElement.className = nextTheme;
    try {
      await api.updateTheme(nextTheme);
    } catch (err) {
      console.error('Failed to update theme:', err);
    }
  };

  // Sync theme to document element on mount
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // Handle Copy Recovery Code
  const copyRecoveryCode = () => {
    navigator.clipboard.writeText(recoveryCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Handle Regenerate Recovery Code
  const regenerateCode = async () => {
    if (!window.confirm('Are you sure you want to regenerate your recovery code? Your old code will stop working.')) return;
    try {
      const newCode = await api.regenerateRecoveryCode();
      setRecoveryCode(newCode);
      setShowCode(true);
    } catch (err) {
      alert('Failed to regenerate recovery code');
    }
  };

  // Project CRUD operations
  const handleSaveProject = async (name: string, color: string, description: string) => {
    try {
      if (editingProject) {
        await api.updateProject(editingProject.project_id, name, color, description);
      } else {
        await api.createProject(name, color, description);
      }
      fetchData();
    } catch (err) {
      alert('Error saving project');
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to archive this project? You can restore it later.')) return;
    try {
      await api.archiveProject(projectId);
      if (selectedProjectId === projectId) {
        window.location.hash = '';
      }
      fetchData();
    } catch (err) {
      alert('Error archiving project');
    }
  };

  const handleRestoreProject = async (projectId: string) => {
    try {
      await api.restoreProject(projectId);
      fetchArchivedProjects();
      fetchData();
    } catch (err) {
      alert('Error restoring project');
    }
  };

  const handlePermanentDeleteProject = async (projectId: string) => {
    if (!window.confirm('PERMANENT DELETION: Are you sure? This will delete the project and all its links forever.')) return;
    try {
      await api.deleteProjectPermanently(projectId);
      fetchArchivedProjects();
      fetchData();
    } catch (err) {
      alert('Error deleting project');
    }
  };

  // Link CRUD operations
  const handleSaveLink = async (alias: string, url: string) => {
    if (!selectedProjectId) return;
    try {
      if (editingLink) {
        await api.updateLink(editingLink.link_id, alias, url);
      } else {
        await api.createLink(selectedProjectId, alias, url);
      }
      fetchData();
    } catch (err) {
      alert('Error saving link');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!window.confirm('Are you sure you want to delete this link?')) return;
    try {
      await api.deleteLink(linkId);
      fetchData();
    } catch (err) {
      alert('Error deleting link');
    }
  };

  const copyLinkToClipboard = (url: string, linkId: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkId(linkId);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  // Live auto-detect icon function for listing links
  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'repo': return <Code size={16} />;
      case 'doc': return <FileText size={16} style={{ color: '#2684fc' }} />;
      case 'sheet': return <FileSpreadsheet size={16} style={{ color: '#0f9d58' }} />;
      case 'slide': return <Presentation size={16} style={{ color: '#f4b400' }} />;
      case 'drive': return <FolderOpen size={16} style={{ color: '#f4b400' }} />;
      case 'figma': return <Paintbrush size={16} style={{ color: '#f24e1e' }} />;
      case 'notion': return <Layers size={16} style={{ color: 'var(--text)' }} />;
      default: return <Globe size={16} />;
    }
  };

  // Select project context
  const activeProject = projects.find(p => p.project_id === selectedProjectId);
  const activeLinks = links.filter(l => l.project_id === selectedProjectId);

  // Search filtering
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLinks = links.filter(l => 
    l.alias.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container" style={{ animation: 'fadeIn var(--transition-normal) forwards' }}>
      
      {/* Top Header Row */}
      <header className="dashboard-header">
        <div className="header-brand">
          <span 
            onClick={() => { window.location.hash = ''; }}
            className="logo-gradient"
            style={{ 
              fontSize: '1.25rem', 
              fontWeight: 800, 
              cursor: 'pointer',
            }}
          >
            LinkHub
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '1.25rem' }}>/</span>
          <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            {activeProject ? activeProject.name : 'Dashboard'}
          </span>
        </div>

        {/* Header Controls */}
        <div className="header-controls">
          
          {/* Recovery Code Control */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.35rem 0.75rem',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem'
              }}
            >
              <Key size={14} style={{ color: 'var(--text-muted)' }} />
              <code style={{ fontSize: '0.85rem', letterSpacing: '2px', background: 'none', padding: 0 }}>
                {showCode ? recoveryCode : '••••••'}
              </code>
              <button 
                onClick={() => setShowCode(!showCode)} 
                className="btn-icon" 
                style={{ width: '1.5rem', height: '1.5rem', border: 'none', backgroundColor: 'transparent' }}
                title={showCode ? "Hide Recovery Code" : "Reveal Recovery Code"}
                aria-label={showCode ? "Hide Recovery Code" : "Reveal Recovery Code"}
              >
                {showCode ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              
              {showCode && (
                <>
                  <button 
                    onClick={copyRecoveryCode} 
                    className="btn-icon" 
                    style={{ width: '1.5rem', height: '1.5rem', border: 'none', backgroundColor: 'transparent', color: codeCopied ? 'var(--color-emerald)' : 'var(--text-muted)' }}
                    title="Copy Code"
                    aria-label="Copy recovery code"
                  >
                    {codeCopied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <button 
                    onClick={regenerateCode} 
                    className="btn-icon" 
                    style={{ width: '1.5rem', height: '1.5rem', border: 'none', backgroundColor: 'transparent' }}
                    title="Regenerate Code"
                    aria-label="Regenerate recovery code"
                  >
                    <RefreshCw size={13} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Theme Switcher */}
          <button 
            onClick={toggleTheme} 
            className="btn-icon" 
            title="Toggle Theme"
            aria-label="Toggle visual theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Log Out */}
          <button 
            onClick={onLogout} 
            className="btn-icon" 
            title="Sign Out"
            id="logout-btn"
            aria-label="Sign out of account"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      {selectedProjectId === null ? (
        
        /* ---------------- DASHBOARD VIEW (ALL PROJECTS) ---------------- */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
          
          {/* Welcome Greeting Banner */}
          <div className="welcome-banner">
            <h1 className="welcome-greeting">Hello, {user.name}.</h1>
          </div>
          
          {/* Search and Action Bar */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '1rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-muted)',
                  pointerEvents: 'none'
                }} 
              />
              <input
                type="text"
                className="input-field"
                placeholder="Search links, aliases, projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
                id="search-input"
              />
            </div>
            
            <button 
              className="btn btn-primary"
              id="new-project-btn"
              onClick={() => { setEditingProject(null); setIsProjectModalOpen(true); }}
            >
              <Plus size={18} />
              <span>New Project</span>
            </button>
          </div>

          {/* Search Result Mode vs Normal Dashboard */}
          {searchQuery.trim() !== '' ? (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  Matching Projects ({filteredProjects.length})
                </h3>
                {filteredProjects.length > 0 ? (
                  <div className="projects-grid" style={{ marginTop: 0 }}>
                    {filteredProjects.map(project => (
                      <div 
                        key={project.project_id} 
                        className={`card project-tile border-color-${project.color}`}
                        onClick={() => { window.location.hash = `#/project/${project.project_id}`; setSearchQuery(''); }}
                        style={{ cursor: 'pointer' }}
                      >
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 600, wordBreak: 'break-word' }}>{project.name}</h4>
                        {project.description && (
                          <p style={{ 
                            fontSize: '0.8rem', 
                            color: 'var(--text-muted)', 
                            marginTop: '0.5rem',
                            marginBottom: 'auto',
                            wordBreak: 'break-word',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textAlign: 'left',
                            lineHeight: '1.3'
                          }}>
                            {project.description}
                          </p>
                        )}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: project.description ? '0.75rem' : 'auto', alignSelf: 'flex-start' }}>
                          {links.filter(l => l.project_id === project.project_id).length} links
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No projects match this search.</p>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  Matching Links ({filteredLinks.length})
                </h3>
                {filteredLinks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredLinks.map(link => {
                      const proj = projects.find(p => p.project_id === link.project_id);
                      return (
                        <div 
                          key={link.link_id} 
                          className="card"
                          style={{ 
                            padding: '1rem 1.25rem', 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            gap: '1rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                            <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                              {getLinkIcon(link.type)}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                              <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ 
                                  fontWeight: 600, 
                                  color: 'var(--text)', 
                                  textDecoration: 'none',
                                  fontSize: '0.95rem'
                                }}
                              >
                                {link.alias}
                              </a>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {proj ? proj.name : 'Unknown Project'} • {link.url}
                              </span>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button 
                              onClick={() => copyLinkToClipboard(link.url, link.link_id)}
                              className="btn-icon"
                              title="Copy URL"
                              aria-label="Copy link URL"
                            >
                              {copiedLinkId === link.link_id ? <Check size={16} style={{ color: 'var(--color-emerald)' }} /> : <Copy size={16} />}
                            </button>
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn-icon"
                              title="Open link"
                              aria-label="Open link in new tab"
                            >
                              <ExternalLink size={16} />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No links match this search.</p>
                )}
              </div>
            </div>
          ) : (
            /* Normal dashboard grid */
            <>
              {projects.length > 0 ? (
                <div className="projects-grid">
                  {projects.map(project => (
                    <div 
                      key={project.project_id} 
                      className={`card project-tile border-color-${project.color}`}
                      onClick={() => { window.location.hash = `#/project/${project.project_id}`; }}
                      style={{ cursor: 'pointer' }}
                    >
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 600, wordBreak: 'break-word' }}>{project.name}</h4>
                      {project.description && (
                        <p style={{ 
                          fontSize: '0.8rem', 
                          color: 'var(--text-muted)', 
                          marginTop: '0.5rem',
                          marginBottom: 'auto',
                          wordBreak: 'break-word',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textAlign: 'left',
                          lineHeight: '1.3'
                        }}>
                          {project.description}
                        </p>
                      )}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: project.description ? '0.75rem' : 'auto', alignSelf: 'flex-start' }}>
                        {links.filter(l => l.project_id === project.project_id).length} links
                      </span>
                    </div>
                  ))}
                  
                  {/* Plus card placeholder */}
                  <div 
                    className="card project-tile"
                    onClick={() => { setEditingProject(null); setIsProjectModalOpen(true); }}
                    style={{ 
                      cursor: 'pointer', 
                      borderStyle: 'dashed', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      backgroundColor: 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <Plus size={24} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Add Project</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty state */
                <div 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '6rem 2rem',
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'center',
                    gap: '1rem',
                    marginTop: '1.5rem'
                  }}
                >
                  <FolderOpen size={48} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                  <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>No projects yet</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '320px' }}>
                      Create a project card to group and organize your workspace links.
                    </p>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => { setEditingProject(null); setIsProjectModalOpen(true); }}
                    style={{ marginTop: '0.5rem' }}
                  >
                    <Plus size={16} />
                    <span>Create Your First Project</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Archived Projects Entry Point at the bottom */}
          <footer style={{ marginTop: 'auto', paddingTop: '4rem', display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={() => setShowArchivedDialog(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              id="view-archived-btn"
            >
              <Archive size={14} />
              <span>Archived Projects</span>
            </button>
          </footer>
        </div>
      ) : (
        
        /* ---------------- PROJECT DETAILS VIEW ---------------- */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
          
          {/* Back Navigation & Project Title */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              
              {/* Back Button */}
              <button 
                onClick={() => { window.location.hash = ''; }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontWeight: 500,
                  width: 'fit-content'
                }}
              >
                <ChevronLeft size={16} />
                <span>Back to projects</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                <div 
                  style={{ 
                    width: '0.75rem', 
                    height: '0.75rem', 
                    borderRadius: '50%',
                    backgroundColor: `var(--color-${activeProject?.color || 'indigo'})`
                  }} 
                />
                <h1 style={{ fontSize: '1.75rem' }}>{activeProject?.name}</h1>
              </div>
            </div>

            {/* Actions for current project */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => handleShareProject(activeProject?.project_id || '')}
                className="btn btn-secondary"
                title="Share Project"
                style={{ padding: '0.5rem', color: shareCopied ? 'var(--color-emerald)' : 'inherit' }}
                aria-label="Share project"
              >
                {shareCopied ? <Check size={16} /> : <Share2 size={16} />}
              </button>
              <button 
                onClick={() => { setEditingProject(activeProject || null); setIsProjectModalOpen(true); }}
                className="btn btn-secondary"
                title="Rename Project"
                style={{ padding: '0.5rem' }}
                aria-label="Rename project"
              >
                <Edit3 size={16} />
              </button>
              <button 
                onClick={() => handleArchiveProject(activeProject?.project_id || '')}
                className="btn btn-secondary"
                title="Archive Project"
                style={{ padding: '0.5rem' }}
                aria-label="Archive project"
              >
                <Archive size={16} />
              </button>
            </div>
          </div>

          {/* Links Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Links ({activeLinks.length})</h2>
              <button 
                className="btn btn-primary"
                id="add-link-btn"
                onClick={() => { setEditingLink(null); setIsLinkModalOpen(true); }}
              >
                <Plus size={16} />
                <span>Add Link</span>
              </button>
            </div>

            {activeLinks.length > 0 ? (
              <div className="links-grid">
                {activeLinks.map(link => (
                  <div 
                    key={link.link_id} 
                    className="card link-tile"
                    onClick={() => window.open(link.url, '_blank')}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Link Label and Icon */}
                    <FaviconIcon url={link.url} type={link.type} getLinkIcon={getLinkIcon} />

                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflow: 'hidden' }}>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="link-tile-alias"
                        title={link.alias}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {link.alias}
                      </a>
                      <span className="link-tile-url" title={link.url}>
                        {new URL(link.url.startsWith('http') ? link.url : 'https://' + link.url).hostname}
                      </span>
                    </div>

                    {/* Actions on link */}
                    <div className="link-tile-actions">
                      <button 
                        onClick={(e) => { e.stopPropagation(); copyLinkToClipboard(link.url, link.link_id); }}
                        className="btn-icon"
                        style={{ width: '2rem', height: '2rem' }}
                        title="Copy Link"
                        aria-label="Copy link URL"
                      >
                        {copiedLinkId === link.link_id ? <Check size={14} style={{ color: 'var(--color-emerald)' }} /> : <Copy size={14} />}
                      </button>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-icon"
                        style={{ width: '2rem', height: '2rem' }}
                        title="Open Link"
                        aria-label="Open link in new tab"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={14} />
                      </a>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingLink(link); setIsLinkModalOpen(true); }}
                        className="btn-icon"
                        style={{ width: '2rem', height: '2rem' }}
                        title="Edit Link"
                        aria-label="Edit link alias or URL"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteLink(link.link_id); }}
                        className="btn-icon"
                        style={{ color: 'var(--color-rose)', width: '2rem', height: '2rem' }}
                        title="Delete Link"
                        aria-label="Delete link"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '5rem 2rem',
                  border: '1px dashed var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center',
                  gap: '0.75rem'
                }}
              >
                <Globe size={32} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>No links saved in this project</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Keep your design templates, repositories, and docs at hand.
                  </p>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => { setEditingLink(null); setIsLinkModalOpen(true); }}
                  style={{ marginTop: '0.25rem' }}
                >
                  <Plus size={14} />
                  <span>Add First Link</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- PROJECT MODAL ---------------- */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => { setIsProjectModalOpen(false); setEditingProject(null); }}
        onSave={handleSaveProject}
        project={editingProject}
      />

      {/* ---------------- LINK MODAL ---------------- */}
      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => { setIsLinkModalOpen(false); setEditingLink(null); }}
        onSave={handleSaveLink}
        link={editingLink}
      />

      {/* ---------------- ARCHIVED PROJECTS POPUP DIALOG ---------------- */}
      {showArchivedDialog && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(9, 9, 11, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100
          }}
          onClick={() => setShowArchivedDialog(false)}
        >
          <div 
            style={{
              width: '90%',
              maxWidth: '500px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              maxHeight: '80vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Archive size={20} />
                <h2 style={{ fontSize: '1.25rem' }}>Archived Projects</h2>
              </div>
              <button 
                onClick={() => setShowArchivedDialog(false)} 
                className="btn-icon"
                aria-label="Close archived projects"
              >
                <X size={18} />
              </button>
            </div>

            {archivedProjects.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                {archivedProjects.map(project => (
                  <div 
                    key={project.project_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface-hover)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div 
                        style={{ 
                          width: '0.5rem', 
                          height: '0.5rem', 
                          borderRadius: '50%',
                          backgroundColor: `var(--color-${project.color})` 
                        }} 
                      />
                      <span style={{ fontWeight: 600 }}>{project.name}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        onClick={() => handleRestoreProject(project.project_id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem' }}
                        title="Restore Project"
                      >
                        <RotateCcw size={12} />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => handlePermanentDeleteProject(project.project_id)}
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem' }}
                        title="Delete Permanently"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <p>No archived projects found.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
