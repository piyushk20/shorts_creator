import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, Cpu, Volume2, Video, Database, Share2, Globe, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { SocialBrandingTab } from './SocialBrandingTab';

interface SettingsModalProps {
  onClose: () => void;
  initialTab?: 'social' | 'providers' | 'engine';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, initialTab = 'social' }) => {
  const [activeTab, setActiveTab] = useState<'social' | 'providers' | 'engine'>(initialTab);
  const [settings, setSettings] = useState<any>(null);
  const [mediaSources, setMediaSources] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getSettings().catch(() => null),
      api.getMediaSources().catch(() => null)
    ]).then(([settingsData, mediaData]) => {
      setSettings(settingsData);
      setMediaSources(mediaData);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.78)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '860px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px 32px',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: '16px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header with Title and Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', margin: 0, fontWeight: 800 }}>
              Studio Settings & Brand Profiles
            </h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '13px', margin: '4px 0 0 0' }}>
              Configure social media handles, stock media integrations, and rendering engines.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          paddingBottom: '12px',
          marginBottom: '24px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('social')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'social' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'social' ? '#38bdf8' : 'var(--text-dim)',
              border: activeTab === 'social' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <Share2 size={16} />
            <span>Social Media Handles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('providers')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'providers' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: activeTab === 'providers' ? '#34d399' : 'var(--text-dim)',
              border: activeTab === 'providers' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <Globe size={16} />
            <span>Public APIs & Media</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('engine')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'engine' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'engine' ? '#818cf8' : 'var(--text-dim)',
              border: activeTab === 'engine' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <Cpu size={16} />
            <span>Engine Diagnostics</span>
          </button>
        </div>

        {/* Tab 1: Social Media Handles */}
        {activeTab === 'social' && (
          <SocialBrandingTab onSaved={() => {}} />
        )}

        {/* Tab 2: Public APIs & Media Sources */}
        {activeTab === 'providers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '4px' }}>
              Curated zero-auth public media providers connected from <code>public-apis/public-apis</code>:
            </div>
            {mediaSources?.providers?.map((p: any) => (
              <div key={p.name} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 18px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <Globe size={22} color="#10b981" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{p.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 400 }}>• {p.type}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>{p.description}</div>
                  <div style={{ color: '#38bdf8', fontSize: '11px', marginTop: '4px' }}>License: {p.license}</div>
                </div>
                <span className="status-pill status-ready">Zero-Auth</span>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Engine Diagnostics */}
        {activeTab === 'engine' && (
          <div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading diagnostics...</div>
            ) : settings ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <Cpu size={22} color="#818cf8" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>LLM Script Provider</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Current: {settings.llm_provider.toUpperCase()} (Structured JSON Schema Enforcement)</div>
                  </div>
                  <span className="status-pill status-ready">Active</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <Volume2 size={22} color="#06b6d4" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Neural Voiceover (TTS)</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Edge-TTS Neural (English & Hindi support with sub-second word alignment)</div>
                  </div>
                  <span className="status-pill status-ready">Verified</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <Video size={22} color="#10b981" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Video Compositing & Remotion / FFmpeg</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Remotion Engine & FFmpeg 7.1 Essentials Build (H.264 / AAC 30fps)</div>
                  </div>
                  <span className="status-pill status-ready">Installed</span>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
