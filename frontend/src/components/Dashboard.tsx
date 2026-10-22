import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Film, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  Video, 
  TrendingUp, 
  ShieldCheck, 
  Flame, 
  ArrowRight,
  DollarSign,
  Download,
  FolderOpen,
  FileText
} from 'lucide-react';
import { Project, api, TrendingTopic } from '../services/api';

interface DashboardProps {
  projects: Project[];
  rendersCount?: number;
  onSelectProject: (p: Project) => void;
  onOpenCreate: (initialMode?: 'trends' | 'idea' | 'script' | 'vox') => void;
  onQuickStart: (topic: string) => void;
  onTrendStart: (trend: TrendingTopic, category: string) => void;
  onNavigateToRenders?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  rendersCount,
  onSelectProject,
  onOpenCreate,
  onQuickStart,
  onTrendStart,
  onNavigateToRenders
}) => {
  const [activeDomain, setActiveDomain] = useState<string>('ai');
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  const [loadingTrends, setLoadingTrends] = useState<boolean>(false);

  useEffect(() => {
    async function fetchDomainTrends() {
      setLoadingTrends(true);
      try {
        const res = await api.discoverTrends(activeDomain);
        setTrends(res.topics || []);
      } catch (e) {
        console.error('Failed to load dashboard trends', e);
      } finally {
        setLoadingTrends(false);
      }
    }
    fetchDomainTrends();
  }, [activeDomain]);

  return (
    <div>
      {/* Hero / Header */}
      <div className="dashboard-header">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '20px', color: 'var(--primary-light)', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
            <Flame size={14} color="#f43f5e" />
            <span>Autonomous AI Video Automation Studio</span>
          </div>
          <h1 className="page-title">CreatorFlow AI Studio</h1>
          <p className="page-subtitle">Real-world trending intelligence to vertical Shorts & Reels in minutes</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => onOpenCreate('script')}
            style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
          >
            <FileText size={16} color="#10b981" />
            <span>Provide Script</span>
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => onOpenCreate('idea')}
          >
            <Sparkles size={16} color="#6366f1" />
            <span>Provide Idea</span>
          </button>
          <button className="btn btn-primary" onClick={() => onOpenCreate('trends')}>
            <PlusCircle size={16} />
            <span>New Video</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div 
          className="glass-panel glass-panel-hover" 
          style={{ padding: '20px', cursor: onNavigateToRenders ? 'pointer' : 'default', border: onNavigateToRenders ? '1px solid rgba(16, 185, 129, 0.4)' : undefined }}
          onClick={onNavigateToRenders}
          title={onNavigateToRenders ? "Click to open Successful Renders Library" : undefined}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'var(--text-dim)', fontSize: '13px', fontWeight: 600 }}>SUCCESSFUL RENDERS</div>
            {onNavigateToRenders && (
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span>Vault</span>
                <ArrowRight size={12} />
              </span>
            )}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-heading)', marginTop: '4px', color: '#10b981' }}>
            {rendersCount !== undefined ? rendersCount : projects.length}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '13px', fontWeight: 600 }}>PLATFORMS SUPPORTED</div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-heading)', marginTop: '4px', color: 'var(--primary-light)' }}>
            9:16 & 16:9
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '13px', fontWeight: 600 }}>TTS VOICES (EN & HI)</div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-heading)', marginTop: '4px', color: 'var(--accent-cyan)' }}>
            Neural 30fps
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '13px', fontWeight: 600 }}>QA PASS RATE</div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-heading)', marginTop: '4px', color: 'var(--accent-emerald)' }}>
            100%
          </div>
        </div>
      </div>

      {/* Trending Radar Section */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '36px', background: 'rgba(12, 16, 26, 0.75)', border: '1px solid var(--border-glow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={20} color="#f43f5e" />
              <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                Trending Topic Radar (Last 30 Days)
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
              Ranked strictly by verified real-world engagement (Reddit, Hacker News, YouTube, Polymarket). Select a topic to create an AI Short instantly.
            </p>
          </div>

          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => onOpenCreate('trends')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Open Topic Discovery Studio</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Category Pills Selector */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '20px' }}>
          {[
            { id: 'all', label: '🔥 All Domains' },
            { id: 'ai', label: '🤖 AI' },
            { id: 'sports', label: '⚽ Sports' },
            { id: 'literature', label: '📜 Literature' },
            { id: 'politics', label: '🏛️ Politics' },
            { id: 'war', label: '⚔️ War' },
            { id: 'new_technology', label: '🚀 New Tech' },
            { id: 'finance', label: '📈 Finance' },
            { id: 'crypto', label: '🪙 Crypto' },
            { id: 'books', label: '📚 Books' },
            { id: 'science', label: '🔬 Science' }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setActiveDomain(c.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: activeDomain === c.id ? '1px solid var(--primary-light)' : '1px solid var(--border-color)',
                background: activeDomain === c.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                color: activeDomain === c.id ? '#fff' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Top 5-6 Cards */}
        {loadingTrends ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '14px' }}>
            Scanning real-time engagement data...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {trends.map((t, idx) => {
              const momentumColor = 
                t.momentum === 'Rising' ? '#10b981' : 
                t.momentum === 'Peaking' ? '#f43f5e' : '#818cf8';

              return (
                <div 
                  key={t.id}
                  className="glass-panel glass-panel-hover"
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: 'var(--bg-card)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px' }}>
                        #{idx + 1}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: momentumColor }}>
                        ● {t.momentum}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px', lineHeight: '1.3' }}>
                      {t.title}
                    </h4>

                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.summary}
                    </p>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '8px', padding: '4px 6px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '4px' }}>
                      📊 {t.key_metrics}
                    </div>

                    {t.polymarket_odds && t.polymarket_odds !== 'N/A' && (
                      <div style={{ fontSize: '10px', color: '#34d399', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <DollarSign size={10} />
                        <span>{t.polymarket_odds}</span>
                      </div>
                    )}

                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={() => onTrendStart(t, activeDomain)}
                      style={{ width: '100%', padding: '6px 12px', fontSize: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
                    >
                      <Sparkles size={13} />
                      <span>Create Short</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Projects */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Recent Projects</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{projects.length} saved productions</span>
        </div>

        {projects.length === 0 ? (
          <div className="glass-panel" style={{ padding: '48px 32px', textAlign: 'center' }}>
            <Film size={48} color="#6366f1" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>No video productions yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '440px', margin: '8px auto 24px' }}>
              Select a trending topic above or create your own custom video to generate scripts, fetch B-roll, and render vertical Shorts.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => onQuickStart("3 Psychological Secrets Advertisers Use")}>
                <Sparkles size={14} />
                <span>3 Psychological Secrets</span>
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => onQuickStart("How Compounding Interest Creates Wealth")}>
                <Sparkles size={14} />
                <span>Compounding Wealth Secret</span>
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => onQuickStart("Why Quantum Computers Will Change Everything")}>
                <Sparkles size={14} />
                <span>Quantum Computing Explained</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((proj) => (
              <div 
                key={proj.id} 
                className="glass-panel glass-panel-hover project-card"
                onClick={() => onSelectProject(proj)}
              >
                <div>
                  <div className="project-card-header">
                    <span className={`status-pill status-${proj.status.toLowerCase()}`}>
                      {proj.status.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      {proj.aspect_ratio}
                    </span>
                  </div>

                  <h3 className="project-card-title">{proj.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {proj.topic || 'Custom video brief'}
                  </p>
                </div>

                <div className="project-meta">
                  <span>⏱ ~{proj.target_duration}s</span>
                  <span>🎬 {proj.scenes_count || 5} scenes</span>
                  <span>🌐 {proj.language.toUpperCase()}</span>
                </div>

                {/* Quick Output Folder Actions */}
                <div 
                  style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginTop: '12px', 
                    borderTop: '1px solid var(--border-color)', 
                    paddingTop: '10px' 
                  }} 
                  onClick={(e) => e.stopPropagation()}
                >
                  <a 
                    href={`/api/projects/${proj.id}/download/video`}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, padding: '5px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                    title="Direct Download Final MP4"
                  >
                    <Download size={13} color="#6366f1" />
                    <span>Download MP4</span>
                  </a>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '5px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await api.openProjectFolder(proj.id);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    title="Open Dedicated Output Folder in Windows Explorer"
                  >
                    <FolderOpen size={13} color="#10b981" />
                    <span>Folder</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
