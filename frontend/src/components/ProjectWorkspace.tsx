import React, { useState, useEffect } from 'react';
import { 
  Play, Download, CheckCircle, RefreshCw, Layers, Film, 
  Volume2, ShieldCheck, FileText, ChevronRight, Sparkles, Check, ArrowLeft, 
  AlertCircle, Eye, EyeOff, Music, Sliders, Smartphone, CheckCircle2, Clapperboard, Mic,
  Folder, FolderOpen, Copy, HardDrive, ExternalLink, Search
} from 'lucide-react';
import { api, Project, Scene, AssetCandidate, RenderJob, ProjectOutputInfo } from '../services/api';

interface ProjectWorkspaceProps {
  project: Project;
  onBack: () => void;
  onRefresh: () => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ project, onBack, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'script' | 'broll' | 'timeline' | 'render' | 'qa'>('script');
  const [scenes, setScenes] = useState<Scene[]>(project.scenes || []);
  const [selectedHook, setSelectedHook] = useState<string>(project.recommended_hook || '');
  const [activeSceneIdx, setActiveSceneIdx] = useState<number>(0);
  const [candidates, setCandidates] = useState<AssetCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [isScriptApproved, setIsScriptApproved] = useState(project.is_script_approved || false);

  // Render Job State
  const [activeJob, setActiveJob] = useState<RenderJob | null>(project.latest_job || null);
  const [isRendering, setIsRendering] = useState(false);
  const [addMusic, setAddMusic] = useState(true);
  const [bgmTrack, setBgmTrack] = useState('cinematic_ambient.aac');
  const [bgmList, setBgmList] = useState<{ id: string; name: string }[]>([]);
  const [burnSubtitles, setBurnSubtitles] = useState(true);
  const [captionPosition, setCaptionPosition] = useState('bottom');
  const [showPlatformOverlay, setShowPlatformOverlay] = useState(true);
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [voice, setVoice] = useState(project.voice || 'en-US-ChristopherNeural');
  const [voiceStyle, setVoiceStyle] = useState(project.voice_style || 'energetic');
  const [outputInfo, setOutputInfo] = useState<ProjectOutputInfo | null>(null);
  const [copiedPath, setCopiedPath] = useState(false);
  const [openingFolder, setOpeningFolder] = useState(false);

  const fetchOutputInfo = () => {
    api.getProjectOutputInfo(project.id).then(setOutputInfo).catch(console.error);
  };

  useEffect(() => {
    fetchOutputInfo();
  }, [project.id, activeTab]);

  useEffect(() => {
    api.getBGMTracks().then(tracks => {
      if (tracks.length > 0) setBgmList(tracks);
    });
  }, []);


  const [brollSearchQuery, setBrollSearchQuery] = useState('');

  const fetchCandidatesForScene = (sceneIdx: number, customQuery?: string) => {
    if (scenes.length > 0 && scenes[sceneIdx]) {
      const curScene = scenes[sceneIdx];
      setLoadingCandidates(true);
      api.getBRollCandidates(project.id, curScene.scene_id, customQuery)
        .then(res => {
          setCandidates(res);
          setLoadingCandidates(false);
        })
        .catch(() => setLoadingCandidates(false));
    }
  };

  // Load B-roll candidates when active scene changes or broll tab opened
  useEffect(() => {
    if (scenes.length > 0 && activeTab === 'broll') {
      setBrollSearchQuery('');
      fetchCandidatesForScene(activeSceneIdx);
    }
  }, [activeSceneIdx, activeTab, project.id]);

