import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Scissors, 
  Film, 
  Video, 
  Download, 
  FolderOpen, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  Search, 
  Copy, 
  Check, 
  Maximize2, 
  Play, 
  Pause,
  Volume2, 
  VolumeX,
  Layers, 
  Tv, 
  Calendar, 
  HardDrive, 
  ExternalLink,
  X,
  FileText,
  Filter,
  Grid,
  List as ListIcon,
  Tag,
  ArrowRight,
  Info,
  ChevronDown,
  Gauge
} from 'lucide-react';
import { api, ShortsClip, ShortsClipsStats, Project } from '../services/api';

interface ShortsClipsTabProps {
  onSelectProject?: (projectId: string) => void;
  onOpenCreate?: (mode?: 'trends' | 'idea' | 'script' | 'vox') => void;
}

export const ShortsClipsTab: React.FC<ShortsClipsTabProps> = ({
  onSelectProject,
  onOpenCreate
}) => {
  const [clips, setClips] = useState<ShortsClip[]>([]);
  const [stats, setStats] = useState<ShortsClipsStats | null>(null);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRatio, setSelectedRatio] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // UI Interaction States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [folderOpening, setFolderOpening] = useState<boolean>(false);
  const [activeModalClip, setActiveModalClip] = useState<ShortsClip | null>(null);
  const [modalPlaying, setModalPlaying] = useState<boolean>(true);
  const [modalSpeed, setModalSpeed] = useState<number>(1.0);
  const [modalMuted, setModalMuted] = useState<boolean>(false);
  const [modalLoop, setModalLoop] = useState<boolean>(true);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  const fetchClips = async () => {
    setLoading(true);
    try {
      const res = await api.getShortsClips({
        clip_type: selectedType,
        project_id: selectedProject !== 'all' ? selectedProject : undefined,
        aspect_ratio: selectedRatio !== 'all' ? selectedRatio : undefined,
        search: searchQuery,
        sort_by: sortBy
      });
      setClips(res.clips || []);
      setStats(res.stats || null);
    } catch (err) {
      console.error('Failed to load shorts clips', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClips();
  }, [selectedType, selectedRatio, selectedProject, sortBy]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchClips();
    }, 280);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load projects list for dropdown filter
  useEffect(() => {
    api.getProjects()
      .then(projs => setProjectsList(projs || []))
      .catch(err => console.error('Failed to fetch projects list', err));
  }, []);

  const handleCopyLink = (clip: ShortsClip) => {
    const fullUrl = window.location.origin + clip.stream_url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(clip.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenStorageFolder = async (relPath?: string) => {
    setFolderOpening(true);
    try {
      await api.openClipsFolder(relPath);
    } catch (err) {
      console.error('Failed to open clips folder in explorer', err);
    } finally {
      setTimeout(() => setFolderOpening(false), 1200);
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch ((role || '').toLowerCase()) {
      case 'hook':
        return { bg: 'rgba(236, 72, 153, 0.18)', border: 'rgba(236, 72, 153, 0.45)', text: '#f472b6' };
      case 'setup':
        return { bg: 'rgba(99, 102, 241, 0.18)', border: 'rgba(99, 102, 241, 0.45)', text: '#a5b4fc' };
      case 'main':
        return { bg: 'rgba(14, 165, 233, 0.18)', border: 'rgba(14, 165, 233, 0.45)', text: '#38bdf8' };
      case 'climax':
        return { bg: 'rgba(245, 158, 11, 0.18)', border: 'rgba(245, 158, 11, 0.45)', text: '#fbbf24' };
      case 'payoff':
        return { bg: 'rgba(16, 185, 129, 0.18)', border: 'rgba(16, 185, 129, 0.45)', text: '#34d399' };
      case 'outro':
        return { bg: 'rgba(168, 85, 247, 0.18)', border: 'rgba(168, 85, 247, 0.45)', text: '#c084fc' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.08)', border: 'rgba(255, 255, 255, 0.2)', text: '#e2e8f0' };
    }
  };

  const getTypeBadge = (clipType: string) => {
    switch (clipType) {
      case 'scene_segment':
        return { label: 'Scene Cut', color: '#818cf8', bg: 'rgba(99, 102, 241, 0.16)' };
      case 'final_short':
        return { label: 'Rendered Short', color: '#34d399', bg: 'rgba(16, 185, 129, 0.16)' };
      case 'stock_broll':
        return { label: 'B-Roll Asset', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.16)' };
      case 'video_bed':
        return { label: 'Video Track', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.16)' };
      default:
        return { label: 'Clip', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.16)' };
    }
  };

  return (
    <div className="shorts-clips-page" style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Top Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '28px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(236, 72, 153, 0.35)'
            }}>
              <Scissors size={22} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                AI Shorts Clips Gallery
              </h1>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-dim)', marginTop: '2px' }}>
                Explore, preview, and download individual scene cuts, full AI shorts, and visual B-roll assets generated by CreatorFlow.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fetchClips()}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
          >
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleOpenStorageFolder()}
            disabled={folderOpening}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
          >
            <FolderOpen size={15} color="#38bdf8" />
            <span>{folderOpening ? 'Opening Explorer...' : 'Open Storage Folder'}</span>
          </button>

          {onOpenCreate && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onOpenCreate('trends')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                border: 'none',
                boxShadow: '0 4px 16px rgba(236, 72, 153, 0.35)'
              }}
            >
              <Sparkles size={16} />
              <span>Create AI Short</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Highlights */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginBottom: '26px'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '16px 20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: '6px' }}>
              Total Clips Indexed
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc' }}>{stats.total_clips}</span>
              <span style={{ fontSize: '12px', color: '#ec4899', fontWeight: 600 }}>across studio</span>
            </div>
            <div style={{ position: 'absolute', right: '16px', bottom: '16px', opacity: 0.15 }}>
              <Film size={44} color="#ec4899" />
            </div>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '14px',
            padding: '16px 20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#818cf8', marginBottom: '6px' }}>
              Scene Segment Cuts
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#818cf8' }}>{stats.scene_segments_count}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>timed scene cuts</span>
            </div>
            <div style={{ position: 'absolute', right: '16px', bottom: '16px', opacity: 0.15 }}>
              <Scissors size={44} color="#818cf8" />
            </div>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '14px',
            padding: '16px 20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#34d399', marginBottom: '6px' }}>
              Rendered AI Shorts
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#34d399' }}>{stats.final_shorts_count}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>completed videos</span>
            </div>
            <div style={{ position: 'absolute', right: '16px', bottom: '16px', opacity: 0.15 }}>
              <Video size={44} color="#10b981" />
            </div>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '14px',
            padding: '16px 20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#38bdf8', marginBottom: '6px' }}>
              Stock & B-Roll Assets
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8' }}>{stats.stock_broll_count}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>cached 9:16 loops</span>
            </div>
            <div style={{ position: 'absolute', right: '16px', bottom: '16px', opacity: 0.15 }}>
              <Layers size={44} color="#38bdf8" />
            </div>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '16px 20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: '6px' }}>
              Disk Footprint
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc' }}>{stats.total_storage_formatted}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{stats.projects_count} projects</span>
            </div>
            <div style={{ position: 'absolute', right: '16px', bottom: '16px', opacity: 0.15 }}>
              <HardDrive size={44} color="#94a3b8" />
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Controls Toolbar */}
      <div style={{
        background: 'rgba(23, 29, 44, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '18px 22px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Row 1: Search & Type Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1', minWidth: '280px', maxWidth: '480px' }}>
            <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by narration, scene hook, title, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 36px 9px 38px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <X
                size={14}
                color="var(--text-dim)"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
              />
            )}
          </div>

          {/* Clip Type Filter Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Clips', count: stats?.total_clips },
              { id: 'scene_segment', label: 'Scene Cuts', count: stats?.scene_segments_count, icon: Scissors },
              { id: 'final_short', label: 'Rendered Shorts', count: stats?.final_shorts_count, icon: Video },
              { id: 'stock_broll', label: 'Stock B-Roll', count: stats?.stock_broll_count, icon: Layers }
            ].map(tab => {
              const isActive = selectedType === tab.id;
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedType(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(236, 72, 153, 0.25) 100%)' : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? '#f8fafc' : 'var(--text-dim)',
                    border: isActive ? '1px solid rgba(236, 72, 153, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {IconComp && <IconComp size={13} color={isActive ? '#ec4899' : 'currentColor'} />}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span style={{
                      background: isActive ? '#ec4899' : 'rgba(255, 255, 255, 0.1)',
                      color: isActive ? '#ffffff' : 'var(--text-dim)',
                      fontSize: '11px',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      marginLeft: '2px'
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Secondary Filters (Ratio, Project, Sort, View mode) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Aspect Ratio Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>Aspect:</span>
              <select
                value={selectedRatio}
                onChange={(e) => setSelectedRatio(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  padding: '5px 10px',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Ratios</option>
                <option value="9:16">9:16 Vertical (Shorts/Reels)</option>
                <option value="16:9">16:9 Landscape</option>
                <option value="1:1">1:1 Square</option>
              </select>
            </div>

            {/* Project Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>Project:</span>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  padding: '5px 10px',
                  fontSize: '12px',
                  outline: 'none',
                  maxWidth: '240px',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Projects ({projectsList.length})</option>
                {projectsList.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title.length > 36 ? p.title.slice(0, 34) + '...' : p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  padding: '5px 10px',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="newest">Newest Added</option>
                <option value="scene_order">Scene Order (Hook → Outro)</option>
                <option value="duration_desc">Duration (Longest)</option>
                <option value="duration_asc">Duration (Shortest)</option>
                <option value="size_desc">File Size (Largest)</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                border: viewMode === 'grid' ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
                borderRadius: '6px',
                padding: '6px 10px',
                color: viewMode === 'grid' ? '#818cf8' : 'var(--text-dim)',
                cursor: 'pointer'
              }}
              title="Grid View"
            >
              <Grid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                border: viewMode === 'list' ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
                borderRadius: '6px',
                padding: '6px 10px',
                color: viewMode === 'list' ? '#818cf8' : 'var(--text-dim)',
                cursor: 'pointer'
              }}
              title="List View"
            >
              <ListIcon size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <RefreshCw size={36} className="spinning" color="#ec4899" style={{ margin: '0 auto 16px auto' }} />
          <p style={{ color: 'var(--text-dim)', fontSize: '15px', fontWeight: 600 }}>Scanning storage and indexing clips...</p>
        </div>
      ) : clips.length === 0 ? (
        /* Empty State */
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'rgba(23, 29, 44, 0.4)',
          borderRadius: '16px',
          border: '1px dashed rgba(255, 255, 255, 0.12)'
        }}>
          <Scissors size={48} color="var(--text-dim)" style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
          <h3 style={{ fontSize: '20px', color: '#f8fafc', fontWeight: 700, marginBottom: '8px' }}>
            No Clips Found Matching Filters
          </h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 24px auto' }}>
            Try resetting your search query or selecting "All Clips" and "All Ratios" to explore the full library.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setSelectedRatio('all');
                setSelectedProject('all');
              }}
            >
              Clear All Filters
            </button>
            {onOpenCreate && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onOpenCreate('trends')}
              >
                Generate New AI Short
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: '22px'
        }}>
          {clips.map(clip => {
            const roleBadge = getRoleBadgeColor(clip.scene_role);
            const typeBadge = getTypeBadge(clip.clip_type);
            const isVertical = clip.aspect_ratio === '9:16';

            return (
              <div
                key={clip.id}
                style={{
                  background: 'rgba(24, 30, 49, 0.75)',
                  backdropFilter: 'blur(14px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.22s ease',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
                }}
                className="clip-card"
              >
                {/* Video Media Container */}
                <div 
                  style={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: isVertical ? '140%' : '56.25%',
                    background: '#090d16',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setActiveModalClip(clip);
                    setModalPlaying(true);
                  }}
                >
                  <video
                    src={clip.stream_url}
                    preload="metadata"
                    muted
                    loop
                    playsInline
                    onMouseEnter={(e) => {
                      const v = e.currentTarget;
                      v.play().catch(() => {});
                    }}
                    onMouseLeave={(e) => {
                      const v = e.currentTarget;
                      v.pause();
                      v.currentTime = 0;
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />

                  {/* Play Overlay Icon on Hover */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    pointerEvents: 'none'
                  }}>
                    <Play size={22} color="#ffffff" style={{ marginLeft: '3px' }} />
                  </div>

                  {/* Top Floating Badges */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    right: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    gap: '6px'
                  }}>
                    <span style={{
                      background: typeBadge.bg,
                      color: typeBadge.color,
                      backdropFilter: 'blur(8px)',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${typeBadge.color}40`,
                      letterSpacing: '0.04em'
                    }}>
                      {typeBadge.label}
                    </span>

                    <span style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      color: '#f8fafc',
                      backdropFilter: 'blur(8px)',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}>
                      {clip.duration_formatted}
                    </span>
                  </div>

                  {/* Bottom Floating Resolution & Size Badge */}
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
                      background: 'rgba(0, 0, 0, 0.65)',
                      backdropFilter: 'blur(6px)',
                      color: '#cbd5e1',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '4px'
                    }}>
                      {clip.aspect_ratio} • {clip.resolution}
                    </span>

                    <span style={{
                      background: 'rgba(0, 0, 0, 0.65)',
                      backdropFilter: 'blur(6px)',
                      color: '#cbd5e1',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '4px'
                    }}>
                      {clip.file_size_formatted}
                    </span>
                  </div>
                </div>

                {/* Card Content & Metadata */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
                  {/* Scene Role & Order Header if present */}
                  {clip.scene_order && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: roleBadge.bg,
                        color: roleBadge.text,
                        border: `1px solid ${roleBadge.border}`,
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        Scene {clip.scene_order}: {clip.scene_role || 'Cut'}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <div 
                    style={{
                      fontSize: '14.5px',
                      fontWeight: 700,
                      color: '#f8fafc',
                      lineHeight: '1.35',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setActiveModalClip(clip);
                      setModalPlaying(true);
                    }}
                    title={clip.title}
                  >
                    {clip.title}
                  </div>

                  {/* Associated Project link */}
                  {clip.project_title && (
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: '#818cf8',
                        cursor: onSelectProject && clip.project_id ? 'pointer' : 'default'
                      }}
                      onClick={() => {
                        if (onSelectProject && clip.project_id) {
                          onSelectProject(clip.project_id);
                        }
                      }}
                    >
                      <Film size={12} color="#818cf8" />
                      <span style={{ textDecoration: onSelectProject && clip.project_id ? 'underline' : 'none' }}>
                        {clip.project_title}
                      </span>
                    </div>
                  )}

                  {/* Narration Quote Box for Scene Clips */}
                  {clip.narration && (
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderLeft: '3px solid #ec4899',
                      padding: '8px 10px',
                      borderRadius: '0 6px 6px 0',
                      fontSize: '12px',
                      color: '#cbd5e1',
                      lineHeight: '1.45',
                      fontStyle: 'italic'
                    }}>
                      "{clip.narration.length > 95 ? clip.narration.slice(0, 92) + '...' : clip.narration}"
                    </div>
                  )}

                  {/* Visual Prompt description if available */}
                  {clip.visual_description && !clip.narration && (
                    <div style={{
                      fontSize: '11.5px',
                      color: 'var(--text-dim)',
                      lineHeight: '1.4'
                    }}>
                      Visual: {clip.visual_description.length > 90 ? clip.visual_description.slice(0, 88) + '...' : clip.visual_description}
                    </div>
                  )}

                  {/* Card Actions Footer */}
                  <div style={{
                    marginTop: 'auto',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px'
                  }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setActiveModalClip(clip);
                        setModalPlaying(true);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', fontSize: '12px' }}
                    >
                      <Maximize2 size={13} />
                      <span>Preview</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleCopyLink(clip)}
                        title="Copy direct stream link"
                        style={{ padding: '5px 8px' }}
                      >
                        {copiedId === clip.id ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                      </button>

                      <a
                        href={clip.download_url}
                        download={clip.filename}
                        className="btn btn-secondary btn-sm"
                        title="Download MP4 clip"
                        style={{ padding: '5px 8px', display: 'flex', alignItems: 'center' }}
                      >
                        <Download size={14} color="#38bdf8" />
                      </a>

                      {clip.project_id && onSelectProject && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => onSelectProject(clip.project_id!)}
                          title="Open Project Workspace in Studio"
                          style={{
                            padding: '5px 10px',
                            fontSize: '11.5px',
                            background: 'rgba(99, 102, 241, 0.25)',
                            border: '1px solid rgba(99, 102, 241, 0.5)',
                            color: '#818cf8'
                          }}
                        >
                          Studio
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div style={{
          background: 'rgba(24, 30, 49, 0.75)',
          backdropFilter: 'blur(14px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '14px 18px', width: '80px' }}>Preview</th>
                <th style={{ padding: '14px 18px' }}>Clip Title & Script</th>
                <th style={{ padding: '14px 18px' }}>Category</th>
                <th style={{ padding: '14px 18px' }}>Project</th>
                <th style={{ padding: '14px 18px' }}>Aspect / Res</th>
                <th style={{ padding: '14px 18px' }}>Duration</th>
                <th style={{ padding: '14px 18px' }}>Size</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clips.map(clip => {
                const roleBadge = getRoleBadgeColor(clip.scene_role);
                const typeBadge = getTypeBadge(clip.clip_type);

                return (
                  <tr
                    key={clip.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 18px' }}>
                      <div
                        style={{
                          width: '54px',
                          height: '72px',
                          background: '#090d16',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          position: 'relative',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setActiveModalClip(clip);
                          setModalPlaying(true);
                        }}
                      >
                        <video
                          src={clip.stream_url}
                          muted
                          playsInline
                          preload="metadata"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: 'rgba(0,0,0,0.6)',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Play size={12} color="#ffffff" style={{ marginLeft: '1px' }} />
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {clip.scene_order && (
                          <span style={{
                            background: roleBadge.bg,
                            color: roleBadge.text,
                            border: `1px solid ${roleBadge.border}`,
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            Scene {clip.scene_order}: {clip.scene_role || 'Cut'}
                          </span>
                        )}
                        <span 
                          style={{ fontWeight: 700, color: '#f8fafc', cursor: 'pointer' }}
                          onClick={() => {
                            setActiveModalClip(clip);
                            setModalPlaying(true);
                          }}
                        >
                          {clip.title}
                        </span>
                      </div>
                      {clip.narration && (
                        <div style={{ color: 'var(--text-dim)', fontSize: '12px', fontStyle: 'italic', maxWidth: '420px' }}>
                          "{clip.narration.length > 80 ? clip.narration.slice(0, 78) + '...' : clip.narration}"
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px 18px' }}>
                      <span style={{
                        background: typeBadge.bg,
                        color: typeBadge.color,
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        {typeBadge.label}
                      </span>
                    </td>

                    <td style={{ padding: '12px 18px' }}>
                      {clip.project_title ? (
                        <span 
                          style={{
                            color: '#818cf8',
                            cursor: onSelectProject && clip.project_id ? 'pointer' : 'default',
                            fontSize: '12.5px'
                          }}
                          onClick={() => {
                            if (onSelectProject && clip.project_id) onSelectProject(clip.project_id);
                          }}
                        >
                          {clip.project_title.length > 28 ? clip.project_title.slice(0, 26) + '...' : clip.project_title}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>Standalone</span>
                      )}
                    </td>

                    <td style={{ padding: '12px 18px', color: '#cbd5e1', fontSize: '12px' }}>
                      {clip.aspect_ratio} ({clip.resolution})
                    </td>

                    <td style={{ padding: '12px 18px', fontWeight: 700, color: '#f8fafc' }}>
                      {clip.duration_formatted}
                    </td>

                    <td style={{ padding: '12px 18px', color: 'var(--text-dim)', fontSize: '12px' }}>
                      {clip.file_size_formatted}
                    </td>

                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setActiveModalClip(clip);
                            setModalPlaying(true);
                          }}
                          title="Preview Clip"
                        >
                          <Play size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleCopyLink(clip)}
                          title="Copy Link"
                        >
                          {copiedId === clip.id ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                        </button>
                        <a
                          href={clip.download_url}
                          download={clip.filename}
                          className="btn btn-secondary btn-sm"
                          title="Download"
                        >
                          <Download size={13} color="#38bdf8" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Fullscreen Video Preview Modal */}
      {activeModalClip && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 16, 0.88)',
          backdropFilter: 'blur(20px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            background: '#0d1322',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '1100px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(15, 23, 42, 0.6)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Scissors size={20} color="#ec4899" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#f8fafc' }}>
                    {activeModalClip.title}
                  </h3>
                  {activeModalClip.project_title && (
                    <span style={{ fontSize: '12px', color: '#818cf8' }}>
                      Project: {activeModalClip.project_title}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalClip(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#cbd5e1'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Two Column Video + Details */}
            <div style={{
              display: 'flex',
              flex: 1,
              overflow: 'hidden',
              flexDirection: 'row',
              minHeight: '440px'
            }}>
              {/* Left Column: Video Theater */}
              <div style={{
                flex: '1.2',
                background: '#040711',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                position: 'relative'
              }}>
                <div style={{
                  maxWidth: '100%',
                  maxHeight: '520px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.6)'
                }}>
                  <video
                    ref={modalVideoRef}
                    src={activeModalClip.stream_url}
                    controls
                    autoPlay
                    loop={modalLoop}
                    muted={modalMuted}
                    style={{
                      maxHeight: '520px',
                      maxWidth: '100%',
                      borderRadius: '10px',
                      background: '#000000'
                    }}
                  />
                </div>

                {/* Video Playback Speed & Controls Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '16px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>Speed:</span>
                  {[0.75, 1.0, 1.25, 1.5, 2.0].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setModalSpeed(s);
                        if (modalVideoRef.current) modalVideoRef.current.playbackRate = s;
                      }}
                      style={{
                        background: modalSpeed === s ? '#6366f1' : 'transparent',
                        color: modalSpeed === s ? '#ffffff' : 'var(--text-dim)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '2px 7px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {s}x
                    </button>
                  ))}

                  <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }} />

                  <button
                    type="button"
                    onClick={() => setModalLoop(!modalLoop)}
                    style={{
                      background: modalLoop ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      color: modalLoop ? '#34d399' : 'var(--text-dim)',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Loop: {modalLoop ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Right Column: Metadata & Actions */}
              <div style={{
                flex: '0.9',
                padding: '24px',
                background: 'rgba(13, 19, 34, 0.95)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}>
                {/* Scene Role & Badge */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: '8px' }}>
                    Clip Identification
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: getTypeBadge(activeModalClip.clip_type).bg,
                      color: getTypeBadge(activeModalClip.clip_type).color,
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '6px'
                    }}>
                      {activeModalClip.clip_type_label}
                    </span>

                    {activeModalClip.scene_role && (
                      <span style={{
                        background: getRoleBadgeColor(activeModalClip.scene_role).bg,
                        color: getRoleBadgeColor(activeModalClip.scene_role).text,
                        fontSize: '12px',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        textTransform: 'uppercase'
                      }}>
                        Scene {activeModalClip.scene_order}: {activeModalClip.scene_role}
                      </span>
                    )}
                  </div>
                </div>

                {/* Narration Script */}
                {activeModalClip.narration && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: '6px' }}>
                      Voiceover Narration Script
                    </div>
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      borderLeft: '3px solid #ec4899',
                      padding: '12px 14px',
                      borderRadius: '0 8px 8px 0',
                      fontSize: '13.5px',
                      color: '#f8fafc',
                      lineHeight: '1.5'
                    }}>
                      "{activeModalClip.narration}"
                    </div>
                  </div>
                )}

                {/* Visual Description */}
                {activeModalClip.visual_description && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: '6px' }}>
                      Visual Prompt / B-Roll Context
                    </div>
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      color: '#cbd5e1',
                      lineHeight: '1.45'
                    }}>
                      {activeModalClip.visual_description}
                    </div>
                  </div>
                )}

                {/* Technical Specifications Grid */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: '8px' }}>
                    Technical Specifications
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '14px',
                    borderRadius: '10px',
                    fontSize: '12px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Aspect Ratio</span>
                      <strong style={{ color: '#f8fafc' }}>{activeModalClip.aspect_ratio}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Resolution</span>
                      <strong style={{ color: '#f8fafc' }}>{activeModalClip.resolution}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Duration</span>
                      <strong style={{ color: '#f8fafc' }}>{activeModalClip.duration_formatted} ({activeModalClip.duration_seconds}s)</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>File Size</span>
                      <strong style={{ color: '#f8fafc' }}>{activeModalClip.file_size_formatted}</strong>
                    </div>
                  </div>
                </div>

                {/* Relative Storage Path */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: '6px' }}>
                    Storage File Location
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    fontFamily: 'monospace',
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    wordBreak: 'break-all'
                  }}>
                    {activeModalClip.relative_path}
                  </div>
                </div>

                {/* Action Buttons in Modal */}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a
                      href={activeModalClip.download_url}
                      download={activeModalClip.filename}
                      className="btn btn-primary"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px',
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                        border: 'none',
                        textDecoration: 'none'
                      }}
                    >
                      <Download size={16} />
                      <span>Download Clip MP4</span>
                    </a>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleCopyLink(activeModalClip)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px' }}
                    >
                      {copiedId === activeModalClip.id ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                      <span>{copiedId === activeModalClip.id ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>

                  {activeModalClip.project_id && onSelectProject && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        onSelectProject(activeModalClip.project_id!);
                        setActiveModalClip(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px',
                        borderColor: 'rgba(99, 102, 241, 0.4)',
                        color: '#818cf8'
                      }}
                    >
                      <Sparkles size={15} color="#818cf8" />
                      <span>Open in Project Workspace</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
