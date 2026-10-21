import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Video, 
  Mic, 
  Palette, 
  Type, 
  Clock, 
  Flame, 
  TrendingUp, 
  Search, 
  CheckCircle2, 
  Layers, 
  ExternalLink,
  DollarSign,
  FileText,
  Wand2,
  AlertCircle,
  Scissors,
  BookOpen
} from 'lucide-react';
import { api, Project, TrendingCategory, TrendingTopic, VoxTheme, VoxArc } from '../services/api';

interface CreateWizardProps {
  onProjectCreated: (project: Project) => void;
  onCancel: () => void;
  initialMode?: 'trends' | 'idea' | 'script' | 'vox';
}

export const CreateWizard: React.FC<CreateWizardProps> = ({ onProjectCreated, onCancel, initialMode = 'trends' }) => {
  // Mode: 'trends' | 'idea' | 'script' | 'vox'
  const [activeMode, setActiveMode] = useState<'trends' | 'idea' | 'script' | 'vox'>(initialMode);

  // Custom Idea & Script states
  const [scriptTitle, setScriptTitle] = useState('');
  const [customScript, setCustomScript] = useState('');
  const [ideaHook, setIdeaHook] = useState('');
  const [ideaHookScore, setIdeaHookScore] = useState<any>(null);
  const [scoringIdeaHook, setScoringIdeaHook] = useState(false);
  const [scriptHookScore, setScriptHookScore] = useState<any>(null);
  const [scoringScriptHook, setScoringScriptHook] = useState(false);

  // Vox Explainer Studio states
  const [voxThemes, setVoxThemes] = useState<VoxTheme[]>([]);
  const [voxArcs, setVoxArcs] = useState<VoxArc[]>([]);
  const [selectedVoxTheme, setSelectedVoxTheme] = useState<string>('swiss-modern');
  const [selectedVoxArc, setSelectedVoxArc] = useState<string>('how_it_works');
  const [voxTopic, setVoxTopic] = useState<string>('');
  const [voxHeadline, setVoxHeadline] = useState<string>('THE 1% ILLUSION');
  const [voxScript, setVoxScript] = useState<string>('');
  const [voxDuration, setVoxDuration] = useState<number>(45);
  const [voxAspectRatio, setVoxAspectRatio] = useState<string>('9:16');
  const [voxDraft, setVoxDraft] = useState<any>(null);
  const [draftingVox, setDraftingVox] = useState<boolean>(false);

  // Trend Discovery state
  const [categories, setCategories] = useState<TrendingCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ai');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<TrendingTopic | null>(null);
  const [loadingTrends, setLoadingTrends] = useState<boolean>(false);

  // Common Video Creation parameters
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('youtube_shorts');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [duration, setDuration] = useState(45);
  const [language, setLanguage] = useState('en');
  const [voice, setVoice] = useState('en-US-ChristopherNeural');
  const [voiceStyle, setVoiceStyle] = useState('energetic');
  const [visualStyle, setVisualStyle] = useState('cinematic');
  const [captionStyle, setCaptionStyle] = useState('word_highlight');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await api.getTrendingCategories();
        setCategories(cats);
      } catch (e) {
        console.error('Failed to load categories', e);
      }
    }
    loadCategories();
  }, []);

  // Fetch trends when selected category changes
  useEffect(() => {
    async function loadTrends() {
      setLoadingTrends(true);
      setError(null);
      try {
        const res = await api.discoverTrends(selectedCategory, searchQuery);
        setTrendingTopics(res.topics || []);
        // Automatically select the #1 trend as default recommendation if none selected or category changed
        if (res.topics && res.topics.length > 0) {
          setSelectedTrend(res.topics[0]);
          setTopic(res.topics[0].title);
        } else {
          setSelectedTrend(null);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch trending topics');
      } finally {
        setLoadingTrends(false);
      }
    }
    loadTrends();
  }, [selectedCategory]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingTrends(true);
    try {
      const res = await api.discoverTrends(selectedCategory, searchQuery);
      setTrendingTopics(res.topics || []);
      if (res.topics && res.topics.length > 0) {
        setSelectedTrend(res.topics[0]);
        setTopic(res.topics[0].title);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search trending topics');
    } finally {
      setLoadingTrends(false);
    }
  };

  const handleSelectTrend = (t: TrendingTopic) => {
    setSelectedTrend(t);
    setTopic(t.title);
    if (t.target_duration) setDuration(t.target_duration);
    if (t.platform) setPlatform(t.platform);
    if (t.aspect_ratio) setAspectRatio(t.aspect_ratio);
  };

  const handlePlatformChange = (p: string) => {
    setPlatform(p);
    if (p === 'youtube_shorts' || p === 'instagram_reels') {
      setAspectRatio('9:16');
    } else if (p === 'youtube_video') {
      setAspectRatio('16:9');
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (lang === 'hi') {
      setVoice('hi-IN-MadhurNeural');
    } else {
      setVoice('en-US-ChristopherNeural');
    }
  };

  const handleCreateFromTrend = async () => {
    if (!selectedTrend) {
      setError('Please select a trending topic from the list');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const launchRes = await api.launchProjectFromTrend({
        topic_id: selectedTrend.id,
        category: selectedCategory,
        title: selectedTrend.title,
        suggested_hook: selectedTrend.suggested_hook,
        suggested_angle: selectedTrend.suggested_angle,
        platform,
        aspect_ratio: aspectRatio,
        target_duration: duration,
        language,
        voice,
        voice_style: voiceStyle,
        visual_style: visualStyle,
        caption_style: captionStyle
      });

      // Load full project details
      const fullProject = await api.getProject(launchRes.project_id);
      onProjectCreated(fullProject);
    } catch (err: any) {
      setError(err.message || 'Failed to create video from trend');
      setLoading(false);
    }
  };

  const handleScoreIdeaHook = async () => {
    const textToScore = ideaHook.trim() || topic.trim();
    if (!textToScore) {
      setError('Enter a topic or hook to score');
      return;
    }
    setScoringIdeaHook(true);
    try {
      const res = await api.scoreHook(textToScore);
      setIdeaHookScore(res);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to score hook');
    } finally {
      setScoringIdeaHook(false);
    }
  };

  const handleScoreScriptHook = async () => {
    const firstSentence = customScript.split(/[.!?\n]/)[0]?.trim();
    if (!firstSentence) {
      setError('Please type or paste script text first');
      return;
    }
    setScoringScriptHook(true);
    try {
      const res = await api.scoreHook(firstSentence);
      setScriptHookScore(res);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to score opening line');
    } finally {
      setScoringScriptHook(false);
    }
  };

  const handleIdeaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please provide a topic or idea for the video');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const topicPayload = ideaHook.trim() ? `${topic.trim()}. Hook: ${ideaHook.trim()}` : topic.trim();
      const newProj = await api.createProject({
        topic: topicPayload,
        title: topic.trim(),
        platform,
        aspect_ratio: aspectRatio,
        target_duration: duration,
        language,
        voice,
        voice_style: voiceStyle,
        visual_style: visualStyle,
        caption_style: captionStyle
      });
      onProjectCreated(newProj);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize project');
      setLoading(false);
    }
  };

  const handleScriptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customScript.trim()) {
      setError('Please paste or write your script narration');
      return;
    }
    const words = customScript.trim().split(/\s+/).length;
    if (words < 10) {
      setError('Script is too short (at least 10 words required for video production)');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const finalTitle = scriptTitle.trim() || 'Custom Script Production';
      const calculatedDuration = Math.max(15, Math.min(90, Math.round(words / 2.5)));
      const newProj = await api.createProject({
        title: finalTitle,
        topic: finalTitle,
        existing_script: customScript.trim(),
        platform,
        aspect_ratio: aspectRatio,
        target_duration: calculatedDuration,
        language,
        voice,
        voice_style: voiceStyle,
        visual_style: visualStyle,
        caption_style: captionStyle
      });
      onProjectCreated(newProj);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize project from script');
      setLoading(false);
    }
  };

  // Load Vox Themes and Arcs on mount
  useEffect(() => {
    async function loadVoxPresets() {
      try {
        const [tData, aData] = await Promise.all([api.getVoxThemes(), api.getVoxArcs()]);
        setVoxThemes(tData.themes || []);
        setVoxArcs(aData.arcs || []);
      } catch (e) {
        console.error('Failed to load Vox presets', e);
      }
    }
    loadVoxPresets();
  }, []);

  const handleDraftVoxProject = async () => {
    if (!voxTopic.trim()) {
      setError('Please provide a topic for the Vox Explainer');
      return;
    }
    setDraftingVox(true);
    setError(null);
    try {
      const res = await api.draftVoxProject({
        topic: voxTopic.trim(),
        theme_id: selectedVoxTheme,
        arc_id: selectedVoxArc,
        aspect_ratio: voxAspectRatio,
        existing_script: voxScript.trim() || undefined,
        target_duration: voxDuration
      });
      setVoxDraft(res);
      if (res.scenes && res.scenes.length > 0 && res.scenes[0].headline) {
        setVoxHeadline(res.scenes[0].headline);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to draft Vox Explainer project');
    } finally {
      setDraftingVox(false);
    }
  };

  const handleCreateVoxProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voxTopic.trim()) {
      setError('Please provide a topic for the Vox Explainer');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const title = voxDraft?.title || `The Vox Explainer: ${voxTopic.trim()}`;
      const newProj = await api.createProject({
        title,
        topic: voxTopic.trim(),
        video_mode: 'vox_explainer',
        vox_theme: selectedVoxTheme,
        vox_arc: selectedVoxArc,
        existing_script: voxScript.trim() || undefined,
        platform: voxAspectRatio === '16:9' ? 'youtube_video' : 'youtube_shorts',
        aspect_ratio: voxAspectRatio,
        target_duration: voxDuration,
        visual_style: 'vox_paper_collage',
        language,
        voice,
        voice_style: 'documentary'
      });
      onProjectCreated(newProj);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to initialize Vox Explainer project');
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '980px', margin: '0 auto', padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '20px', color: 'var(--primary-light)', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
            <Flame size={14} color="#f43f5e" />
            <span>AI Real-World Studio</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: 700 }}>
            Create New Video Production
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Select verified real-world trends, provide a topic/idea brief, or paste your pre-written script.
          </p>
        </div>

        {/* 3-Mode Toggle Tabs */}
        <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.4)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '4px' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setActiveMode('trends')}
            style={{
              background: activeMode === 'trends' ? 'var(--primary)' : 'transparent',
              color: activeMode === 'trends' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Flame size={14} color={activeMode === 'trends' ? '#fff' : '#f43f5e'} />
            <span>Trending Radar</span>
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setActiveMode('idea')}
            style={{
              background: activeMode === 'idea' ? 'var(--primary)' : 'transparent',
              color: activeMode === 'idea' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={14} color={activeMode === 'idea' ? '#fff' : '#6366f1'} />
            <span>Provide Idea</span>
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setActiveMode('script')}
            style={{
              background: activeMode === 'script' ? 'var(--primary)' : 'transparent',
              color: activeMode === 'script' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileText size={14} color={activeMode === 'script' ? '#fff' : '#10b981'} />
            <span>Provide Script</span>
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setActiveMode('vox')}
            style={{
              background: activeMode === 'vox' ? '#f59e0b' : 'transparent',
              color: activeMode === 'vox' ? '#000' : 'var(--text-muted)',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Scissors size={14} color={activeMode === 'vox' ? '#000' : '#f59e0b'} />
            <span>Vox Explainer</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#fb7185', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {activeMode === 'trends' ? (
        <div>
          {/* Domain Dropdown & Search Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} color="#6366f1" />
                <span>Select Domain / Category</span>
              </label>
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ fontSize: '15px', fontWeight: 600, padding: '12px 16px' }}
              >
                <option value="all">🔥 Global Trend Radar (All Domains)</option>
                <option value="ai">🤖 AI & Autonomous Agents</option>
                <option value="new_technology">🚀 New Technology & Engineering</option>
                <option value="finance">📈 Finance & Macro Economy</option>
                <option value="crypto">🪙 Crypto & Prediction Markets</option>
                <option value="sports">⚽ Sports & Athletics</option>
                <option value="politics">🏛️ Politics & Elections</option>
                <option value="war">⚔️ Geopolitics & Military History</option>
                <option value="literature">📜 Literature & Philosophy</option>
                <option value="books">📚 Books & Bestsellers</option>
                <option value="science">🔬 Science & Space Exploration</option>
              </select>
            </div>

            <form onSubmit={handleSearchSubmit} className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Search size={14} color="#06b6d4" />
                <span>Filter / Angle Inside Domain</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. quantum, three mile island, champions league, stoicism..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '0 16px' }}>
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Quick Category Chips */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
            {[
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
            ].map(chip => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedCategory(chip.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: selectedCategory === chip.id ? '1px solid var(--primary-light)' : '1px solid var(--border-color)',
                  background: selectedCategory === chip.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: selectedCategory === chip.id ? '#fff' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Top 5-6 Trending Topics Grid */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} color="#10b981" />
                <span>Top 5–6 Trending Topics (Ranked by Real Engagement)</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                {loadingTrends ? 'Fetching live signals...' : `${trendingTopics.length} verified topics`}
              </span>
            </div>

            {loadingTrends ? (
              <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
                <div style={{ color: 'var(--primary-light)', fontSize: '15px', fontWeight: 600 }}>
                  Scanning Reddit, Hacker News, Polymarket & YouTube...
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                {trendingTopics.map((trend, idx) => {
                  const isSelected = selectedTrend?.id === trend.id;
                  const momentumColor = 
                    trend.momentum === 'Rising' ? '#10b981' : 
                    trend.momentum === 'Peaking' ? '#f43f5e' : '#818cf8';

                  return (
                    <div
                      key={trend.id}
                      className={`glass-panel glass-panel-hover`}
                      onClick={() => handleSelectTrend(trend)}
                      style={{
                        padding: '18px',
                        cursor: 'pointer',
                        borderRadius: '14px',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)',
                        boxShadow: isSelected ? '0 0 20px rgba(99, 102, 241, 0.25)' : 'none',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        {/* Top Row: Rank & Momentum */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '6px', 
                              background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)', 
                              color: '#fff', 
                              fontSize: '12px', 
                              fontWeight: 700 
                            }}>
                              #{idx + 1}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: `${momentumColor}22`,
                              color: momentumColor,
                              fontSize: '11px',
                              fontWeight: 700
                            }}>
                              ● {trend.momentum}
                            </span>
                          </div>

                          {isSelected && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-light)', fontSize: '12px', fontWeight: 600 }}>
                              <CheckCircle2 size={16} color="#6366f1" />
                              <span>Selected</span>
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <h4 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '6px' }}>
                          {trend.title}
                        </h4>

                        {/* Summary */}
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '12px' }}>
                          {trend.summary}
                        </p>
                      </div>

                      <div>
                        {/* Metrics Badge */}
                        <div style={{ 
                          padding: '6px 10px', 
                          background: 'rgba(0, 0, 0, 0.35)', 
                          borderRadius: '8px', 
                          border: '1px solid var(--border-color)',
                          fontSize: '11px', 
                          color: 'var(--text-dim)', 
                          marginBottom: '10px' 
                        }}>
                          📊 <strong style={{ color: 'var(--text-main)' }}>{trend.key_metrics}</strong>
                        </div>

                        {/* Polymarket real-money badge if available */}
                        {trend.polymarket_odds && trend.polymarket_odds !== 'N/A' && (
                          <div style={{ 
                            padding: '4px 8px', 
                            background: 'rgba(16, 185, 129, 0.12)', 
                            borderRadius: '6px', 
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            fontSize: '11px', 
                            color: '#34d399', 
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <DollarSign size={12} />
                            <span>{trend.polymarket_odds}</span>
                          </div>
                        )}

                        {/* Sources pills */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {trend.sources.map(src => (
                            <span key={src} style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', color: 'var(--text-dim)' }}>
                              {src}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Trend Preview & Video Configuration */}
          {selectedTrend && (
            <div className="glass-panel" style={{ padding: '24px', background: 'rgba(17, 23, 38, 0.95)', border: '1px solid var(--border-glow)', borderRadius: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--primary-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    AI Video Script Angle & Recommended Hook
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px' }}>
                    {selectedTrend.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ padding: '4px 10px', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-light)', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                    9:16 Shorts
                  </span>
                  <span style={{ padding: '4px 10px', background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                    ~{duration}s Duration
                  </span>
                </div>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '10px', borderLeft: '4px solid var(--primary)', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px', fontWeight: 600 }}>PROVEN RETENTION HOOK:</div>
                <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#fff' }}>
                  "{selectedTrend.suggested_hook}"
                </div>
              </div>

              {/* Format & Voice Quick Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>Platform Format</label>
                  <select
                    className="form-select"
                    value={platform}
                    onChange={(e) => handlePlatformChange(e.target.value)}
                  >
                    <option value="youtube_shorts">YouTube Shorts (9:16)</option>
                    <option value="instagram_reels">Instagram Reels (9:16)</option>
                    <option value="youtube_video">YouTube Standard (16:9)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>Duration</label>
                  <select
                    className="form-select"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >
                    <option value={30}>30s (Viral Snackable)</option>
                    <option value={45}>45s (Story Pacing)</option>
                    <option value={60}>60s (Deep Dive)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>Narration Voice</label>
                  <select
                    className="form-select"
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                  >
                    <option value="en-US-ChristopherNeural">Christopher (Energetic Male)</option>
                    <option value="en-US-AriaNeural">Aria (Confident Female)</option>
                    <option value="en-US-GuyNeural">Guy (Documentary Male)</option>
                    <option value="en-US-EricNeural">Eric (Authoritative Male)</option>
                    <option value="hi-IN-MadhurNeural">Madhur (Hindi Warm Male)</option>
                    <option value="hi-IN-SwaraNeural">Swara (Hindi Expressive Female)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Narration Style</span>
                  </label>
                  <select
                    className="form-select"
                    value={voiceStyle}
                    onChange={(e) => setVoiceStyle(e.target.value)}
                    style={{ borderColor: 'var(--primary-light)' }}
                  >
                    <option value="energetic">⚡ Energetic & Viral (+12% Speed)</option>
                    <option value="documentary">🎙️ Documentary & Authoritative</option>
                    <option value="dramatic">🎭 Dramatic & Storyteller (-6% Speed)</option>
                    <option value="urgent">🚨 Urgent & Breaking News (+16% Speed)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleCreateFromTrend} 
              disabled={loading || !selectedTrend} 
              style={{ minWidth: '260px', padding: '12px 24px', fontSize: '15px' }}
            >
              {loading ? (
                <span>Writing Script & Setting Pipeline...</span>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Proceed with Video Creation</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      ) : activeMode === 'idea' ? (
        /* Provide Idea Mode */
        <form onSubmit={handleIdeaSubmit}>
          <div className="form-group">
            <label className="form-label">Video Topic, Brief, or Angle</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="e.g. 3 Psychological Secrets Advertisers Use to Make You Buy, or The Untold Story of Quantum Computing"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Custom Opening Hook Line (Optional)
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleScoreIdeaHook}
                disabled={scoringIdeaHook || (!ideaHook.trim() && !topic.trim())}
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                <Wand2 size={12} />
                <span>{scoringIdeaHook ? 'Evaluating...' : 'Score Hook (21 Formulas)'}</span>
              </button>
            </div>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. If you start a business today, 90% fail before month six. Here is what the top 10% do."
              value={ideaHook}
              onChange={(e) => setIdeaHook(e.target.value)}
              disabled={loading}
            />
            
            {ideaHookScore && (
              <div style={{ marginTop: '10px', padding: '12px 16px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontWeight: 700, 
                      color: ideaHookScore.band === 'STRONG' ? '#10b981' : ideaHookScore.band === 'WORKABLE' ? '#f59e0b' : '#f43f5e',
                      fontSize: '15px'
                    }}>
                      Hook Score: {ideaHookScore.verdict}/100 [{ideaHookScore.band}]
                    </span>
                    <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                      Formula: <strong>{ideaHookScore.formula}</strong>
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    {ideaHookScore.word_count} spoken words
                  </span>
                </div>
                {ideaHookScore.weakest_fix && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    💡 <strong>Weakest Link ({ideaHookScore.weakest_property}):</strong> {ideaHookScore.weakest_fix}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Target Platform & Aspect Ratio</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              <div
                className={`glass-panel glass-panel-hover ${platform === 'youtube_shorts' ? 'selected' : ''}`}
                style={{
                  padding: '16px', cursor: 'pointer', textAlign: 'center',
                  borderColor: platform === 'youtube_shorts' ? 'var(--primary)' : 'var(--border-color)',
                  background: platform === 'youtube_shorts' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)'
                }}
                onClick={() => handlePlatformChange('youtube_shorts')}
              >
                <Video size={24} color="#6366f1" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 600, fontSize: '14px' }}>YouTube Shorts</div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>9:16 Vertical (1080×1920)</div>
              </div>

              <div
                className={`glass-panel glass-panel-hover ${platform === 'instagram_reels' ? 'selected' : ''}`}
                style={{
                  padding: '16px', cursor: 'pointer', textAlign: 'center',
                  borderColor: platform === 'instagram_reels' ? 'var(--accent-rose)' : 'var(--border-color)',
                  background: platform === 'instagram_reels' ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-card)'
                }}
                onClick={() => handlePlatformChange('instagram_reels')}
              >
                <Video size={24} color="#f43f5e" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Instagram Reels</div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>9:16 Vertical (1080×1920)</div>
              </div>

              <div
                className={`glass-panel glass-panel-hover ${platform === 'youtube_video' ? 'selected' : ''}`}
                style={{
                  padding: '16px', cursor: 'pointer', textAlign: 'center',
                  borderColor: platform === 'youtube_video' ? 'var(--accent-cyan)' : 'var(--border-color)',
                  background: platform === 'youtube_video' ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-card)'
                }}
                onClick={() => handlePlatformChange('youtube_video')}
              >
                <Video size={24} color="#06b6d4" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 600, fontSize: '14px' }}>YouTube Standard</div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>16:9 Landscape (1920×1080)</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">
                <Clock size={15} style={{ display: 'inline', marginRight: '6px' }} />
                Target Duration: <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>{duration} seconds</span>
              </label>
              <input
                type="range"
                min={15}
                max={90}
                step={15}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Mic size={15} style={{ display: 'inline', marginRight: '6px' }} />
                Language, Voice & Narration Style
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <select
                  className="form-select"
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                >
                  <option value="en">English (US)</option>
                  <option value="hi">Hindi (हिंदी)</option>
                </select>
                <select
                  className="form-select"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                >
                  <option value="en-US-ChristopherNeural">Christopher</option>
                  <option value="en-US-AriaNeural">Aria</option>
                  <option value="en-US-GuyNeural">Guy</option>
                  <option value="en-US-EricNeural">Eric</option>
                  <option value="hi-IN-MadhurNeural">Madhur</option>
                  <option value="hi-IN-SwaraNeural">Swara</option>
                </select>
                <select
                  className="form-select"
                  value={voiceStyle}
                  onChange={(e) => setVoiceStyle(e.target.value)}
                >
                  <option value="energetic">⚡ Energetic</option>
                  <option value="documentary">🎙️ Documentary</option>
                  <option value="dramatic">🎭 Dramatic</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '28px' }}>
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '220px' }}>
              {loading ? (
                <span>Writing Script & Setting Pipeline...</span>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Proceed with Idea</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      ) : activeMode === 'script' ? (
        /* Provide Script Mode */
        <form onSubmit={handleScriptSubmit}>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Video Title / Headline
              </label>
              <span style={{ 
                fontSize: '11px', 
                color: scriptTitle.length <= 40 ? '#10b981' : scriptTitle.length <= 60 ? '#f59e0b' : '#f43f5e',
                fontWeight: 600
              }}>
                {scriptTitle.length}/60 chars {scriptTitle.length <= 40 ? '(Mobile Feed Safe)' : scriptTitle.length <= 60 ? '(Desktop Search Safe)' : '(Truncated on Search)'}
              </span>
            </div>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 3 Mistakes Draining Your Income (And How to Fix Them)"
              value={scriptTitle}
              onChange={(e) => setScriptTitle(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Paste or Write Your Script Narration
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {customScript.trim() ? customScript.trim().split(/\s+/).length : 0} words • ~{Math.round((customScript.trim() ? customScript.trim().split(/\s+/).length : 0) / 2.5)}s duration
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleScoreScriptHook}
                  disabled={scoringScriptHook || !customScript.trim()}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  <Wand2 size={12} />
                  <span>{scoringScriptHook ? 'Analyzing...' : 'Audit Opening Line'}</span>
                </button>
              </div>
            </div>
            <textarea
              className="form-textarea"
              rows={8}
              placeholder={`Write or paste your narration here. Tip: Separate sections with new lines to automatically generate scene breaks!

Example:
If you examine most businesses, 90% of founders fail before their first profit. Here is what the top 10% do differently.

The first mistake is focusing on branding before product market fit. You must validate demand before spending capital.

When you master this single feedback loop, your momentum compounds automatically.

Follow for daily business breakdowns.`}
              value={customScript}
              onChange={(e) => setCustomScript(e.target.value)}
              disabled={loading}
              style={{ lineHeight: 1.6, fontFamily: 'monospace', fontSize: '13px' }}
              required
            />

            {scriptHookScore && (
              <div style={{ marginTop: '10px', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontWeight: 700, 
                      color: scriptHookScore.band === 'STRONG' ? '#10b981' : scriptHookScore.band === 'WORKABLE' ? '#f59e0b' : '#f43f5e',
                      fontSize: '15px'
                    }}>
                      Opening Hook Score: {scriptHookScore.verdict}/100 [{scriptHookScore.band}]
                    </span>
                    <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                      Formula: <strong>{scriptHookScore.formula}</strong>
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    Line 1: "{customScript.split(/[.!?\n]/)[0]?.trim().slice(0, 45)}..."
                  </span>
                </div>
                {scriptHookScore.weakest_fix && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    💡 <strong>Weakest Link ({scriptHookScore.weakest_property}):</strong> {scriptHookScore.weakest_fix}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Target Platform & Aspect Ratio</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              <div
                className={`glass-panel glass-panel-hover ${platform === 'youtube_shorts' ? 'selected' : ''}`}
                style={{
                  padding: '16px', cursor: 'pointer', textAlign: 'center',
                  borderColor: platform === 'youtube_shorts' ? 'var(--primary)' : 'var(--border-color)',
                  background: platform === 'youtube_shorts' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)'
                }}
                onClick={() => handlePlatformChange('youtube_shorts')}
              >
                <Video size={24} color="#6366f1" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 600, fontSize: '14px' }}>YouTube Shorts</div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>9:16 Vertical (1080×1920)</div>
              </div>

              <div
                className={`glass-panel glass-panel-hover ${platform === 'instagram_reels' ? 'selected' : ''}`}
                style={{
                  padding: '16px', cursor: 'pointer', textAlign: 'center',
                  borderColor: platform === 'instagram_reels' ? 'var(--accent-rose)' : 'var(--border-color)',
                  background: platform === 'instagram_reels' ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-card)'
                }}
                onClick={() => handlePlatformChange('instagram_reels')}
              >
                <Video size={24} color="#f43f5e" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Instagram Reels</div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>9:16 Vertical (1080×1920)</div>
              </div>

              <div
                className={`glass-panel glass-panel-hover ${platform === 'youtube_video' ? 'selected' : ''}`}
                style={{
                  padding: '16px', cursor: 'pointer', textAlign: 'center',
                  borderColor: platform === 'youtube_video' ? 'var(--accent-cyan)' : 'var(--border-color)',
                  background: platform === 'youtube_video' ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-card)'
                }}
                onClick={() => handlePlatformChange('youtube_video')}
              >
                <Video size={24} color="#06b6d4" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 600, fontSize: '14px' }}>YouTube Standard</div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>16:9 Landscape (1920×1080)</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">
                <Palette size={15} style={{ display: 'inline', marginRight: '6px' }} />
                Visual Style
              </label>
              <select
                className="form-select"
                value={visualStyle}
                onChange={(e) => setVisualStyle(e.target.value)}
              >
                <option value="cinematic">Cinematic Realism (Recommended)</option>
                <option value="photorealistic">Photorealistic Stock Footage</option>
                <option value="minimalist">Minimalist Modern Aesthetic</option>
                <option value="cyberpunk">Cyberpunk Neon High Tech</option>
                <option value="documentary">Archive & Documentary</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Mic size={15} style={{ display: 'inline', marginRight: '6px' }} />
                Language, Voice & Narration Style
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <select
                  className="form-select"
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                >
                  <option value="en">English (US)</option>
                  <option value="hi">Hindi (हिंदी)</option>
                </select>
                <select
                  className="form-select"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                >
                  <option value="en-US-ChristopherNeural">Christopher</option>
                  <option value="en-US-AriaNeural">Aria</option>
                  <option value="en-US-GuyNeural">Guy</option>
                  <option value="en-US-EricNeural">Eric</option>
                  <option value="hi-IN-MadhurNeural">Madhur</option>
                  <option value="hi-IN-SwaraNeural">Swara</option>
                </select>
                <select
                  className="form-select"
                  value={voiceStyle}
                  onChange={(e) => setVoiceStyle(e.target.value)}
                >
                  <option value="energetic">⚡ Energetic</option>
                  <option value="documentary">🎙️ Documentary</option>
                  <option value="dramatic">🎭 Dramatic</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '28px' }}>
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '220px' }}>
              {loading ? (
                <span>Parsing Script & Generating Scenes...</span>
              ) : (
                <>
                  <FileText size={16} />
                  <span>Proceed with Custom Script</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Vox Explainer Paper-Collage Mode */
        <form onSubmit={handleCreateVoxProject}>
          {/* Header intro */}
          <div style={{ padding: '16px 20px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Scissors size={18} color="#f59e0b" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#fbbf24' }}>
                Vox-Style Paper-Collage Explainer Studio
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Inspired by <strong>vox-director</strong>. Layered hand-cut paper cut-outs, deckled edges, masking tape, Ben-Day halftone dots, and kinetic editorial typography with deterministic 60fps spring motion.
            </p>
          </div>

          {/* Topic & Inspiration */}
          <div className="form-group">
            <label className="form-label">
              Explainer Topic / Question
            </label>
            <input
              type="text"
              className="form-input"
              value={voxTopic}
              onChange={(e) => setVoxTopic(e.target.value)}
              placeholder="e.g. Why Free Shipping is an Illusion, The 1929 Crash Explained, How Semiconductors Run the World"
              required
              style={{ fontSize: '15px', padding: '12px 16px' }}
            />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', alignSelf: 'center', fontWeight: 600 }}>Try Topic:</span>
              {[
                "The Hidden Physics of Aerodynamics",
                "Why Housing Became Unaffordable",
                "The Paradox of Choice",
                "The Secret Architecture of Venice",
                "How Inflation Steals Wealth Quietly"
              ].map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setVoxTopic(prompt)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Narrative Beat Arc Selector */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={15} color="#f59e0b" />
              <span>Narrative Story Arc (Pacing & Retention Structure)</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {(voxArcs.length > 0 ? voxArcs : [
                { id: 'how_it_works', name: 'How It Works (System Explainer)', description: 'Step-by-step mechanism breakdown.' },
                { id: 'timeline', name: 'Timeline & Evolution', description: 'Chronological history from origin to modern turning point.' },
                { id: 'pas', name: 'Problem - Agitate - Solve', description: 'High-urgency problem exposure before revealing the breakthrough.' },
                { id: 'myth_buster', name: 'Myth Buster (Fallacy Breakdown)', description: 'Corrects popular misconceptions with hard evidence.' },
                { id: 'man_in_hole', name: 'Man In Hole (Crisis to Comeback)', description: 'Peak success -> sudden collapse -> the survival pivot.' },
                { id: 'listicle', name: 'Countdown & Power Rankings', description: 'Numbered sequence of asymmetric factors or rules.' }
              ]).map(arc => {
                const isSelected = selectedVoxArc === arc.id;
                return (
                  <div
                    key={arc.id}
                    onClick={() => setSelectedVoxArc(arc.id)}
                    className="glass-panel glass-panel-hover"
                    style={{
                      padding: '12px 14px',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #f59e0b' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-card)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#fbbf24' : 'var(--text-main)' }}>
                        {arc.name}
                      </span>
                      {isSelected && <CheckCircle2 size={14} color="#f59e0b" />}
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      {arc.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual Theme Presets Grid */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Palette size={15} color="#f59e0b" />
              <span>Collage Visual Theme Preset (9 Curated Styles)</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {(voxThemes.length > 0 ? voxThemes : [
                { id: 'swiss-modern', name: 'Swiss Modern / Bauhaus', palette: 'white, red, black, slate', bg_colors: ['#FFFFFF', '#F4F4F6', '#18181B'], accent_color: '#E11D48', type_style: 'Helvetica grotesque' },
                { id: 'punk-zine', name: 'Punk Zine / Ransom Note', palette: 'black & white, neon yellow, electric pink', bg_colors: ['#111111', '#FAFAFA', '#FFE600'], accent_color: '#FFE600', type_style: 'Ransom-note mismatched letters' },
                { id: 'american-retro', name: 'American Retro / 1950s Ad', palette: 'brick red, mustard, teal, cream', bg_colors: ['#F5F0E6', '#C0392B', '#D4AC0D'], accent_color: '#C0392B', type_style: 'Bold wood-type slab' },
                { id: 'newsprint-editorial', name: 'Newsprint Editorial / Investigative', palette: 'cream, crimson, sepia, charcoal', bg_colors: ['#EDE6D6', '#2C3E50', '#922B21'], accent_color: '#922B21', type_style: 'Broadsheet condensed headlines' },
                { id: '70s-groovy', name: '70s Groovy / Risograph', palette: 'mustard, rust, avocado, cream', bg_colors: ['#E89A3C', '#B84A29', '#5F7444'], accent_color: '#B84A29', type_style: 'Bulbous 70s display serif' },
                { id: 'soviet-constructivist', name: 'Constructivist Agitprop', palette: 'red, black, kraft cream', bg_colors: ['#D32F2F', '#1A1A1A', '#F5F2EB'], accent_color: '#D32F2F', type_style: '15-degree diagonal gothic' },
                { id: 'atomic-age', name: 'Atomic Age / Sci-Fi', palette: 'atomic teal, retro coral, space cream', bg_colors: ['#1ABC9C', '#E67E22', '#ECF0F1'], accent_color: '#E67E22', type_style: 'Atomic script + futuristic caps' },
                { id: 'chinese-ink', name: 'Oriental Ink & Dunhuang Mural', palette: 'ink black, vermilion cinnabar, gold, rice-paper', bg_colors: ['#F3EFE0', '#1C1C1C', '#9E2A2B'], accent_color: '#9E2A2B', type_style: 'Calligraphic brush + vermilion seal' },
                { id: 'documentary-photo', name: 'Archival Photo Documentary', palette: 'sepia monochrome, deep navy, slate gray', bg_colors: ['#FAF8F5', '#1E272E', '#34495E'], accent_color: '#1E272E', type_style: 'Catalog stamp typewriter type' }
              ]).map(theme => {
                const isSelected = selectedVoxTheme === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => setSelectedVoxTheme(theme.id)}
                    className="glass-panel glass-panel-hover"
                    style={{
                      padding: '12px 14px',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      border: isSelected ? `2px solid ${theme.accent_color || '#f59e0b'}` : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'var(--bg-card)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#fff' : 'var(--text-main)' }}>
                        {theme.name}
                      </span>
                      {isSelected && <CheckCircle2 size={14} color={theme.accent_color || '#f59e0b'} />}
                    </div>

                    {/* Palette Dots */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                      {theme.bg_colors.slice(0, 4).map((c, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            background: c,
                            border: '1px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                          }}
                        />
                      ))}
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginLeft: '4px' }}>
                        {theme.palette.split('—')[0]}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      {theme.type_style}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Tactile Paper Card Mockup Preview */}
          {(() => {
            const currentTheme = voxThemes.find(t => t.id === selectedVoxTheme) || {
              bg_colors: ['#F5F0E6'],
              accent_color: '#E11D48',
              font_heading: 'sans-serif',
              tape_color: 'rgba(230, 230, 230, 0.75)',
              mood: 'tactile editorial'
            };
            const previewBg = currentTheme.bg_colors ? currentTheme.bg_colors[0] : '#F5F0E6';
            const headlinePreview = voxHeadline || (voxTopic ? voxTopic.toUpperCase().slice(0, 20) : 'THE HIDDEN SYSTEM');

            return (
              <div style={{ margin: '24px 0', padding: '20px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Live Paper-Collage Card Simulation
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleDraftVoxProject}
                    disabled={draftingVox}
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                  >
                    {draftingVox ? 'Drafting Storyboard...' : '⚡ Generate 6-Beat Storyboard Preview'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div
                    style={{
                      width: voxAspectRatio === '16:9' ? '460px' : '260px',
                      height: voxAspectRatio === '16:9' ? '258px' : '440px',
                      background: previewBg,
                      borderRadius: '4px',
                      boxShadow: '8px 12px 0px rgba(0,0,0,0.4), 0 20px 25px -5px rgba(0,0,0,0.5)',
                      position: 'relative',
                      padding: '24px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transform: 'rotate(-1.2deg)',
                      transition: 'all 0.3s ease',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Washi Tape Accent Top Right */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '18px',
                        width: '70px',
                        height: '24px',
                        background: currentTheme.tape_color || 'rgba(230, 230, 230, 0.75)',
                        transform: 'rotate(5deg)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        borderLeft: '1px dashed rgba(0,0,0,0.15)',
                        borderRight: '1px dashed rgba(0,0,0,0.15)'
                      }}
                    />

                    {/* Washi Tape Accent Bottom Left */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-6px',
                        left: '18px',
                        width: '60px',
                        height: '22px',
                        background: currentTheme.tape_color || 'rgba(230, 230, 230, 0.75)',
                        transform: 'rotate(-4deg)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}
                    />

                    {/* Stamped Number Tag */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#333', background: 'rgba(0,0,0,0.08)', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.1em' }}>
                        BEAT 01 / HOOK
                      </span>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(12deg)' }}>
                        <span style={{ fontSize: '8px', fontWeight: 900, color: '#b91c1c' }}>VOX</span>
                      </div>
                    </div>

                    {/* Torn Headline Banner */}
                    <div
                      style={{
                        background: currentTheme.accent_color || '#E11D48',
                        color: '#fff',
                        padding: '10px 14px',
                        fontWeight: 900,
                        fontSize: voxAspectRatio === '16:9' ? '20px' : '17px',
                        letterSpacing: '0.02em',
                        boxShadow: '3px 4px 0px rgba(0,0,0,0.3)',
                        transform: 'rotate(1.5deg)',
                        textAlign: 'center',
                        textTransform: 'uppercase'
                      }}
                    >
                      {headlinePreview}
                    </div>

                    {/* Narration Preview strip */}
                    <div style={{ background: 'rgba(255,255,255,0.92)', padding: '10px 12px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.15)', borderLeft: '4px solid #111' }}>
                      <p style={{ margin: 0, fontSize: '11px', color: '#111', fontWeight: 500, lineHeight: 1.4 }}>
                        {voxDraft?.scenes?.[0]?.narration || (voxTopic ? `Almost everyone completely misinterprets how ${voxTopic} actually works...` : 'Almost everyone completely misinterprets how the mechanism actually works...')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Storyboard Beats breakdown if generated */}
                {voxDraft?.scenes && (
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', marginBottom: '10px' }}>
                      📋 Storyboard Sequence ({voxDraft.scenes.length} Beats, {voxDraft.total_estimated_duration}s total)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                      {voxDraft.scenes.map((s: any) => (
                        <div key={s.scene_number} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>
                            <span>#{s.scene_number} {s.beat_name}</span>
                            <span>{s.duration}s</span>
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                            "{s.headline}"
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                            {s.narration}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Aspect Ratio & Production Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                <Video size={15} style={{ display: 'inline', marginRight: '6px' }} />
                Aspect Ratio Format
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  className={`glass-panel glass-panel-hover ${voxAspectRatio === '9:16' ? 'selected' : ''}`}
                  style={{
                    padding: '12px', cursor: 'pointer', textAlign: 'center',
                    borderColor: voxAspectRatio === '9:16' ? '#f59e0b' : 'var(--border-color)',
                    background: voxAspectRatio === '9:16' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-card)'
                  }}
                  onClick={() => setVoxAspectRatio('9:16')}
                >
                  <div style={{ fontWeight: 700, fontSize: '13px', color: voxAspectRatio === '9:16' ? '#fbbf24' : '#fff' }}>9:16 Vertical Short</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>YouTube Shorts / Reels</div>
                </div>

                <div
                  className={`glass-panel glass-panel-hover ${voxAspectRatio === '16:9' ? 'selected' : ''}`}
                  style={{
                    padding: '12px', cursor: 'pointer', textAlign: 'center',
                    borderColor: voxAspectRatio === '16:9' ? '#f59e0b' : 'var(--border-color)',
                    background: voxAspectRatio === '16:9' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-card)'
                  }}
                  onClick={() => setVoxAspectRatio('16:9')}
                >
                  <div style={{ fontWeight: 700, fontSize: '13px', color: voxAspectRatio === '16:9' ? '#fbbf24' : '#fff' }}>16:9 Landscape</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>Full YouTube Explainer</div>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                <Clock size={15} style={{ display: 'inline', marginRight: '6px' }} />
                Target Duration: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{voxDuration} seconds</span>
              </label>
              <input
                type="range"
                min={30}
                max={90}
                step={15}
                value={voxDuration}
                onChange={(e) => setVoxDuration(Number(e.target.value))}
                className="form-range"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                <span>30s (Punchy)</span>
                <span>45s (Standard)</span>
                <span>60s (In-Depth)</span>
                <span>90s (Masterclass)</span>
              </div>
            </div>
          </div>

          {/* Optional Pre-written script */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Optional: Custom Script or Core Points</span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Leave blank to auto-synthesize from Narrative Arc</span>
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              value={voxScript}
              onChange={(e) => setVoxScript(e.target.value)}
              placeholder="If you have an existing script or specific facts, paste them here. The Vox engine will map them into paper scenes verbatim without rewriting."
              style={{ fontSize: '13px', lineHeight: 1.5 }}
            />
          </div>

          {/* Submit bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '28px' }}>
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '240px', background: '#f59e0b', color: '#000', borderColor: '#f59e0b', fontWeight: 700 }}>
              {loading ? (
                <span>Generating Paper-Collage Scenes...</span>
              ) : (
                <>
                  <Scissors size={16} />
                  <span>Create Vox Explainer Project</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
