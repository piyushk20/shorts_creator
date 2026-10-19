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
  DollarSign
} from 'lucide-react';
import { api, Project, TrendingCategory, TrendingTopic } from '../services/api';

interface CreateWizardProps {
  onProjectCreated: (project: Project) => void;
  onCancel: () => void;
}

export const CreateWizard: React.FC<CreateWizardProps> = ({ onProjectCreated, onCancel }) => {
  // Mode: 'trends' | 'custom'
  const [activeMode, setActiveMode] = useState<'trends' | 'custom'>('trends');

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

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please provide a topic or idea for the video');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const newProj = await api.createProject({
        topic,
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

  return (
    <div className="glass-panel" style={{ maxWidth: '980px', margin: '0 auto', padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '20px', color: 'var(--primary-light)', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
            <Flame size={14} color="#f43f5e" />
            <span>AI Real-World Trend Radar & Studio</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: 700 }}>
            Create New AI Video Production
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Choose a verified trending topic backed by real metrics, or enter a custom creative brief.
          </p>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.4)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setActiveMode('trends')}
            style={{
              background: activeMode === 'trends' ? 'var(--primary)' : 'transparent',
              color: activeMode === 'trends' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              padding: '8px 16px',
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
            onClick={() => setActiveMode('custom')}
            style={{
              background: activeMode === 'custom' ? 'var(--primary)' : 'transparent',
              color: activeMode === 'custom' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Custom Idea</span>
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
      ) : (
        /* Custom Idea Mode */
        <form onSubmit={handleCustomSubmit}>
          <div className="form-group">
            <label className="form-label">Video Topic, Brief, or Idea</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="e.g. 3 Psychological Secrets Advertisers Use to Make You Buy, or The Untold Story of Quantum Computing"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={loading}
            />
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
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '180px' }}>
              {loading ? (
                <span>Writing Script & Scenes...</span>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Video Plan</span>
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
