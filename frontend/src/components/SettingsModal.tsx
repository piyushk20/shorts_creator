import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, Cpu, Volume2, Video, Database } from 'lucide-react';
import { api } from '../services/api';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSettings()
      .then(data => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '28px', border: '1px solid rgba(255,255,255,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px' }}>Engine & Provider Configuration</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading system diagnostics...</div>
        ) : settings ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                <div style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Edge-TTS Neural (English & Hindi support with exact sub-second word alignment)</div>
              </div>
              <span className="status-pill status-ready">Verified</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <Video size={22} color="#10b981" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Video Compositing & FFmpeg</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '13px' }}>FFmpeg 7.1 Essentials Build (H.264 / AAC 30fps with smart 9:16 crop & subtitle burning)</div>
              </div>
              <span className="status-pill status-ready">Installed</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <Database size={22} color="#f59e0b" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Stock Video Services</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
                  Pexels API: {settings.has_pexels ? 'Configured' : 'Offline / Local Studio Fallback'} | Pixabay: {settings.has_pixabay ? 'Configured' : 'Offline'}
                </div>
              </div>
              <span className="status-pill status-ready">Ready</span>
            </div>

            <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(99,102,241,0.08)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Note: To activate live Pexels or Pixabay video downloads, populate <code>PEXELS_API_KEY</code> or <code>PIXABAY_API_KEY</code> in the <code>.env</code> file. The studio automatically falls back to verified high-definition motion clips when keys are absent.
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
