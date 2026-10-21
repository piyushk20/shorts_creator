import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CreateWizard } from './components/CreateWizard';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { SettingsModal } from './components/SettingsModal';
import { api, Project } from './services/api';
import './styles/main.css';

export const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createInitialMode, setCreateInitialMode] = useState<'trends' | 'idea' | 'script' | 'vox'>('trends');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'social' | 'providers' | 'engine'>('social');
  const [loading, setLoading] = useState(true);

  const handleOpenCreate = (mode: 'trends' | 'idea' | 'script' | 'vox' = 'trends') => {
    setSelectedProject(null);
    setCreateInitialMode(mode);
    setIsCreating(true);
  };

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleSelectProject = async (p: Project) => {
    try {
      const full = await api.getProject(p.id);
      setSelectedProject(full);
    } catch (e) {
      setSelectedProject(p);
    }
  };

  const handleProjectCreated = (newP: Project) => {
    setIsCreating(false);
    setSelectedProject(newP);
    loadProjects();
  };

  const handleQuickStart = async (topic: string) => {
    try {
      const newP = await api.createProject({
        topic,
        platform: 'youtube_shorts',
        aspect_ratio: '9:16',
        target_duration: 30,
        language: 'en',
        voice: 'en-US-ChristopherNeural',
        visual_style: 'cinematic',
        caption_style: 'word_highlight'
      });
      setSelectedProject(newP);
      loadProjects();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTrendStart = async (trend: any, category: string) => {
    try {
      setLoading(true);
      const launchRes = await api.launchProjectFromTrend({
        topic_id: trend.id,
        category: category,
        title: trend.title,
        suggested_hook: trend.suggested_hook,
        suggested_angle: trend.suggested_angle,
        platform: 'youtube_shorts',
        aspect_ratio: '9:16',
        target_duration: trend.target_duration || 45,
        language: 'en',
        voice: 'en-US-ChristopherNeural',
        visual_style: 'cinematic',
        caption_style: 'word_highlight'
      });
      const full = await api.getProject(launchRes.project_id);
      setSelectedProject(full);
      loadProjects();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar 
        onOpenCreate={handleOpenCreate}
        onOpenSettings={(tab = 'social') => { setSettingsTab(tab); setIsSettingsOpen(true); }}
        onGoHome={() => { setSelectedProject(null); setIsCreating(false); loadProjects(); }}
      />

      <main className="main-content">
        {selectedProject ? (
          <ProjectWorkspace 
            project={selectedProject} 
            onBack={() => { setSelectedProject(null); loadProjects(); }}
            onRefresh={() => handleSelectProject(selectedProject)}
          />
        ) : isCreating ? (
          <CreateWizard 
            initialMode={createInitialMode}
            onProjectCreated={handleProjectCreated}
            onCancel={() => setIsCreating(false)}
          />
        ) : (
          <Dashboard 
            projects={projects}
            onSelectProject={handleSelectProject}
            onOpenCreate={handleOpenCreate}
            onQuickStart={handleQuickStart}
            onTrendStart={handleTrendStart}
          />
        )}
      </main>

      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)} 
          initialTab={settingsTab}
        />
      )}
    </div>
  );
};
export default App;
