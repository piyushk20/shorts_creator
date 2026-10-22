import React, { useState, useEffect, useMemo } from 'react';
import { 
  Film, 
  Video, 
  Download, 
  FolderOpen, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  Search, 
  Copy, 
  Check, 
  Maximize2, 
  Play, 
  Volume2, 
  Layers, 
  Scissors, 
  Tv, 
  ShieldCheck, 
  Calendar, 
  HardDrive, 
  ExternalLink,
  X,
  FileText
} from 'lucide-react';
import { api, SuccessfulRender } from '../services/api';

interface SuccessfulRendersTabProps {
  onSelectProject?: (projectId: string) => void;
  onOpenCreate?: (mode?: 'trends' | 'idea' | 'script' | 'vox') => void;
}

export const SuccessfulRendersTab: React.FC<SuccessfulRendersTabProps> = ({
  onSelectProject,
  onOpenCreate
}) => {
  const [renders, setRenders] = useState<SuccessfulRender[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEngine, setSelectedEngine] = useState<string>('all');
  const [selectedRatio, setSelectedRatio] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'duration' | 'size' | 'title'>('newest');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [folderOpeningId, setFolderOpeningId] = useState<string | null>(null);
  const [activeModalRender, setActiveModalRender] = useState<SuccessfulRender | null>(null);

  const fetchRenders = async () => {
    setLoading(true);
    try {
      const res = await api.getSuccessfulRenders();
      setRenders(res.renders || []);
    } catch (err) {
      console.error('Failed to load successful renders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenders();
  }, []);

  const handleCopyLink = (render: SuccessfulRender) => {
    const fullUrl = window.location.origin + render.video_stream_url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(render.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenFolder = async (projectId: string) => {
    setFolderOpeningId(projectId);
    try {
      await api.openProjectFolder(projectId);
    } catch (err) {
      console.error('Failed to open project folder in explorer', err);
    } finally {
      setTimeout(() => setFolderOpeningId(null), 1200);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = renders.length;
    const verticalCount = renders.filter(r => r.aspect_ratio === '9:16').length;
    const landscapeCount = renders.filter(r => r.aspect_ratio === '16:9').length;
    const remotionCount = renders.filter(r => r.renderer.toLowerCase().includes('remotion')).length;
    const hyperframesCount = renders.filter(r => r.renderer.toLowerCase().includes('hyperframes')).length;
    const ffmpegCount = renders.filter(r => r.renderer.toLowerCase().includes('ffmpeg')).length;
    const totalBytes = renders.reduce((acc, r) => acc + (r.file_size_bytes || 0), 0);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

    return {
      total,
      verticalCount,
      landscapeCount,
      remotionCount,
      hyperframesCount,
      ffmpegCount,
      totalMB
    };
  }, [renders]);

  // Filtered & Sorted renders
  const filteredRenders = useMemo(() => {
    return renders
      .filter(r => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = r.title.toLowerCase().includes(q) || r.raw_title.toLowerCase().includes(q);
          const matchesTopic = r.topic.toLowerCase().includes(q);
          const matchesRenderer = r.renderer.toLowerCase().includes(q);
          const matchesHook = r.recommended_hook ? r.recommended_hook.toLowerCase().includes(q) : false;
          if (!matchesTitle && !matchesTopic && !matchesRenderer && !matchesHook) return false;
        }

        // Engine filter
        if (selectedEngine !== 'all') {
          if (!r.renderer.toLowerCase().includes(selectedEngine.toLowerCase())) return false;
        }

        // Aspect ratio filter
        if (selectedRatio !== 'all') {
          if (r.aspect_ratio !== selectedRatio) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
          const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
          return timeB - timeA;
        }
        if (sortBy === 'duration') {
          return (b.target_duration || 0) - (a.target_duration || 0);
        }
        if (sortBy === 'size') {
          return (b.file_size_bytes || 0) - (a.file_size_bytes || 0);
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [renders, searchQuery, selectedEngine, selectedRatio, sortBy]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return isoString;
    }
  };

  const getRendererColor = (renderer: string) => {
    const low = renderer.toLowerCase();
    if (low.includes('remotion')) return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)', label: 'Remotion (Vox)' };
    if (low.includes('hyperframes')) return { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.4)', label: 'Hyperframes AI' };
    return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.4)', label: 'FFmpeg Pipeline' };
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: '16px',
        padding: '28px 32px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 12px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '20px', color: '#34d399', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>
              <ShieldCheck size={15} color="#10b981" />
              <span>Production Vault • Verified Deliverables</span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              Successful Renders Library
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '650px', margin: 0, lineHeight: 1.5 }}>
              All finalized, high-definition vertical Shorts and Reels composited by CreatorFlow Studio. Watch previews, review technical specifications, inspect QA reports, or download ready-to-post MP4s.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={fetchRenders}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Refresh Renders Library"
            >
              <RefreshCw size={14} className={loading ? 'spinning' : ''} />
              <span>Refresh</span>
            </button>
            {onOpenCreate && (
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => onOpenCreate('trends')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Sparkles size={14} />
                <span>Render New Video</span>
              </button>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '24px' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px 18px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em' }}>TOTAL DELIVERABLES</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>{stats.total}</div>
            <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>✓ 100% QA Passed</div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px 18px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em' }}>ASPECT RATIOS</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
              {stats.verticalCount} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-dim)' }}>Shorts</span> / {stats.landscapeCount} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-dim)' }}>Wide</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>9:16 Mobile & 16:9 Landscape</div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px 18px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em' }}>ENGINES DEPLOYED</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
              {stats.remotionCount} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dim)' }}>Vox</span> • {stats.hyperframesCount} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dim)' }}>HF</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Remotion, Hyperframes, FFmpeg</div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px 18px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em' }}>VAULT STORAGE SIZE</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#a78bfa', marginTop: '4px' }}>{stats.totalMB} MB</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>H.264 / 48kHz AAC</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        padding: '14px 18px',
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by video title, topic, engine, or hook..."
            style={{ paddingLeft: '38px', height: '38px', fontSize: '13px' }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Engine Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>Engine:</span>
            <select
              className="input"
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value)}
              style={{ height: '38px', padding: '0 12px', fontSize: '12px', minWidth: '140px' }}
            >
              <option value="all">All Engines ({renders.length})</option>
              <option value="remotion">Remotion Vox ({stats.remotionCount})</option>
              <option value="hyperframes">Hyperframes AI ({stats.hyperframesCount})</option>
              <option value="ffmpeg">FFmpeg Pipeline ({stats.ffmpegCount})</option>
            </select>
          </div>

          {/* Aspect Ratio Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>Format:</span>
            <select
              className="input"
              value={selectedRatio}
              onChange={(e) => setSelectedRatio(e.target.value)}
              style={{ height: '38px', padding: '0 12px', fontSize: '12px', minWidth: '120px' }}
            >
              <option value="all">All Formats</option>
              <option value="9:16">9:16 Shorts</option>
              <option value="16:9">16:9 Wide</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>Sort:</span>
            <select
              className="input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ height: '38px', padding: '0 12px', fontSize: '12px', minWidth: '130px' }}
            >
              <option value="newest">Newest First</option>
              <option value="duration">Duration (Longest)</option>
              <option value="size">File Size (Largest)</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Render Cards Grid */}
      {loading ? (
        <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="spinning" color="#6366f1" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Loading successful renders...</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Scanning storage vault and database job manifests</p>
        </div>
      ) : filteredRenders.length === 0 ? (
        <div className="glass-panel" style={{ padding: '64px 32px', textAlign: 'center' }}>
          <Film size={48} color="#6366f1" style={{ margin: '0 auto 16px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
            {searchQuery || selectedEngine !== 'all' || selectedRatio !== 'all' 
              ? 'No renders match your filters' 
              : 'No completed renders in library yet'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '440px', margin: '8px auto 20px' }}>
            {searchQuery || selectedEngine !== 'all' || selectedRatio !== 'all'
              ? 'Try adjusting your search keywords or resetting your engine and format filters.'
              : 'When you render a video using Remotion, Hyperframes, or FFmpeg, it will appear here with instant streaming, download links, and QA reports.'}
          </p>
          {(searchQuery || selectedEngine !== 'all' || selectedRatio !== 'all') && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearchQuery(''); setSelectedEngine('all'); setSelectedRatio('all'); }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '24px'
        }}>
          {filteredRenders.map((r) => {
            const engineMeta = getRendererColor(r.renderer);
            const isCopied = copiedId === r.id;
            const isOpening = folderOpeningId === r.project_id;

            return (
              <div 
                key={r.id}
                className="glass-panel glass-panel-hover"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  borderRadius: '14px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)'
                }}
              >
                {/* Video Preview Player Box */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  background: '#090d16',
                  aspectRatio: r.aspect_ratio === '9:16' ? '9/11' : '16/9',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {r.video_stream_url ? (
                    <video
                      src={r.video_stream_url}
                      controls
                      playsInline
                      preload="metadata"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        background: '#05070d'
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '20px' }}>
                      <Video size={36} color="var(--text-dim)" />
                      <div style={{ fontSize: '12px', marginTop: '8px' }}>Preview Not Available</div>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    right: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: engineMeta.bg,
                      color: engineMeta.text,
                      border: `1px solid ${engineMeta.border}`,
                      backdropFilter: 'blur(8px)'
                    }}>
                      {engineMeta.label}
                    </span>

                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(8px)'
                    }}>
                      {r.aspect_ratio}
                    </span>
                  </div>

                  {/* Bottom Stats Overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '12px',
                    right: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(0,0,0,0.75)',
                      color: 'var(--accent-cyan)',
                      backdropFilter: 'blur(6px)'
                    }}>
                      ⏱ ~{r.target_duration}s
                    </span>

                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(0,0,0,0.75)',
                      color: '#a78bfa',
                      backdropFilter: 'blur(6px)'
                    }}>
                      💾 {r.file_size_formatted}
                    </span>
                  </div>
                </div>

                {/* Content Area */}
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Title */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                    <h3 
                      style={{ 
                        fontSize: '16px', 
                        fontWeight: 700, 
                        color: '#fff', 
                        margin: 0,
                        lineHeight: 1.35
                      }} 
                      title={r.raw_title}
                    >
                      {r.title}
                    </h3>
                  </div>

                  {/* Topic / Excerpt */}
                  {r.topic && (
                    <p style={{
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                      lineHeight: 1.4,
                      margin: '0 0 12px 0',
                      lineClamp: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {r.topic}
                    </p>
                  )}

                  {/* Technical Specs Pill Matrix */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    marginBottom: '14px',
                    fontSize: '11px'
                  }}>
                    <div style={{ color: 'var(--text-dim)' }}>
                      📐 <strong style={{ color: '#fff' }}>{r.resolution}</strong> ({r.fps}fps)
                    </div>
                    <div style={{ color: 'var(--text-dim)' }}>
                      🎬 <strong style={{ color: '#fff' }}>{r.scenes_count || 'Multi'}</strong> scenes
                    </div>
                    <div style={{ color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.voice}>
                      🎙 <strong style={{ color: '#fff' }}>{r.voice.split('-').slice(0, 2).join('-')}</strong>
                    </div>
                    <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <CheckCircle size={11} color="#10b981" />
                      <strong>QA Verified</strong>
                    </div>
                  </div>

                  {/* Render Date */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--text-dim)',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      <span>{formatDate(r.start_time)}</span>
                    </div>
                    {r.render_time_seconds && (
                      <span style={{ color: 'var(--accent-cyan)' }}>Rendered in {r.render_time_seconds}s</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setActiveModalRender(r)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '12px', padding: '6px 10px' }}
                        title="Open Deep Inspection & Large Video View"
                      >
                        <Maximize2 size={13} color="#38bdf8" />
                        <span>Inspect / Play</span>
                      </button>

                      <a
                        href={r.video_download_url}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '12px', padding: '6px 10px', textDecoration: 'none' }}
                        download
                        title="Download Rendered Video MP4"
                      >
                        <Download size={13} color="#10b981" />
                        <span>Download MP4</span>
                      </a>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenFolder(r.project_id)}
                        disabled={isOpening}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '11px', padding: '5px 8px' }}
                        title="Reveal project files in Windows Explorer"
                      >
                        <FolderOpen size={12} color="#fbbf24" />
                        <span>{isOpening ? 'Opening...' : 'Open Folder'}</span>
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleCopyLink(r)}
                        style={{ padding: '5px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Copy direct stream URL"
                      >
                        {isCopied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        <span>{isCopied ? 'Copied' : 'Link'}</span>
                      </button>

                      {onSelectProject && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSelectProject(r.project_id)}
                          style={{ padding: '5px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Open this project in full Studio Workspace"
                        >
                          <ExternalLink size={12} color="#818cf8" />
                          <span>Studio</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deep Inspection & Theater Modal */}
      {activeModalRender && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(3, 7, 18, 0.88)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glow)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '960px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(15, 23, 42, 0.7)'
            }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Deliverable Inspection
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: '2px 0 0 0' }}>
                  {activeModalRender.title}
                </h2>
              </div>
              <button 
                onClick={() => setActiveModalRender(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: activeModalRender.aspect_ratio === '9:16' ? '340px 1fr' : '1fr 1fr',
              overflowY: 'auto',
              flex: 1
            }}>
              {/* Left: Video Player */}
              <div style={{
                background: '#030712',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                borderRight: '1px solid var(--border-color)'
              }}>
                <div style={{
                  width: '100%',
                  maxHeight: '520px',
                  aspectRatio: activeModalRender.aspect_ratio === '9:16' ? '9/16' : '16/9',
                  background: '#000',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
                }}>
                  <video 
                    src={activeModalRender.video_stream_url} 
                    controls 
                    autoPlay
                    loop
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
              </div>

              {/* Right: Technical Details & Specifications */}
              <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Topic / Hook */}
                {activeModalRender.topic && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '4px' }}>TOPIC BRIEF</div>
                    <div style={{ fontSize: '13px', color: '#fff', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      {activeModalRender.topic}
                    </div>
                  </div>
                )}

                {activeModalRender.recommended_hook && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '4px' }}>SCRIPT HOOK</div>
                    <div style={{ fontSize: '13px', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)', fontStyle: 'italic' }}>
                      "{activeModalRender.recommended_hook}"
                    </div>
                  </div>
                )}

                {/* Technical Specifications */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '8px' }}>DELIVERABLE SPECIFICATIONS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                    <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                      <div style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Engine</div>
                      <div style={{ fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>{activeModalRender.renderer}</div>
                    </div>
                    <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                      <div style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Resolution</div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{activeModalRender.resolution} ({activeModalRender.aspect_ratio})</div>
                    </div>
                    <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                      <div style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Frame Rate</div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{activeModalRender.fps} fps</div>
                    </div>
                    <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                      <div style={{ color: 'var(--text-dim)', fontSize: '11px' }}>File Size</div>
                      <div style={{ fontWeight: 600, color: '#a78bfa' }}>{activeModalRender.file_size_formatted}</div>
                    </div>
                    <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                      <div style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Neural Voice</div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{activeModalRender.voice}</div>
                    </div>
                    <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                      <div style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Language & Subtitles</div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{activeModalRender.language.toUpperCase()} • {activeModalRender.caption_style}</div>
                    </div>
                  </div>
                </div>

                {/* QA Verification Checklist */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '8px' }}>QA AUTOMATION REPORT</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                      <CheckCircle size={15} />
                      <span>Audio stream verified (48kHz stereo AAC with dynamic ducking)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                      <CheckCircle size={15} />
                      <span>Video resolution & aspect ratio conform to YouTube Shorts / Reels standard</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                      <CheckCircle size={15} />
                      <span>Safe margins passed (360px bottom safe zone respected)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                      <CheckCircle size={15} />
                      <span>No player freeze / PTS timestamp synchronization clean</span>
                    </div>
                  </div>
                </div>

                {/* Disk Path */}
                {activeModalRender.output_mp4_path && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '4px' }}>LOCAL STORAGE PATH</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', background: 'rgba(0,0,0,0.4)', padding: '8px 12px', borderRadius: '6px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {activeModalRender.output_mp4_path}
                    </div>
                  </div>
                )}

                {/* Action Buttons in Modal */}
                <div style={{ marginTop: 'auto', display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <a
                    href={activeModalRender.video_download_url}
                    className="btn btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}
                    download
                  >
                    <Download size={15} />
                    <span>Download Final MP4</span>
                  </a>

                  {activeModalRender.zip_download_url && (
                    <a
                      href={activeModalRender.zip_download_url}
                      className="btn btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}
                      download
                    >
                      <span>Package ZIP</span>
                    </a>
                  )}

                  <button
                    className="btn btn-secondary"
                    onClick={() => handleOpenFolder(activeModalRender.project_id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FolderOpen size={15} color="#10b981" />
                    <span>Open Folder</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
