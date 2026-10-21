export interface Scene {
  scene_id: string;
  order: number;
  role: string;
  narration: string;
  estimated_duration_seconds: number;
  actual_duration_seconds?: number;
  visual_description: string;
  search_queries: string[];
  on_screen_text?: string;
  selected_asset_id?: string;
  caption_style?: string;
  caption_tokens?: { word: string; start: number; end: number }[];
  review_status?: string;
}

export interface Project {
  id: string;
  title: string;
  topic?: string;
  platform: string;
  aspect_ratio: string;
  width: number;
  height: number;
  fps: number;
  target_duration: number;
  language: string;
  voice: string;
  voice_style: string;
  visual_style: string;
  caption_style: string;
  status: string;
  created_at: string;
  updated_at: string;
  scenes_count?: number;
  scenes?: Scene[];
  recommended_hook?: string;
  hook_options?: string[];
  full_script?: string;
  is_script_approved?: boolean;
  latest_job?: RenderJob;
}

export interface AssetCandidate {
  id: string;
  provider: string;
  provider_asset_id: string;
  source_url: string;
  preview_url?: string;
  download_url?: string;
  creator?: string;
  width?: number;
  height?: number;
  duration?: number;
  orientation: string;
  license_type: string;
  rights_status: string;
  relevance_score: number;
  score_breakdown: Record<string, number>;
}

export interface RenderJob {
  id: string;
  project_id: string;
  renderer: string;
  status: string;
  progress: number;
  current_stage: string;
  output_mp4_path?: string;
  thumbnail_path?: string;
  zip_package?: string;
  error_message?: string;
  qa_report?: {
    job_id: string;
    passed: boolean;
    duration_match: boolean;
    audio_detected: boolean;
    resolution_match: boolean;
    safe_margins_pass: boolean;
  };
}

export interface ProjectOutputFile {
  name: string;
  size_bytes: number;
  size_formatted: string;
  type: 'video' | 'thumbnail' | 'subtitles' | 'archive' | 'metadata' | 'file';
  download_url: string;
  static_url: string;
  modified_at: string;
}

export interface ProjectOutputInfo {
  project_id: string;
  project_title: string;
  output_directory: string;
  exists: boolean;
  has_final_video: boolean;
  primary_video_name?: string;
  primary_video_size?: string;
  video_download_url: string;
  zip_download_url: string;
  files: ProjectOutputFile[];
}

