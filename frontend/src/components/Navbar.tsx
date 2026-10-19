import React from 'react';
import { Film, PlusCircle, Settings, RefreshCw } from 'lucide-react';

interface NavbarProps {
  onOpenCreate: () => void;
  onOpenSettings: () => void;
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
        <button className="btn btn-secondary btn-sm" onClick={onOpenSettings}>
          <Settings size={15} />
          <span>Providers & Engine</span>
        </button>
        <button className="btn btn-primary" onClick={onOpenCreate}>
          <PlusCircle size={16} />
          <span>Create New Video</span>
        </button>
      </div>
    </header>
  );
};
