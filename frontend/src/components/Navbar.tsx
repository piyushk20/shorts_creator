import React from 'react';
import { Film, PlusCircle, Settings, FileText, Scissors, Share2, Sparkles, Video } from 'lucide-react';

interface NavbarProps {
  currentView?: 'studio' | 'renders' | 'clips';
  rendersCount?: number;
  clipsCount?: number;
  onNavigate?: (view: 'studio' | 'renders' | 'clips') => void;
  onOpenCreate: (mode?: 'trends' | 'idea' | 'script' | 'vox') => void;
  onOpenSettings: (tab?: 'social' | 'providers' | 'engine') => void;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentView = 'studio',
  rendersCount = 0,
  clipsCount = 0,
  onNavigate,
  onOpenCreate, 
  onOpenSettings, 
  onGoHome 
}) => {
  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div className="brand-logo" onClick={onGoHome} style={{ cursor: 'pointer' }}>
          <Film size={26} color="#6366f1" />
          <span>CreatorFlow</span>
          <span className="brand-badge">STUDIO AI</span>
        </div>

        {/* Studio, Shorts Clips & Renders Primary Navigation Tabs */}
        {onNavigate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '28px' }}>
            <button
              type="button"
              onClick={() => onNavigate('studio')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: currentView === 'studio' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: currentView === 'studio' ? '#818cf8' : 'var(--text-dim)',
                border: currentView === 'studio' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <Sparkles size={14} color={currentView === 'studio' ? '#818cf8' : 'var(--text-dim)'} />
              <span>Studio</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('clips')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: currentView === 'clips' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: currentView === 'clips' ? '#f472b6' : 'var(--text-dim)',
                border: currentView === 'clips' ? '1px solid rgba(236, 72, 153, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.15s ease'
              }}
            >
              <Scissors size={14} color={currentView === 'clips' ? '#ec4899' : 'var(--text-dim)'} />
              <span>Shorts Clips</span>
              {clipsCount > 0 && (
                <span style={{
                  background: currentView === 'clips' ? '#ec4899' : 'rgba(236, 72, 153, 0.25)',
                  color: currentView === 'clips' ? '#ffffff' : '#f472b6',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '1px 7px',
                  borderRadius: '10px'
                }}>
                  {clipsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('renders')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: currentView === 'renders' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                color: currentView === 'renders' ? '#34d399' : 'var(--text-dim)',
                border: currentView === 'renders' ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.15s ease'
              }}
            >
              <Video size={14} color={currentView === 'renders' ? '#10b981' : 'var(--text-dim)'} />
              <span>Successful Renders</span>
              {rendersCount > 0 && (
                <span style={{
                  background: currentView === 'renders' ? '#10b981' : 'rgba(16, 185, 129, 0.25)',
                  color: currentView === 'renders' ? '#041f14' : '#34d399',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '1px 7px',
                  borderRadius: '10px'
                }}>
                  {rendersCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="nav-actions">
        {/* Social Media Details Tab */}
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => onOpenSettings('social')}
          style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
        >
          <Share2 size={15} color="#38bdf8" />
          <span>Social Media</span>
        </button>

        {/* Engine & Providers */}
        <button className="btn btn-secondary btn-sm" onClick={() => onOpenSettings('providers')}>
          <Settings size={15} />
          <span>Settings</span>
        </button>

        {/* Vox Explainer */}
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => onOpenCreate('vox')}
          style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
        >
          <Scissors size={15} color="#f59e0b" />
          <span>Vox Explainer</span>
        </button>

        {/* Provide Script */}
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => onOpenCreate('script')}
          style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
        >
          <FileText size={15} color="#10b981" />
          <span>Provide Script</span>
        </button>

        {/* New Video */}
        <button className="btn btn-primary" onClick={() => onOpenCreate('trends')}>
          <PlusCircle size={16} />
          <span>New Video</span>
        </button>
      </div>
    </header>
  );
};
