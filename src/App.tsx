import { useState, useEffect } from 'react';
import { LandingView } from './components/LandingView';
import { DashboardView } from './components/DashboardView';
import { api } from './api';
import type { User } from './api';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sync / intercept pending share link on initial load
  useEffect(() => {
    // Read session cached in localStorage
    const cachedId = localStorage.getItem('linkhub_user_id');
    const cachedName = localStorage.getItem('linkhub_user_name');
    const cachedCode = localStorage.getItem('linkhub_recovery_code');
    const cachedTheme = localStorage.getItem('linkhub_theme') as 'light' | 'dark' || 'light'; // Default to 'light'

    // Synchronize default/cached theme configuration to HTML element
    document.documentElement.className = cachedTheme;

    // Check if landing directly on a shared project link
    const hash = window.location.hash;
    if (hash.startsWith('#/share/')) {
      const shareId = hash.replace('#/share/', '');
      if (shareId) {
        localStorage.setItem('linkhub_pending_share', shareId);
      }
    }

    if (cachedId && cachedName && cachedCode) {
      setUser({
        user_id: cachedId,
        name: cachedName,
        recovery_code: cachedCode,
        theme_preference: cachedTheme
      });
    }
    setIsLoading(false);
  }, []);

  const importShared = async (projId: string) => {
    try {
      const newProj = await api.importSharedProject(projId);
      alert(`Project "${newProj.name}" successfully imported into your workspace!`);
      // Select the newly imported project
      window.location.hash = `#/project/${newProj.project_id}`;
    } catch (err: any) {
      alert(err.message || 'Failed to import shared project.');
      window.location.hash = '';
    }
  };

  // Monitor deep-link shares for logged in users
  useEffect(() => {
    if (!user) return;

    const handleHash = async () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/share/')) {
        const projId = hash.replace('#/share/', '');
        if (projId) {
          await importShared(projId);
        }
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash(); // Run on login/mount

    return () => window.removeEventListener('hashchange', handleHash);
  }, [user]);

  const handleLoginSuccess = async (loggedInUser: User) => {
    localStorage.setItem('linkhub_user_id', loggedInUser.user_id);
    localStorage.setItem('linkhub_user_name', loggedInUser.name);
    localStorage.setItem('linkhub_recovery_code', loggedInUser.recovery_code);
    localStorage.setItem('linkhub_theme', loggedInUser.theme_preference);
    setUser(loggedInUser);

    // Import project if there was a pending share cached
    const pendingShare = localStorage.getItem('linkhub_pending_share');
    if (pendingShare) {
      localStorage.removeItem('linkhub_pending_share');
      // Small timeout to allow state to settle
      setTimeout(() => {
        importShared(pendingShare);
      }, 100);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('linkhub_user_id');
    localStorage.removeItem('linkhub_user_name');
    localStorage.removeItem('linkhub_recovery_code');
    // We don't remove linkhub_theme as it's a device preference
    setUser(null);
    window.location.hash = '';
  };

  if (isLoading) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'var(--bg)',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-sans)',
          fontSize: '1rem',
          fontWeight: 500
        }}
      >
        Loading LinkHub...
      </div>
    );
  }

  return (
    <>
      {!user || isAnimating ? (
        <LandingView 
          onLoginSuccess={handleLoginSuccess} 
          isAnimating={isAnimating}
          setIsAnimating={setIsAnimating}
        />
      ) : (
        <DashboardView 
          user={user} 
          onLogout={handleLogout} 
        />
      )}
    </>
  );
}

export default App;