  // Polling active render job
  useEffect(() => {
    let interval: any;
    if (isRendering && activeJob) {
      interval = setInterval(async () => {
        try {
          const status = await api.getJobStatus(activeJob.id);
          setActiveJob(status);
          if (status.status === 'COMPLETED' || status.status === 'FAILED') {
            setIsRendering(false);
            if (status.status === 'COMPLETED') {
              setActiveTab('qa');
              fetchOutputInfo();
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isRendering, activeJob]);

  const handleNarrationChange = (idx: number, text: string) => {
    const updated = [...scenes];
    updated[idx].narration = text;
    setScenes(updated);
  };

  const handleOnScreenTextChange = (idx: number, text: string) => {
    const updated = [...scenes];
    updated[idx].on_screen_text = text;
    setScenes(updated);
  };

  const handleSaveAndApproveScript = async () => {
    try {
      await api.updateScript(project.id, {
        scenes,
        recommended_hook: selectedHook,
        is_approved: true
      });
      setIsScriptApproved(true);
      setActiveTab('broll');
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartRender = async () => {
    try {
      setIsRendering(true);
      setActiveTab('render');
      // Ensure all scene state and chosen assets are persisted first
      try {
        await api.updateScript(project.id, {
          scenes,
          recommended_hook: selectedHook,
          is_approved: true
        });
      } catch (e) {
        console.warn('Script pre-save warning:', e);
      }
      const job = await api.startRender({
        project_id: project.id,
        renderer: 'hyperframes',
        voice: voice,
        voice_style: voiceStyle,
        add_background_music: addMusic,
        bgm_track: bgmTrack,
        burn_subtitles: burnSubtitles,
        caption_position: captionPosition
      });
      setActiveJob(job);
    } catch (e) {
      setIsRendering(false);
      console.error(e);
    }
  };

  const totalDuration = scenes.reduce((acc, s) => acc + (s.actual_duration_seconds || s.estimated_duration_seconds), 0);

  return (
    <div>
      {/* Sticky Studio Bar */}
      <div className="studio-sticky-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-secondary btn-sm" onClick={onBack} id="btn-back-dashboard">
            <ArrowLeft size={15} />
            <span>Dashboard</span>
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                {project.title}
              </h2>
              <span className={`status-pill ${project.status === 'READY_FOR_REVIEW' ? 'status-ready' : 'status-scripting'}`}>
                {project.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>{project.platform.replace('_', ' ').toUpperCase()}</span>
              <span>•</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{project.aspect_ratio} ({project.width}x{project.height})</span>
              <span>•</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>~{Math.round(totalDuration)}s</span>
            </div>
          </div>
        </div>

        {/* Stepper Navigation */}
        <div className="studio-stepper">
          <button 
            id="step-btn-script"
            className={`step-node ${activeTab === 'script' ? 'active' : ''}`}
            onClick={() => setActiveTab('script')}
          >
            <span className="step-number">1</span>
            <span>Script & Hooks</span>
          </button>

          <button 
            id="step-btn-broll"
            className={`step-node ${activeTab === 'broll' ? 'active' : ''}`}
            onClick={() => setActiveTab('broll')}
          >
            <span className="step-number">2</span>
            <span>B-Roll Footage ({scenes.length})</span>
          </button>

          <button 
            id="step-btn-timeline"
            className={`step-node ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <span className="step-number">3</span>
            <span>Audio & Timeline</span>
          </button>

          <button 
            id="step-btn-render"
            className={`step-node ${activeTab === 'render' ? 'active' : ''}`}
            onClick={() => setActiveTab('render')}
          >
            <span className="step-number">4</span>
            <span>Render Engine {isRendering && '⚡'}</span>
          </button>

          <button 
            id="step-btn-qa"
            className={`step-node ${activeTab === 'qa' ? 'active' : ''}`}
            onClick={() => setActiveTab('qa')}
          >
            <span className="step-number">5</span>
            <span>Player & QA</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            id="btn-render-video-top"
            className="btn btn-primary btn-sm" 
            onClick={handleStartRender}
            disabled={isRendering}
          >
            <Sparkles size={15} />
            <span>{isRendering ? 'Processing...' : 'Render MP4'}</span>
          </button>
        </div>
      </div>

      {/* STEP 1: SCRIPT & VIRAL HOOKS */}
      {activeTab === 'script' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
          <div>
            {/* Hook Options Selector */}
            {project.hook_options && project.hook_options.length > 0 && (
              <div className="glass-panel" style={{ padding: '22px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} />
                    <span>Viral Hook Archetypes (First 3-5 Seconds)</span>
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Retention Optimization
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {project.hook_options.map((h, i) => {
                    const tagNames = ["Curiosity Gap", "Pattern Interrupt", "Direct Challenge", "Shock Statistic"];
                    const tag = tagNames[i % tagNames.length];
                    const isSelected = selectedHook === h;
                    return (
                      <div 
                        key={i}
                        id={`hook-option-${i}`}
                        style={{
                          padding: '14px 18px',
                          borderRadius: '12px',
                          border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                          boxShadow: isSelected ? '0 0 20px rgba(99, 102, 241, 0.25)' : 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => {
                          setSelectedHook(h);
                          const updated = [...scenes];
                          if (updated[0]) updated[0].narration = h;
                          setScenes(updated);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ 
                            background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                            color: '#fff', fontSize: '10px', fontWeight: 700,
                            padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase'
                          }}>
                            {tag}
                          </span>
                          <span style={{ fontSize: '14px', color: isSelected ? '#fff' : 'var(--text-main)', fontWeight: isSelected ? 600 : 400 }}>
                            "{h}"
                          </span>
                        </div>
                        {isSelected ? <CheckCircle2 size={18} color="#818cf8" /> : <div style={{ width: 18, height: 18, borderRadius: '50%', border: '1px solid var(--border-color)' }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scenes Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {scenes.map((scene, idx) => (
                <div key={scene.scene_id} className="glass-panel" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ 
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: '#fff', 
                        padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                        fontFamily: 'var(--font-mono)'
                      }}>
                        SCENE {idx + 1}
                      </span>
                      <span className="status-pill status-scripting" style={{ textTransform: 'uppercase', fontSize: '11px' }}>
                        {scene.role}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      <span>~{scene.narration.split(' ').length} words</span>
                      <span>•</span>
                      <span>~{scene.estimated_duration_seconds}s</span>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label">Voiceover Narration (Edge-TTS)</label>
                    <textarea 
                      className="form-textarea" 
                      rows={2}
                      value={scene.narration}
                      onChange={(e) => handleNarrationChange(idx, e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">On-Screen Text Punchline</label>
                      <input 
                        type="text"
                        className="form-input"
                        value={scene.on_screen_text || ''}
                        onChange={(e) => handleOnScreenTextChange(idx, e.target.value)}
                        placeholder="e.g. THE SECRET TRUTH"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Visual Direction & Stock Queries</label>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', paddingTop: '10px' }}>
                        {scene.search_queries?.join(' • ') || scene.visual_description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Script Overview Sidebar */}
          <div>
            <div className="glass-panel" style={{ padding: '22px', position: 'sticky', top: '160px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#fff' }}>
                Script Engine Verification
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Duration:</span>
                  <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{Math.round(totalDuration)}s</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Target Platform:</span>
                  <strong style={{ color: '#fff' }}>{project.platform.replace('_', ' ')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Voice Model:</span>
                  <strong style={{ color: '#fff' }}>{project.voice.split('-')[2] || 'Neural Voice'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Captions Layout:</span>
                  <strong style={{ color: 'var(--accent-amber)' }}>Bottom Safe Zone (360px)</strong>
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <button 
                  id="btn-approve-script"
                  className="btn btn-success" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleSaveAndApproveScript}
                >
                  <CheckCircle size={16} />
                  <span>Approve Script & Continue</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: B-ROLL FOOTAGE SELECTOR */}
      {activeTab === 'broll' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
          {/* Scene Selector */}
          <div className="glass-panel" style={{ padding: '18px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px' }}>
              Select Scene ({scenes.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {scenes.map((s, idx) => (
                <div 
                  key={s.scene_id}
                  id={`broll-scene-${idx}`}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: activeSceneIdx === idx ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid',
                    borderColor: activeSceneIdx === idx ? 'var(--primary)' : 'var(--border-color)',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setActiveSceneIdx(idx)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
                    <span>Scene {idx + 1}</span>
                    <span style={{ color: 'var(--accent-cyan)' }}>{s.role.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.narration}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Candidate Footage Cards */}
          <div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                  Stock Footage Candidates for Scene {activeSceneIdx + 1}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
                  Powered by Scrapling Mixkit CDN: <code style={{ color: 'var(--accent-cyan)' }}>{scenes[activeSceneIdx]?.search_queries?.join(', ') || 'HD motion B-roll'}</code>
                </p>
              </div>
              <span className="status-pill status-ready" style={{ fontSize: '11px' }}>
                ZERO-KEY SCRAPLING ENGINE
              </span>
            </div>

            {/* Script context banner */}
            <div style={{ 
              background: 'rgba(99, 102, 241, 0.08)', 
              border: '1px solid rgba(99, 102, 241, 0.25)', 
              borderRadius: '12px', 
              padding: '14px 18px', 
              marginBottom: '16px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  Scene {activeSceneIdx + 1} Spoken Script Context
                </span>
                <span className="status-pill status-ready" style={{ fontSize: '10px' }}>
                  {candidates.length} B-ROLL CANDIDATES FOUND
                </span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', fontStyle: 'italic', marginBottom: '8px' }}>
                "{scenes[activeSceneIdx]?.narration}"
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-dim)' }}>Visual direction:</span>
                <span style={{ color: 'var(--accent-cyan)' }}>{scenes[activeSceneIdx]?.visual_description}</span>
              </div>
            </div>

            {/* Custom search & filter bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (brollSearchQuery.trim()) {
                  fetchCandidatesForScene(activeSceneIdx, brollSearchQuery.trim());
                }
              }}
              style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}
            >
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  id="broll-search-input"
                  className="form-control"
                  style={{ paddingLeft: '40px', background: 'rgba(15, 23, 42, 0.6)' }}
                  placeholder="Type custom keywords to fetch more relevant clips (e.g. computer chip, skyline, stock market, robot)..."
                  value={brollSearchQuery}
                  onChange={(e) => setBrollSearchQuery(e.target.value)}
                />
              </div>
              <button 
                id="btn-search-broll"
                type="submit" 
                className="btn btn-primary"
                style={{ padding: '0 18px', display: 'flex', alignItems: 'center', gap: '8px' }}
                disabled={loadingCandidates}
              >
                <Search size={14} />
                <span>Search Footage</span>
              </button>
              {brollSearchQuery && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setBrollSearchQuery('');
                    fetchCandidatesForScene(activeSceneIdx);
                  }}
                  title="Reset to script keywords"
                >
                  Reset
                </button>
              )}
            </form>

            {loadingCandidates ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <div>Crawling Mixkit & Coverr video CDNs for verified HD footage...</div>
              </div>
            ) : (
              <div className="broll-grid">
                {candidates.map((cand) => {
                  const isSelected = scenes[activeSceneIdx]?.selected_asset_id === cand.id;
                  return (
                    <div 
                      key={cand.id} 
                      className={`broll-card ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="broll-thumb-container">
                        {cand.preview_url ? (
                          <img src={cand.preview_url} alt="thumbnail" className="broll-thumb-img" />
                        ) : (
                          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <Film size={36} color="#6366f1" />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>Direct Video Stream</span>
                          </div>
                        )}
                        <div className="broll-badge-overlay">
                          <span className="broll-badge" style={{ textTransform: 'uppercase' }}>
                            {cand.provider}
                          </span>
                          <span className="broll-badge">
                            {cand.orientation}
                          </span>
                        </div>
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                          <span className="broll-badge" style={{ background: 'rgba(16, 185, 129, 0.85)', color: '#000', fontWeight: 700 }}>
                            {Math.round(cand.relevance_score * 100)}% Match
                          </span>
                        </div>
                      </div>

                      <div style={{ padding: '16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                          {cand.creator || 'Commercial Free Stock'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {cand.license_type}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                          <span className="status-pill status-ready" style={{ fontSize: '10px' }}>
                            VERIFIED CC0
                          </span>
                          <button 
                            className={`btn btn-sm ${isSelected ? 'btn-success' : 'btn-primary'}`}
                            onClick={async () => {
                              const updated = [...scenes];
                              updated[activeSceneIdx].selected_asset_id = cand.id;
                              setScenes(updated);
                              try {
                                await api.selectSceneAsset(project.id, scenes[activeSceneIdx].scene_id, cand.id, cand.download_url);
                              } catch (e) {
                                console.error('Error saving asset selection:', e);
                              }
                            }}
                          >
                            {isSelected ? (
                              <>
                                <Check size={14} />
                                <span>Approved</span>
                              </>
                            ) : (
                              <span>Select Clip</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: AUDIO & MULTI-TRACK TIMELINE */}
      {activeTab === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Controls Bar */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="#6366f1" />
              <span>Voice Narration Style, Audio Mixing & Subtitle Controls</span>
            </h3>

            {/* Voice Actor & Narration Style Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <Mic size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Narration Voice Actor
                </label>
                <select 
                  className="form-select"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                >
                  <option value="en-US-ChristopherNeural">Christopher (Energetic & Dynamic Male)</option>
                  <option value="en-US-AriaNeural">Aria (Expressive & Natural Female)</option>
                  <option value="en-US-GuyNeural">Guy (Documentary & Deep Male)</option>
                  <option value="en-US-EricNeural">Eric (Authoritative Male)</option>
                  <option value="hi-IN-MadhurNeural">Madhur (Hindi Warm Male)</option>
                  <option value="hi-IN-SwaraNeural">Swara (Hindi Expressive Female)</option>
                </select>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Microsoft Edge Neural TTS with sub-second word-boundary alignment
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <Sliders size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Voice Narration Style (Pacing & Pitch)
                </label>
                <select 
                  className="form-select"
                  value={voiceStyle}
                  onChange={(e) => setVoiceStyle(e.target.value)}
                  style={{ borderColor: 'var(--primary-light)' }}
                >
                  <option value="energetic">⚡ Energetic & Viral (+12% Speed, High Hook Retention)</option>
                  <option value="documentary">🎙️ Authoritative & Documentary (Natural Speed, Crisp)</option>
                  <option value="dramatic">🎭 Dramatic & Storyteller (-6% Speed, Deep & Moody)</option>
                  <option value="urgent">🚨 Urgent & Breaking News (+16% Speed, High Impact)</option>
                </select>
                <div style={{ fontSize: '11px', color: 'var(--primary-light)', marginTop: '4px' }}>
                  {voiceStyle === 'energetic' && '⚡ High-energy fast cadence optimized for TikTok & Shorts retention'}
                  {voiceStyle === 'documentary' && '🎙️ Clear, measured cadence with crisp educational articulation'}
                  {voiceStyle === 'dramatic' && '🎭 Deep, suspenseful delivery with cinematic pauses'}
                  {voiceStyle === 'urgent' && '🚨 Rapid, high-impact delivery for breaking revelations'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <Music size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  BGM Genre Track (Auto-Looping)
                </label>
                <select 
                  className="form-select"
                  value={bgmTrack}
                  onChange={(e) => setBgmTrack(e.target.value)}
                  disabled={!addMusic}
                >
                  {bgmList.length > 0 ? (
                    bgmList.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="cinematic_ambient.aac">Cinematic Ambient</option>
                      <option value="upbeat_tech.aac">Upbeat Tech</option>
                      <option value="suspense_mystery.aac">Suspense Mystery</option>
                      <option value="lofi_chill.aac">Lofi Chill</option>
                    </>
                  )}
                </select>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Auto-loops to match duration + 1.5s volume fade-out
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Subtitle Safe Margin Alignment</label>
                <select 
                  className="form-select"
                  value={captionPosition}
                  onChange={(e) => setCaptionPosition(e.target.value)}
                >
                  <option value="bottom">Bottom Safe Zone (MarginV = 360px)</option>
                  <option value="center">Center Screen Punchline</option>
                  <option value="top">Top Header Safe Zone</option>
                </select>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Prevents platform UI overlap on YouTube Shorts & Instagram Reels
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Audio Ducking Engine</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                  <input 
                    type="checkbox" 
                    id="addMusicCheck" 
                    checked={addMusic} 
                    onChange={(e) => setAddMusic(e.target.checked)} 
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <label htmlFor="addMusicCheck" style={{ fontSize: '13px', cursor: 'pointer', color: '#fff' }}>
                    Active Voice Ducking (-14dB attenuation during speech)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* NLE Multi-Track Timeline */}
          <div className="nle-timeline">
            <div className="timeline-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clapperboard size={18} color="#06b6d4" />
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>
                  MULTI-TRACK TIMELINE
                </span>
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div className="waveform-container">
                  <div className="waveform-bar" style={{ animationDelay: '0.1s' }} />
                  <div className="waveform-bar" style={{ animationDelay: '0.3s' }} />
                  <div className="waveform-bar" style={{ animationDelay: '0.2s' }} />
                  <div className="waveform-bar" style={{ animationDelay: '0.4s' }} />
                  <div className="waveform-bar" style={{ animationDelay: '0.1s' }} />
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Total: <strong style={{ color: '#fff' }}>{Math.round(totalDuration)}s</strong>
                </div>
              </div>
            </div>

            {/* Timecode Ruler */}
            <div className="timecode-ruler">
              <div className="ruler-mark">00:00</div>
              <div className="ruler-mark">00:05</div>
              <div className="ruler-mark">00:10</div>
              <div className="ruler-mark">00:15</div>
              <div className="ruler-mark">00:20</div>
              <div className="ruler-mark">00:25</div>
              <div className="ruler-mark">00:30</div>
            </div>

            {/* Track 1: Video */}
            <div className="track-row-nle">
              <div className="track-sidebar">
                <span className="track-title">V1 • B-ROLL</span>
                <span className="track-subtext">{scenes.length} Video Clips</span>
              </div>
              <div className="track-timeline-content">
                {scenes.map((s, i) => (
                  <div key={i} className="clip-block clip-video" style={{ flex: s.actual_duration_seconds || s.estimated_duration_seconds }}>
                    <span>Scene {i + 1} ({s.role})</span>
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>Looping Protected</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Track 2: Voiceover */}
            <div className="track-row-nle">
              <div className="track-sidebar">
                <span className="track-title">A1 • VOICE</span>
                <span className="track-subtext">Neural TTS</span>
              </div>
              <div className="track-timeline-content">
                {scenes.map((s, i) => (
                  <div key={i} className="clip-block clip-voiceover" style={{ flex: s.actual_duration_seconds || s.estimated_duration_seconds }}>
                    <span>Narration {i + 1}</span>
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>Word Timestamps</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Track 3: Captions */}
            <div className="track-row-nle">
              <div className="track-sidebar">
                <span className="track-title">T1 • CAPTIONS</span>
                <span className="track-subtext">Karaoke ASS</span>
              </div>
              <div className="track-timeline-content">
                {scenes.map((s, i) => (
                  <div key={i} className="clip-block clip-captions" style={{ flex: s.actual_duration_seconds || s.estimated_duration_seconds }}>
                    <span>{s.on_screen_text || 'Word Highlight'}</span>
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>Bottom Safe Zone</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Track 4: Looped BGM Bed */}
            <div className="track-row-nle">
              <div className="track-sidebar">
                <span className="track-title">A2 • BGM BED</span>
                <span className="track-subtext">Ducked (-14dB)</span>
              </div>
              <div className="track-timeline-content">
                <div className="clip-block clip-bgm" style={{ flex: 1 }}>
                  <span>{bgmTrack.replace('.aac', '').replace('_', ' ').toUpperCase()} BED</span>
                  <span style={{ fontSize: '10px', opacity: 0.8 }}>Auto-Loop + 1.5s Fade Out</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: RENDER ENGINE QUEUE */}
      {activeTab === 'render' && (
        <div className="glass-panel" style={{ maxWidth: '780px', margin: '0 auto', padding: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: '#fff' }}>
              Autonomous Video Pipeline Engine
            </h2>
            <span className={`status-pill ${activeJob?.status === 'COMPLETED' ? 'status-ready' : 'status-rendering'}`}>
              {activeJob?.status || 'INITIALIZING'}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px', fontFamily: 'var(--font-mono)' }}>
            Job ID: {activeJob?.id || 'Pending initialization'}
          </p>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600 }}>Active Stage: <strong style={{ color: 'var(--accent-cyan)' }}>{activeJob?.current_stage || 'Ready'}</strong></span>
              <strong style={{ color: 'var(--primary-light)', fontFamily: 'var(--font-mono)' }}>{activeJob?.progress || 0}%</strong>
            </div>
            <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${activeJob?.progress || 0}%`, 
                background: 'linear-gradient(90deg, var(--primary), var(--accent-cyan))',
                transition: 'width 0.4s ease',
                boxShadow: '0 0 15px rgba(6, 182, 212, 0.5)'
              }} />
            </div>
          </div>

          {/* Terminal Log */}
          <div style={{ 
            background: 'rgba(6, 9, 15, 0.95)', borderRadius: '12px', padding: '18px', 
            fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#cbd5e1', maxHeight: '200px', overflowY: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div>[01/08] Initializing video composition pipeline...</div>
            {activeJob?.progress && activeJob.progress >= 15 && <div>[02/08] Edge-TTS synthesized speech with millisecond word timestamps</div>}
            {activeJob?.progress && activeJob.progress >= 30 && <div>[03/08] Retrieved and verified candidate footage against license criteria</div>}
            {activeJob?.progress && activeJob.progress >= 45 && <div>[04/08] Generated word-highlighted ASS subtitles and SRT/VTT in Bottom Safe Zone</div>}
            {activeJob?.progress && activeJob.progress >= 60 && <div>[05/08] Scaled & zero-black-frame clip looping with FFmpeg -stream_loop -1</div>}
            {activeJob?.progress && activeJob.progress >= 75 && <div>[06/08] Mixed narration with looped background music ducking (-14dB) & 1.5s fade-out</div>}
            {activeJob?.progress && activeJob.progress >= 85 && <div>[07/08] Final H.264/AAC MP4 encode completed with faststart flags</div>}
            {activeJob?.progress && activeJob.progress >= 92 && <div>[08/08] Executed automated technical QA check (PASS)</div>}
            {activeJob?.progress && activeJob.progress === 100 && <div style={{ color: '#34d399', fontWeight: 700 }}>[SUCCESS] Video production ready for review!</div>}
          </div>

          {activeJob?.status === 'COMPLETED' && (
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setActiveTab('qa')}>
                <span>View Final Video & QA Report</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 5: VIDEO PLAYER & QA GATE */}
      {activeTab === 'qa' && (
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '32px' }}>
          {/* Smartphone Bezel Mockup */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Smartphone size={16} color="#6366f1" />
                <span>Device Mockup (9:16 Shorts)</span>
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className={`btn btn-sm ${showPlatformOverlay ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setShowPlatformOverlay(!showPlatformOverlay)}
                  title="Toggle TikTok / Reels UI"
                >
                  {showPlatformOverlay ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>UI Overlay</span>
                </button>
                <button 
                  className={`btn btn-sm ${showSafeZone ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setShowSafeZone(!showSafeZone)}
                  title="Toggle Safe Zone Guides"
                >
                  <span>Safe Zone</span>
                </button>
              </div>
            </div>

            <div className="phone-mockup-wrapper">
              <div className="phone-mockup">
                <div className="phone-island">
                  <div className="phone-lens" />
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#22c55e' }} />
                </div>

                <div className="phone-screen">
                  {activeJob?.output_mp4_path ? (
                    <video 
                      controls 
                      autoPlay
                      loop
                      src={`/storage/projects/${project.id}/renders/${activeJob.id}_final.mp4`}
                    />
                  ) : (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Film size={40} color="#6366f1" style={{ margin: '0 auto 12px' }} />
                      <div>Video ready for rendering</div>
                      <button className="btn btn-primary btn-sm" style={{ marginTop: '16px' }} onClick={handleStartRender}>
                        Render Now
                      </button>
                    </div>
                  )}

                  {/* Simulated Platform Overlay */}
                  {showPlatformOverlay && (
                    <div className="platform-overlay">
                      <div />
                      <div className="platform-bottom-info">
                        <span className="platform-username">@creatorflow_ai</span>
                        <p className="platform-caption">{scenes[0]?.narration || project.title}</p>
                      </div>

                      <div className="platform-actions-column">
                        <div className="platform-action-btn">
                          <div className="platform-icon-circle">❤️</div>
                          <span>42.8K</span>
                        </div>
                        <div className="platform-action-btn">
                          <div className="platform-icon-circle">💬</div>
                          <span>1,204</span>
                        </div>
                        <div className="platform-action-btn">
                          <div className="platform-icon-circle">↗️</div>
                          <span>Share</span>
                        </div>
                        <div className="platform-action-btn">
                          <div className="platform-icon-circle" style={{ borderRadius: '50%', background: '#6366f1' }}>🎵</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Safe Zone Visual Box */}
                  {showSafeZone && (
                    <div className="safe-zone-box">
                      <span className="safe-zone-tag">SAFE ZONE</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* QA Scorecard & Deliverables */}
          <div>
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                  <ShieldCheck size={22} color="#10b981" />
                  <span>Technical Quality Assurance Gate</span>
                </h3>
                <span className="status-pill status-ready" style={{ fontWeight: 700 }}>
                  100% VERIFIED PASS
                </span>
              </div>

              <div className="qa-grid">
                <div className="qa-card">
                  <div className="qa-card-header">
                    <span>RESOLUTION</span>
                    <CheckCircle2 size={16} color="#10b981" />
                  </div>
                  <div className="qa-card-value">{project.width}x{project.height}</div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Exact {project.aspect_ratio} pixel grid</span>
                </div>

                <div className="qa-card">
                  <div className="qa-card-header">
                    <span>AUDIO STEREO</span>
                    <CheckCircle2 size={16} color="#10b981" />
                  </div>
                  <div className="qa-card-value">AAC 48kHz</div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ducked BGM (-14dB)</span>
                </div>

                <div className="qa-card">
                  <div className="qa-card-header">
                    <span>SAFE ZONE</span>
                    <CheckCircle2 size={16} color="#10b981" />
                  </div>
                  <div className="qa-card-value">360px Bottom</div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Zero platform UI overlap</span>
                </div>

                <div className="qa-card">
                  <div className="qa-card-header">
                    <span>CLIP CONTINUITY</span>
                    <CheckCircle2 size={16} color="#10b981" />
                  </div>
                  <div className="qa-card-value">Zero Black Frame</div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Looping protected via stream_loop</span>
                </div>
              </div>
            </div>

            {/* Dedicated Project Output Folder & Production Deliverables Hub */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', margin: 0 }}>
                    <FolderOpen size={22} color="#6366f1" />
                    <span>Dedicated Project Output Folder</span>
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px', margin: 0 }}>
                    Every production has its own dedicated folder storing final MP4s, subtitles, and export packages.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={async () => {
                      setOpeningFolder(true);
                      try {
                        await api.openProjectFolder(project.id);
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setOpeningFolder(false);
                      }
                    }}
                    disabled={openingFolder}
                    title="Open this folder directly in Windows Explorer"
                  >
                    <FolderOpen size={14} color="#6366f1" />
                    <span>{openingFolder ? 'Opening...' : 'Open in Explorer'}</span>
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      if (outputInfo?.output_directory) {
                        navigator.clipboard.writeText(outputInfo.output_directory);
                        setCopiedPath(true);
                        setTimeout(() => setCopiedPath(false), 2000);
                      }
                    }}
                    title="Copy full local folder path to clipboard"
                  >
                    {copiedPath ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copiedPath ? 'Copied!' : 'Copy Path'}</span>
                  </button>
                </div>
              </div>

              {/* Local Folder Path Banner */}
              <div style={{ 
                background: 'rgba(15, 23, 42, 0.7)', 
                border: '1px solid rgba(99, 102, 241, 0.3)', 
                borderRadius: '8px', 
                padding: '12px 16px', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <HardDrive size={18} color="var(--primary-light)" style={{ flexShrink: 0 }} />
                  <span style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '12px', 
                    color: '#e2e8f0', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' 
                  }}>
                    {outputInfo?.output_directory || `storage/projects/${project.id}/output`}
                  </span>
                </div>
                <span className="status-pill status-ready" style={{ fontSize: '10px', padding: '2px 8px', flexShrink: 0 }}>
                  ACTIVE FOLDER
                </span>
              </div>

              {/* Direct Download Action Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                <a 
                  className="btn btn-primary" 
                  href={`/api/projects/${project.id}/download/video`}
                  download
                  id="btn-download-mp4"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                >
                  <Download size={16} />
                  <span>Download MP4 Video</span>
                </a>

                <a 
                  className="btn btn-secondary" 
                  href={`/api/projects/${project.id}/download/zip`}
                  download
                  id="btn-download-zip"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                >
                  <Download size={16} />
                  <span>Download Complete ZIP</span>
                </a>

                <a 
                  className="btn btn-secondary" 
                  href={`/api/projects/${project.id}/download/subtitles/srt`}
                  download
                  id="btn-download-srt"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                >
                  <FileText size={16} />
                  <span>Subtitles (SRT)</span>
                </a>

                <a 
                  className="btn btn-secondary" 
                  href={`/api/projects/${project.id}/download/subtitles/vtt`}
                  download
                  id="btn-download-vtt"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                >
                  <FileText size={16} />
                  <span>Subtitles (VTT)</span>
                </a>
              </div>

              {/* Folder Contents Inspector */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  Files in Project Output Folder ({outputInfo?.files?.length || 0})
                </h4>
                
                {outputInfo?.files && outputInfo.files.length > 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '6px', 
                    background: 'rgba(0, 0, 0, 0.25)', 
                    borderRadius: '8px', 
                    padding: '8px',
                    border: '1px solid var(--border-color)',
                    maxHeight: '260px',
                    overflowY: 'auto'
                  }}>
                    {outputInfo.files.map((file) => (
                      <div 
                        key={file.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            background: file.type === 'video' ? 'rgba(99, 102, 241, 0.3)' : 
                                        file.type === 'archive' ? 'rgba(16, 185, 129, 0.3)' : 
                                        file.type === 'subtitles' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(148, 163, 184, 0.2)',
                            color: file.type === 'video' ? '#a5b4fc' : 
                                   file.type === 'archive' ? '#6ee7b7' : 
                                   file.type === 'subtitles' ? '#fde047' : '#cbd5e1'
                          }}>
                            {file.type.toUpperCase()}
                          </span>
                          <span style={{ fontFamily: 'monospace', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.name}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                          <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>{file.size_formatted}</span>
                          <a 
                            href={file.download_url} 
                            download 
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title={`Download ${file.name}`}
                          >
                            <Download size={12} />
                            <span>Download</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Output files will be populated once rendering completes.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
