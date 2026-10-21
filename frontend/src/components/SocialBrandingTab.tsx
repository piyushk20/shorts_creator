import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Check, 
  Copy, 
  Sparkles, 
  Eye, 
  Save, 
  ThumbsUp, 
  CheckCircle2, 
  Sliders,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

interface SocialPlatform {
  id: string;
  name: string;
  handle: string;
  cta_text: string;
  color: string;
  accent_bg: string;
  prefix: string;
  placeholder: string;
  recommended_cta: string;
}

interface SocialBrandingTabProps {
  onSaved?: (branding: any) => void;
}

export const SocialBrandingTab: React.FC<SocialBrandingTabProps> = ({ onSaved }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const [activePlatformId, setActivePlatformId] = useState<string>('facebook');
  const [handle, setHandle] = useState<string>('Shelf Wisdom');
  const [ctaText, setCtaText] = useState<string>('follow and like for more');
  const [autoApply, setAutoApply] = useState<boolean>(true);
  const [position, setPosition] = useState<string>('bottom_card');
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);

  // Load from API or localStorage
  useEffect(() => {
    api.getSocialBranding()
      .then((data) => {
        if (data) {
          setActivePlatformId(data.active_platform || 'facebook');
          setHandle(data.handle || 'Shelf Wisdom');
          setCtaText(data.cta_text || 'follow and like for more');
          setAutoApply(data.auto_apply_outro !== false);
          setPosition(data.position || 'bottom_card');
          if (data.platforms && data.platforms.length > 0) {
            setPlatforms(data.platforms);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Could not load from API, checking local storage', err);
        const cached = localStorage.getItem('creatorflow_social_branding');
        if (cached) {
          try {
            const data = JSON.parse(cached);
            setActivePlatformId(data.active_platform || 'facebook');
            setHandle(data.handle || 'Shelf Wisdom');
            setCtaText(data.cta_text || 'follow and like for more');
          } catch (e) {}
        }
        setLoading(false);
      });
  }, []);

  const currentPlatform = platforms.find((p) => p.id === activePlatformId) || {
    id: activePlatformId,
    name: activePlatformId.toUpperCase(),
    handle: handle,
    cta_text: ctaText,
    color: '#1877F2',
    accent_bg: 'rgba(24, 119, 242, 0.08)',
    prefix: `${activePlatformId} : `,
    placeholder: 'Enter handle',
    recommended_cta: 'follow and like for more'
  };

  const handlePlatformChange = (newId: string) => {
    setActivePlatformId(newId);
    const target = platforms.find((p) => p.id === newId);
    if (target) {
      setHandle(target.handle || '');
      setCtaText(target.cta_text || target.recommended_cta || 'follow and like for more');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const updatedPlatforms = platforms.map((p) => {
      if (p.id === activePlatformId) {
        return { ...p, handle, cta_text: ctaText };
      }
      return p;
    });

    const payload = {
      active_platform: activePlatformId,
      handle,
      cta_text: ctaText,
      auto_apply_outro: autoApply,
      position,
      platforms: updatedPlatforms,
    };

    try {
      await api.updateSocialBranding(payload);
      localStorage.setItem('creatorflow_social_branding', JSON.stringify(payload));
      setPlatforms(updatedPlatforms);
      setSaving(false);
      setSavedSuccess(true);
      if (onSaved) onSaved(payload);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving branding', err);
      localStorage.setItem('creatorflow_social_branding', JSON.stringify(payload));
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const presetCtas = [
    'follow and like for more',
    'subscribe for more',
    'follow for daily wisdom',
    'join our community',
    'turn on notifications'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Intro Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={20} color="#38bdf8" />
            Social Media & Outro Call-To-Action
          </h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '13px', margin: '4px 0 0 0' }}>
            Configure your social handles and call-to-actions to automatically generate on-screen badges in the final frame.
          </p>
        </div>

        {savedSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <CheckCircle2 size={14} /> Saved & Active
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Left Column: Form Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Platform Selector Dropdown */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
              Select Social Media Platform
            </label>
            <select
              value={activePlatformId}
              onChange={(e) => handlePlatformChange(e.target.value)}
              className="select-input"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="facebook">Facebook (Shelf Wisdom)</option>
              <option value="twitter">Twitter / X (@ShelfWisdom)</option>
              <option value="instagram">Instagram (@shelf.wisdom)</option>
              <option value="youtube">YouTube (Subscribe)</option>
              <option value="reddit">Reddit (r/ShelfWisdom)</option>
              <option value="tiktok">TikTok (@shelf.wisdom)</option>
              <option value="linkedin">LinkedIn (Shelf Wisdom)</option>
            </select>
          </div>

          {/* Social Handle Input */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
              Profile Handle / Channel Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder={currentPlatform.placeholder || 'e.g. Shelf Wisdom'}
                className="text-input"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'var(--font-mono, monospace)',
                  outline: 'none'
                }}
              />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
              Displayed on-screen as: <strong style={{ color: currentPlatform.color }}>{currentPlatform.prefix}{handle || '...'}</strong>
            </span>
          </div>

          {/* CTA Text Input */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
              Call To Action Text
            </label>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="e.g. follow and like for more"
              className="text-input"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            />

            {/* Quick Presets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {presetCtas.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCtaText(preset)}
                  style={{
                    background: ctaText.toLowerCase() === preset.toLowerCase() ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: ctaText.toLowerCase() === preset.toLowerCase() ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: ctaText.toLowerCase() === preset.toLowerCase() ? '#38bdf8' : 'var(--text-dim)',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Outro Placement & Auto-apply */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            <input
              type="checkbox"
              id="autoApplyOutro"
              checked={autoApply}
              onChange={(e) => setAutoApply(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer' }}
            />
            <label htmlFor="autoApplyOutro" style={{ fontSize: '13px', cursor: 'pointer', color: 'var(--text-main)' }}>
              <strong>Auto-render on last frame</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Automatically displays this tactile social card in the outro of Remotion & studio renders.
              </div>
            </label>
          </div>

          {/* Save Button */}
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', marginTop: '4px' }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save & Set as Active Social CTA'}</span>
          </button>
        </div>

        {/* Right Column: Live On-Screen Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-dim)' }}>
            <Eye size={15} />
            <span>Live On-Screen Render Preview</span>
          </div>

          {/* Preview Container (Simulating 9:16 Video Frame) */}
          <div style={{
            background: 'radial-gradient(circle at 50% 30%, #1e293b 0%, #090d16 100%)',
            border: '2px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '24px 16px',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            {/* Background Paper Mockup */}
            <div style={{ position: 'absolute', top: 12, left: 16, right: 16, opacity: 0.15 }}>
              <div style={{ height: '6px', background: '#94a3b8', borderRadius: '4px', width: '40%', marginBottom: '6px' }} />
              <div style={{ height: '14px', background: '#e2e8f0', borderRadius: '4px', width: '75%' }} />
            </div>

            {/* The Tactile Vox Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              padding: '16px 20px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
              border: '2.5px solid #0F172A',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transform: 'rotate(0.5deg)'
            }}>
              {/* Washi tape accents */}
              <div style={{
                position: 'absolute',
                top: -8,
                left: 18,
                width: '60px',
                height: '14px',
                backgroundColor: 'rgba(235, 230, 218, 0.85)',
                transform: 'rotate(-4deg)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
              }} />
              <div style={{
                position: 'absolute',
                top: -8,
                right: 22,
                width: '65px',
                height: '14px',
                backgroundColor: 'rgba(235, 230, 218, 0.85)',
                transform: 'rotate(3deg)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
              }} />

              {/* Left Side: Logo & Text */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Platform Badge */}
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: currentPlatform.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '20px',
                  boxShadow: `0 4px 12px ${currentPlatform.color}66`,
                  flexShrink: 0
                }}>
                  {activePlatformId === 'facebook' && 'f'}
                  {activePlatformId === 'twitter' && '𝕏'}
                  {activePlatformId === 'instagram' && '📸'}
                  {activePlatformId === 'youtube' && '▶'}
                  {activePlatformId === 'reddit' && 'r/'}
                  {activePlatformId === 'tiktok' && '♪'}
                  {activePlatformId === 'linkedin' && 'in'}
                </div>

                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 900,
                    color: '#E11D48',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>{ctaText || 'FOLLOW AND LIKE FOR MORE'}</span>
                    <span style={{ fontSize: '11px' }}>👍</span>
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '16px',
                    fontWeight: 900,
                    color: '#0F172A',
                    marginTop: '2px'
                  }}>
                    {currentPlatform.prefix}
                    <span style={{
                      color: currentPlatform.color,
                      backgroundColor: currentPlatform.accent_bg || 'rgba(0,0,0,0.05)',
                      padding: '1px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${currentPlatform.color}44`
                    }}>
                      {handle || 'Shelf Wisdom'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Follow Button */}
              <div style={{
                backgroundColor: currentPlatform.color,
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 900,
                letterSpacing: '1px',
                padding: '8px 14px',
                borderRadius: '20px',
                textTransform: 'uppercase',
                boxShadow: `0 4px 10px ${currentPlatform.color}44`
              }}>
                + Follow
              </div>
            </div>

            {/* Simulated Safe Zone Bottom Bar */}
            <div style={{
              marginTop: '16px',
              padding: '8px 12px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: '11px',
              color: '#94a3b8',
              letterSpacing: '1px'
            }}>
              SAFE ZONE (CAPTIONS / PLAYER UI MARGIN: 250PX)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
