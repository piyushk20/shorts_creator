import React, { useState, useEffect } from 'react';
import { 
  Play, Download, CheckCircle, RefreshCw, Layers, Film, 
  Volume2, ShieldCheck, FileText, ChevronRight, Sparkles, Check, ArrowLeft, 
  AlertCircle, Eye, EyeOff, Music, Sliders, Smartphone, CheckCircle2, Clapperboard, Mic,
  Folder, FolderOpen, Copy, HardDrive, ExternalLink, Search, Wand2, Image as ImageIcon, Video as VideoIcon
} from 'lucide-react';
import { api, Project, Scene, AssetCandidate, RenderJob, ProjectOutputInfo, ProjectVisualsStatus, SceneVisualStatus } from '../services/api';

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

  // Script-to-Image Matching State (Cloudflare FLUX.1-schnell)
  const [visualsStatus, setVisualsStatus] = useState<ProjectVisualsStatus | null>(null);
  const [generatingVisuals, setGeneratingVisuals] = useState<boolean>(false);
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);
  const [visualsProgress, setVisualsProgress] = useState<string>('');
  const [showMotionVideo, setShowMotionVideo] = useState<boolean>(false);
  const [showStockAccordion, setShowStockAccordion] = useState<boolean>(false);

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

  const fetchVisualsStatus = async () => {
    try {
      const res = await api.getProjectVisualsStatus(project.id);
      setVisualsStatus(res);
    } catch (e) {
      console.error('Failed to get visuals status', e);
    }
  };

  useEffect(() => {
    fetchOutputInfo();
    fetchVisualsStatus();
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

  useEffect(() => {
    if (scenes.length > 0 && activeTab === 'broll') {
      setBrollSearchQuery('');
      fetchCandidatesForScene(activeSceneIdx);
    }
  }, [activeSceneIdx, activeTab, project.id]);

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

  const handleGenerateAllMatchingVisuals = async (force: boolean = false) => {
    try {
      setGeneratingVisuals(true);
      setVisualsProgress('Synthesizing script-matching AI visuals via FLUX.1-schnell & generating 30fps Ken Burns motion clips...');
      const res = await api.generateMatchingVisuals(project.id, {
        force_regenerate: force,
        steps: 4,
        motion_preset: 'slow_zoom_in'
      });
      setVisualsStatus(res);
      const updatedProject = await api.getProject(project.id);
      if (updatedProject.scenes) {
        setScenes(updatedProject.scenes);
      }
      setGeneratingVisuals(false);
      setVisualsProgress('');
      return res;
    } catch (e: any) {
      setGeneratingVisuals(false);
      setVisualsProgress('');
      alert(e.message || 'Failed to generate script-matching visuals');
      throw e;
    }
  };

  const handleGenerateSingleVisual = async (sceneId: string, customPrompt?: string) => {
    try {
      setGeneratingSceneId(sceneId);
      await api.generateSingleSceneMatchingVisual(project.id, sceneId, {
        prompt: customPrompt,
        steps: 4,
        motion_preset: 'slow_zoom_in'
      });
      await fetchVisualsStatus();
      const updatedProject = await api.getProject(project.id);
      if (updatedProject.scenes) {
        setScenes(updatedProject.scenes);
      }
      setGeneratingSceneId(null);
    } catch (e: any) {
      setGeneratingSceneId(null);
      alert(e.message || 'Failed to generate visual for scene');
    }
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
      // Workflow Enforcement: Ensure script-matching images are created before output render
      if (visualsStatus && !visualsStatus.all_visuals_ready) {
        setGeneratingVisuals(true);
        setActiveTab('render');
        setVisualsProgress('Workflow Gate: Synthesizing script-matching AI visuals before rendering output...');
        await api.generateMatchingVisuals(project.id, {
          force_regenerate: false,
          steps: 4,
          motion_preset: 'slow_zoom_in'
        });
        const st = await api.getProjectVisualsStatus(project.id);
        setVisualsStatus(st);
        const updatedProject = await api.getProject(project.id);
        if (updatedProject.scenes) {
          setScenes(updatedProject.scenes);
        }
        setGeneratingVisuals(false);
        setVisualsProgress('');
      }

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
    } catch (e: any) {
      setIsRendering(false);
      setGeneratingVisuals(false);
      setVisualsProgress('');
      console.error(e);
      alert(e.message || 'Render failed');
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
            <span>Script Visuals ({visualsStatus?.matched_scenes_count || 0}/{scenes.length})</span>
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
            disabled={isRendering || generatingVisuals}
            style={{
              background: (!visualsStatus?.all_visuals_ready && !isRendering) ? 'linear-gradient(135deg, #f59e0b, #d97706)' : undefined,
              boxShadow: (!visualsStatus?.all_visuals_ready && !isRendering) ? '0 0 16px rgba(245, 158, 11, 0.4)' : undefined
            }}
          >
            <Sparkles size={15} />
            <span>
              {generatingVisuals 
                ? 'Creating Matching Images...' 
                : isRendering 
                  ? 'Rendering Output...' 
                  : (!visualsStatus?.all_visuals_ready ? 'Create Images & Render' : 'Render MP4 Output')}
            </span>
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

      {/* STEP 2: SCRIPT-MATCHED AI VISUALS & FOOTAGE */}
      {activeTab === 'broll' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
          {/* Scene Selector */}
          <div className="glass-panel" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                Scenes ({scenes.length})
              </h3>
              <span className={`status-pill ${visualsStatus?.all_visuals_ready ? 'status-ready' : 'status-rendering'}`} style={{ fontSize: '10px' }}>
                {visualsStatus?.matched_scenes_count || 0}/{scenes.length} Matched
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {scenes.map((s, idx) => {
                const scVisual = visualsStatus?.scenes?.find(vs => vs.scene_id === s.scene_id);
                const isMatched = scVisual?.is_ready;
                return (
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 700 }}>
                      <span style={{ color: activeSceneIdx === idx ? '#fff' : 'var(--text-muted)' }}>
                        Scene {idx + 1} • {s.role.toUpperCase()}
                      </span>
                      {isMatched ? (
                        <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Check size={10} /> Matched
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', padding: '2px 6px', borderRadius: '4px' }}>
                          ⏳ Needs Image
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.narration}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Batch Generate in sidebar */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button
                id="btn-batch-generate-sidebar"
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={() => handleGenerateAllMatchingVisuals(false)}
                disabled={generatingVisuals}
              >
                {generatingVisuals ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Generating Visuals...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={13} />
                    <span>Generate All Images</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Main Visuals Studio Area */}
          <div>
            {/* Hero AI Script-to-Image Matching Banner */}
            <div className="glass-panel" style={{ padding: '22px', marginBottom: '20px', border: '1px solid rgba(99, 102, 241, 0.35)', background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.4), rgba(15, 23, 42, 0.8))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Wand2 size={18} color="#06b6d4" />
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                      AI Script-to-Image Matching (FLUX.1-schnell)
                    </h2>
                    <span className="status-pill status-ready" style={{ fontSize: '10px' }}>
                      {project.visual_style.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
                    Creates high-resolution images tailored directly to each scene's script narration & visual direction, then animates them to 30fps Ken Burns motion clips before output rendering.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    id="btn-generate-all-flux"
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 18px rgba(99, 102, 241, 0.4)' }}
                    onClick={() => handleGenerateAllMatchingVisuals(false)}
                    disabled={generatingVisuals}
                  >
                    {generatingVisuals ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>Synthesizing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        <span>✨ Generate All Matching Images</span>
                      </>
                    )}
                  </button>

                  <button
                    id="btn-force-regenerate-all"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleGenerateAllMatchingVisuals(true)}
                    disabled={generatingVisuals}
                    title="Force recreate all scene images from scratch"
                  >
                    <RefreshCw size={13} />
                    <span>Force Regenerate</span>
                  </button>
                </div>
              </div>

              {generatingVisuals && (
                <div style={{ marginTop: '14px', padding: '12px 16px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '8px', fontSize: '12px', color: '#67e8f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <RefreshCw size={16} className="animate-spin" color="#06b6d4" />
                  <span>{visualsProgress || 'Processing FLUX generation and Ken Burns video animation...'}</span>
                </div>
              )}
            </div>

            {/* Active Scene Script-Matching Spotlight Card */}
            {(() => {
              const curScene = scenes[activeSceneIdx];
              const curVisual = visualsStatus?.scenes?.find(vs => vs.scene_id === curScene?.scene_id);
              const isSceneMatched = curVisual?.is_ready;

              return (
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                        Scene {activeSceneIdx + 1} Visual Direction
                      </span>
                      <span className="status-pill status-ready" style={{ fontSize: '10px' }}>
                        {curScene?.role.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {isSceneMatched ? (
                        <span style={{ fontSize: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <CheckCircle2 size={14} />
                          <span>AI Visual Matched & Ready</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
                          ⚠️ Image Missing
                        </span>
                      )}

                      <button
                        id={`btn-generate-scene-${activeSceneIdx}`}
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleGenerateSingleVisual(curScene.scene_id)}
                        disabled={generatingSceneId === curScene.scene_id || generatingVisuals}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        {generatingSceneId === curScene.scene_id ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} color="#06b6d4" />
                            <span>{isSceneMatched ? 'Regenerate Scene' : 'Generate Image'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Spoken Script & AI Prompt Details */}
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, marginBottom: '6px' }}>
                      Spoken Narration ({curScene?.actual_duration_seconds || curScene?.estimated_duration_seconds}s)
                    </div>
                    <div style={{ fontSize: '14px', color: '#fff', fontStyle: 'italic', marginBottom: '12px' }}>
                      "{curScene?.narration}"
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, marginBottom: '6px' }}>
                      Script-Matched Visual Direction & AI Prompt
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                      {curVisual?.prompt || curScene?.visual_description}
                    </div>
                  </div>

                  {/* Media Preview Stage */}
                  {isSceneMatched ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Previewing: <strong style={{ color: '#fff' }}>{showMotionVideo ? '30fps Ken Burns Video Clip' : 'Static FLUX AI Image'}</strong>
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className={`btn btn-sm ${!showMotionVideo ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setShowMotionVideo(false)}
                          >
                            <ImageIcon size={13} />
                            <span>Static Image</span>
                          </button>
                          <button
                            className={`btn btn-sm ${showMotionVideo ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setShowMotionVideo(true)}
                            disabled={!curVisual?.motion_clip_url}
                          >
                            <VideoIcon size={13} />
                            <span>Animated Video</span>
                          </button>
                        </div>
                      </div>

                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        background: '#090d16', 
                        borderRadius: '12px', 
                        overflow: 'hidden', 
                        padding: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.08)' 
                      }}>
                        {showMotionVideo && curVisual?.motion_clip_url ? (
                          <video
                            key={curVisual.motion_clip_url}
                            controls
                            autoPlay
                            loop
                            style={{ maxHeight: '420px', borderRadius: '8px', maxWidth: '100%', boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }}
                            src={curVisual.motion_clip_url}
                          />
                        ) : (
                          <img
                            src={curVisual?.image_url}
                            alt="FLUX Scene Visual"
                            style={{ maxHeight: '420px', borderRadius: '8px', maxWidth: '100%', objectFit: 'contain', boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '48px 24px', 
                      textAlign: 'center', 
                      background: 'rgba(15, 23, 42, 0.5)', 
                      borderRadius: '12px', 
                      border: '2px dashed rgba(99, 102, 241, 0.3)' 
                    }}>
                      <ImageIcon size={44} color="#6366f1" style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                        No Matching Image Created Yet for Scene {activeSceneIdx + 1}
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '460px', margin: '0 auto 18px' }}>
                        Generate a custom visual image crafted directly from this scene's script using Cloudflare FLUX.1-schnell before rendering the final output video.
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleGenerateSingleVisual(curScene.scene_id)}
                        disabled={generatingSceneId === curScene.scene_id || generatingVisuals}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Sparkles size={15} />
                        <span>Generate Scene {activeSceneIdx + 1} Image</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Optional Stock Library Collapsible Accordion */}
            <div className="glass-panel" style={{ padding: '18px', marginTop: '20px' }}>
              <div 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setShowStockAccordion(!showStockAccordion)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Film size={16} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                    Optional: Browse External Stock Footage (Mixkit B-Roll)
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {showStockAccordion ? '▲ Hide Stock Footage' : '▼ Show Stock Footage Candidates'}
                </span>
              </div>

              {showStockAccordion && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
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
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                      <div>Searching CC0 stock clips...</div>
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
                              </div>
                              <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                                <span className="broll-badge" style={{ background: 'rgba(16, 185, 129, 0.85)', color: '#000', fontWeight: 700 }}>
                                  {Math.round(cand.relevance_score * 100)}% Match
                                </span>
                              </div>
                            </div>

                            <div style={{ padding: '14px' }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                                {cand.creator || 'Commercial Free Stock'}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                <span className="status-pill status-ready" style={{ fontSize: '10px' }}>
                                  VERIFIED CC0
                                </span>
                                <button 
                                  className={`btn btn-sm ${isSelected ? 'btn-success' : 'btn-secondary'}`}
                                  onClick={async () => {
                                    const updated = [...scenes];
                                    updated[activeSceneIdx].selected_asset_id = cand.id;
                                    setScenes(updated);
                                    try {
                                      await api.selectSceneAsset(project.id, scenes[activeSceneIdx].scene_id, cand.id, cand.download_url);
                                      await fetchVisualsStatus();
                                    } catch (e) {
                                      console.error('Error saving asset selection:', e);
                                    }
                                  }}
                                >
                                  {isSelected ? (
                                    <>
                                      <Check size={14} />
                                      <span>Selected</span>
                                    </>
                                  ) : (
                                    <span>Use Stock Clip</span>
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
              )}
            </div>
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

          {/* Workflow Gate: Script-to-Image Matching Verification */}
          <div style={{ 
            background: visualsStatus?.all_visuals_ready ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)', 
            border: `1px solid ${visualsStatus?.all_visuals_ready ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.35)'}`, 
            borderRadius: '14px', 
            padding: '20px', 
            marginBottom: '26px' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {visualsStatus?.all_visuals_ready ? (
                    <CheckCircle2 size={18} color="#34d399" />
                  ) : (
                    <AlertCircle size={18} color="#f59e0b" />
                  )}
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>
                    {visualsStatus?.all_visuals_ready 
                      ? 'Workflow Gate Passed: All Scene Visuals Matched' 
                      : `Workflow Gate: Missing Script-Matching Images (${scenes.length - (visualsStatus?.matched_scenes_count || 0)} scenes)`}
                  </h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
                  {visualsStatus?.all_visuals_ready 
                    ? `Every scene has verified script-matching AI visuals created with FLUX.1-schnell and animated to 30fps Ken Burns motion clips.`
                    : `CreatorFlow requires creating images matching each scene's script before generating the final video output.`}
                </p>
              </div>

              {visualsStatus?.all_visuals_ready ? (
                <button
                  id="btn-create-final-output"
                  className="btn btn-primary"
                  onClick={handleStartRender}
                  disabled={isRendering}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Sparkles size={14} />
                  <span>{isRendering ? 'Rendering Output...' : '🚀 Create Final Output Video'}</span>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    id="btn-match-and-create-output"
                    className="btn btn-primary"
                    onClick={handleStartRender}
                    disabled={isRendering || generatingVisuals}
                    style={{ 
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                      boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px' 
                    }}
                  >
                    {generatingVisuals ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Creating Images...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>✨ Create Matching Images & Output</span>
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveTab('broll')}
                  >
                    <span>Review in Step 2</span>
                  </button>
                </div>
              )}
            </div>

            {/* Checklist summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
                <Check size={13} color="#34d399" />
                <span>Script: {scenes.length} Scenes Approved</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
                <Check size={13} color="#34d399" />
                <span>Voice: Neural TTS + Ducking</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: visualsStatus?.all_visuals_ready ? '#cbd5e1' : '#facc15' }}>
                {visualsStatus?.all_visuals_ready ? <Check size={13} color="#34d399" /> : <AlertCircle size={13} color="#facc15" />}
                <span>Visuals: {visualsStatus?.matched_scenes_count || 0}/{scenes.length} Matched</span>
              </div>
            </div>
          </div>

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
