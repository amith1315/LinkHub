import React, { useState } from 'react';
import { api } from '../api';
import type { User } from '../api';
import { ArrowRight, Key, Loader } from 'lucide-react';

interface LandingViewProps {
  onLoginSuccess: (user: User) => void;
  isAnimating: boolean;
  setIsAnimating: (animating: boolean) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onLoginSuccess,
  isAnimating,
  setIsAnimating
}) => {
  const [name, setName] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submittedName, setSubmittedName] = useState('');

  // Handle register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const user = await api.createUser(name);
      setSubmittedName(user.name);
      setIsAnimating(true);
      
      // Delay before dashboard goes live to allow transition to complete
      setTimeout(() => {
        setIsAnimating(false);
        onLoginSuccess(user);
      }, 500); // matches --transition-slow (400ms) plus a slight buffer
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle recover
  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const user = await api.recoverUser(recoveryCode);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Invalid recovery code');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAnimating) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'var(--bg)',
          zIndex: 999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div className="logo-animating">
          Hello, {submittedName}
        </div>
      </div>
    );
  }

  return (
    <main 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        minHeight: '80vh',
        animation: 'fadeIn var(--transition-normal) forwards'
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem'
        }}
      >
        {/* Large Centered Logo */}
        <div>
          <h1 
            style={{ 
              fontSize: '3rem', 
              fontWeight: 800, 
              background: 'linear-gradient(135deg, #ff8c00, #ff4500)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem'
            }}
          >
            LinkHub
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Home for all your project-related links.
          </p>
        </div>

        {error && (
          <div 
            style={{ 
              backgroundColor: 'rgba(244, 63, 94, 0.1)', 
              color: 'var(--color-rose)', 
              padding: '0.75rem 1rem', 
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              border: '1px solid rgba(244, 63, 94, 0.2)'
            }}
          >
            {error}
          </div>
        )}

        {!isRecovering ? (
          /* Register Flow */
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
              <label 
                htmlFor="name-input" 
                style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}
              >
                What's your name?
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="name-input"
                  type="text"
                  placeholder="Enter your name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  disabled={isLoading}
                  autoFocus
                  maxLength={30}
                  required
                  style={{ paddingRight: '3rem' }}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isLoading || !name.trim()}
                  style={{
                    position: 'absolute',
                    right: '0.35rem',
                    height: '2.25rem',
                    width: '2.25rem',
                    padding: 0,
                    borderRadius: 'var(--radius-sm)'
                  }}
                  aria-label="Submit name"
                >
                  {isLoading ? <Loader size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              id="goto-recover-btn"
              onClick={() => { setError(null); setIsRecovering(true); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                alignSelf: 'center'
              }}
            >
              Already have an account? Enter recovery code
            </button>
          </form>
        ) : (
          /* Recovery Flow */
          <form onSubmit={handleRecover} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
              <label 
                htmlFor="recovery-input" 
                style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}
              >
                Access Account via Recovery Code
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Key size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
                <input
                  id="recovery-input"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field"
                  disabled={isLoading}
                  autoFocus
                  required
                  style={{ paddingLeft: '2.75rem', paddingRight: '3rem' }}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isLoading || recoveryCode.length !== 6}
                  style={{
                    position: 'absolute',
                    right: '0.35rem',
                    height: '2.25rem',
                    width: '2.25rem',
                    padding: 0,
                    borderRadius: 'var(--radius-sm)'
                  }}
                  aria-label="Recover account"
                >
                  {isLoading ? <Loader size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
              <button
                type="button"
                id="cancel-recover-btn"
                onClick={() => { setError(null); setIsRecovering(false); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
};
