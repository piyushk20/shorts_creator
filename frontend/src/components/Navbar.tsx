import React from 'react';
import { Film, PlusCircle, Settings, FileText, Scissors, Share2 } from 'lucide-react';

interface NavbarProps {
  onOpenCreate: (mode?: 'trends' | 'idea' | 'script' | 'vox') => void;
  onOpenSettings: (tab?: 'social' | 'providers' | 'engine') => void;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreate, onOpenSettings, onGoHome }) => {
  return (
    <header className="navbar">
      <div className="brand-logo" onClick={onGoHome} style={{ cursor: 'pointer' }}>
        <Film size={26} color="#6366f1" />
        <span>CreatorFlow</span>
        <span className="brand-badge">STUDIO AI</span>
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