export const api = {
  async getProjects(): Promise<Project[]> {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async getProject(id: string): Promise<Project> {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) throw new Error('Failed to fetch project details');
    return res.json();
  },

  async createProject(data: any): Promise<Project> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async updateScript(id: string, data: any): Promise<any> {
    const res = await fetch(`/api/projects/${id}/script`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update script');
    return res.json();
  },

  async getBRollCandidates(projectId: string, sceneId: string, query?: string): Promise<AssetCandidate[]> {
    const url = query 
      ? `/api/projects/${projectId}/broll/${sceneId}?query=${encodeURIComponent(query)}`
      : `/api/projects/${projectId}/broll/${sceneId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch B-roll candidates');
    return res.json();
  },

  async selectSceneAsset(projectId: string, sceneId: string, assetId: string, downloadUrl?: string): Promise<any> {
    const res = await fetch(`/api/projects/${projectId}/scenes/${sceneId}/asset`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: assetId, download_url: downloadUrl }),
    });
    if (!res.ok) throw new Error('Failed to select asset');
    return res.json();
  },

  async getBGMTracks(): Promise<{ id: string; name: string; path: string }[]> {
    const res = await fetch('/api/audio/bgm');
    if (!res.ok) return [];
    return res.json();
  },

  async getVoiceStyles(): Promise<{ id: string; name: string; rate: string; pitch: string; description: string }[]> {
    const res = await fetch('/api/audio/voice-styles');
    if (!res.ok) return [];
    return res.json();
  },

  async startRender(data: { 
    project_id: string; 
    renderer: string; 
    voice?: string;
    voice_style?: string;
    add_background_music: boolean; 
    bgm_track?: string; 
    burn_subtitles: boolean; 
    caption_position?: string; 
  }): Promise<RenderJob> {
    const res = await fetch(`/api/projects/${data.project_id}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to start render');
    return res.json();
  },

  async getJobStatus(jobId: string): Promise<RenderJob> {
    const res = await fetch(`/api/jobs/${jobId}`);
    if (!res.ok) throw new Error('Failed to fetch job status');
    return res.json();
  },

  async getSettings(): Promise<any> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async getTrendingCategories(): Promise<TrendingCategory[]> {
    const res = await fetch('/api/trends/categories');
    if (!res.ok) throw new Error('Failed to fetch trending categories');
    return res.json();
  },

  async discoverTrends(category: string = 'all', query?: string, refresh: boolean = true): Promise<{ category: string; query?: string; count: number; topics: TrendingTopic[] }> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (query) params.append('query', query);
    if (refresh) params.append('refresh', 'true');
    const res = await fetch(`/api/trends/discover?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to discover trending topics');
    return res.json();
  },

  async launchProjectFromTrend(payload: any): Promise<any> {
    const res = await fetch('/api/trends/launch-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to launch project from trend');
    return res.json();
  },

  async getProjectOutputInfo(projectId: string): Promise<ProjectOutputInfo> {
    const res = await fetch(`/api/projects/${projectId}/output`);
    if (!res.ok) throw new Error('Failed to fetch project output info');
    return res.json();
  },

  async openProjectFolder(projectId: string): Promise<{ success: boolean; path: string; error?: string }> {
    const res = await fetch(`/api/projects/${projectId}/open-folder`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to open project folder');
    return res.json();
  },

  async scoreHook(hook: string): Promise<any> {
    const res = await fetch('/api/tools/hook-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hook }),
    });
    if (!res.ok) throw new Error('Failed to score hook');
    return res.json();
  },

  async lintPackage(title: string, thumbnailText?: string): Promise<any> {
    const res = await fetch('/api/tools/package-lint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, thumbnail_text: thumbnailText }),
    });
    if (!res.ok) throw new Error('Failed to lint package');
    return res.json();
  },

  async getSocialBranding(): Promise<any> {
    const res = await fetch('/api/tools/social-branding');
    if (!res.ok) throw new Error('Failed to fetch social branding settings');
    return res.json();
  },

  async updateSocialBranding(payload: any): Promise<any> {
    const res = await fetch('/api/tools/social-branding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update social branding');
    return res.json();
  },

  async getVoxThemes(): Promise<{ themes: VoxTheme[] }> {
    const res = await fetch('/api/vox/themes');
    if (!res.ok) throw new Error('Failed to fetch Vox themes');
    return res.json();
  },

  async getVoxArcs(): Promise<{ arcs: VoxArc[] }> {
    const res = await fetch('/api/vox/arcs');
    if (!res.ok) throw new Error('Failed to fetch Vox arcs');
    return res.json();
  },

  async draftVoxProject(params: {
    topic: string;
    theme_id?: string;
    arc_id?: string;
    aspect_ratio?: string;
    existing_script?: string;
    target_duration?: number;
  }): Promise<any> {
    const res = await fetch('/api/vox/draft-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to draft Vox project');
    return res.json();
  },

  async previewVoxPrompt(scene_description: string, headline_text: string, theme_id?: string, aspect_ratio?: string): Promise<any> {
    const res = await fetch('/api/vox/preview-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene_description, headline_text, theme_id, aspect_ratio }),
    });
    if (!res.ok) throw new Error('Failed to preview Vox prompt');
    return res.json();
  },

  async getMediaSources(): Promise<any> {
    const res = await fetch('/api/media/sources');
    if (!res.ok) throw new Error('Failed to fetch media sources');
    return res.json();
  },

  async searchPublicMedia(query: string, provider: string = 'all', mediaType: string = 'all', limit: number = 6): Promise<any> {
    const params = new URLSearchParams({ query, provider, media_type: mediaType, limit: limit.toString() });
    const res = await fetch(`/api/media/search-public?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to search public media');
    return res.json();
  },

  async generateChartGraphic(payload: {
    chart_type?: string;
    title?: string;
    labels?: string[];
    datasets?: any[];
    theme?: string;
    width?: number;
    height?: number;
  }): Promise<any> {
    const res = await fetch('/api/media/chart-graphic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to generate chart graphic');
    return res.json();
  },

  getVectorIconUrl(name: string, collection: string = 'lucide'): string {
    return `/api/media/icon?name=${encodeURIComponent(name)}&collection=${encodeURIComponent(collection)}`;
  }
};

export interface TrendingCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export interface TrendingTopic {
  id: string;
  title: string;
  category: string;
  momentum: 'Rising' | 'Peaking' | 'Sustained';
  summary: string;
  key_metrics: string;
  sources: string[];
  polymarket_odds?: string;
  confidence_score: number;
  suggested_hook: string;
  suggested_angle: string;
  target_duration: number;
  aspect_ratio: string;
  platform: string;
}

export interface VoxTheme {
  id: string;
  name: string;
  idiom: string;
  palette: string;
  bg_colors: string[];
  accent_color: string;
  secondary_color: string;
  font_family: string;
  font_heading: string;
  type_style: string;
  finish: string;
  mood: string;
  motion_style: string;
  sample_headline: string;
  tape_color: string;
  paper_border: string;
}

export interface VoxArcBeat {
  role: string;
  name: string;
  target_seconds: number;
  shot_type: string;
  camera: string;
}

export interface VoxArc {
  id: string;
  name: string;
  description: string;
  best_for: string[];
  beats: VoxArcBeat[];
}

