import React, { useState, useEffect } from 'react';
import type { AppState, SavedJob, ResumeProfile } from './types';
import * as Storage from './services/storageService';
import { parseResumeFile } from './services/geminiService';
import ResumeEditor from './components/ResumeEditor';
import HomeInput from './components/HomeInput';
import History from './components/History';
import JobDetail from './components/JobDetail';
import { Plus, List, Layers } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    resumes: [],
    jobs: [],
    currentView: 'home',
    activeJobId: null,
  });
  const [loading, setLoading] = useState(true);

  // Resume Import State
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importTrigger, setImportTrigger] = useState(0);

  useEffect(() => {
    const storedResumes = Storage.getResumes();
    const storedJobs = Storage.getJobs();
    setState({
      resumes: storedResumes,
      jobs: storedJobs,
      currentView: 'home',
      activeJobId: null,
    });
    setLoading(false);
  }, []);

  const handleSaveResumes = (updatedResumes: ResumeProfile[]) => {
    Storage.saveResumes(updatedResumes);
    setState(prev => ({ ...prev, resumes: updatedResumes }));
  };

  const handleJobCreated = (job: SavedJob) => {
    setState(prev => ({
      ...prev,
      jobs: [job, ...prev.jobs],
    }));
  };

  const handleDeleteJob = (id: string) => {
    Storage.deleteJob(id);
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.filter(j => j.id !== id)
    }));
  };

  const handleUpdateJob = (updatedJob: SavedJob) => {
    Storage.updateJob(updatedJob);
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.map(j => j.id === updatedJob.id ? updatedJob : j)
    }));
  };

  const handleImportResume = async (file: File) => {
    setIsParsingResume(true);
    setImportError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Handle cases where result might be null
        if (!base64String) {
          setImportError("Failed to read file.");
          setIsParsingResume(false);
          return;
        }
        const base64Data = base64String.split(',')[1];

        try {
          const newBlocks = await parseResumeFile(base64Data, file.type);
          if (newBlocks && newBlocks.length > 0) {
            setState(prev => {
              // Get current master or create default
              const master = prev.resumes[0] || { id: 'master', name: 'Master Experience', blocks: [] };
              // Append new blocks
              const updatedMaster = {
                ...master,
                blocks: [...master.blocks, ...newBlocks]
              };

              const updatedResumes = [updatedMaster, ...prev.resumes.slice(1)];

              // Persist immediately
              Storage.saveResumes(updatedResumes);

              return { ...prev, resumes: updatedResumes };
            });
            // Trigger refresh in Editor if mounted
            setImportTrigger(Date.now());
          } else {
            setImportError("Could not identify clear sections in this file.");
          }
        } catch (err) {
          console.error("Failed to parse", err);
          setImportError("AI could not read this file.");
        } finally {
          setIsParsingResume(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setImportError("Failed to load file.");
      setIsParsingResume(false);
    }
  };

  const navigate = (view: AppState['currentView'], jobId: string | null = null) => {
    setState(prev => ({ ...prev, currentView: view, activeJobId: jobId }));
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 z-50 flex justify-center sm:top-0 sm:bottom-auto sm:border-t-0 sm:border-b">
        <div className="flex items-center gap-1 sm:gap-2 max-w-md w-full justify-between">
          <button
            onClick={() => navigate('home')}
            className={`flex flex-col sm:flex-row items-center gap-1 px-4 py-2 rounded-xl transition-colors ${state.currentView === 'home' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Plus className="w-6 h-6 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-sm font-medium">New</span>
          </button>

          <button
            onClick={() => navigate('history')}
            className={`flex flex-col sm:flex-row items-center gap-1 px-4 py-2 rounded-xl transition-colors ${state.currentView === 'history' || state.currentView === 'job-detail' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <List className="w-6 h-6 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-sm font-medium">History</span>
          </button>

          <button
            onClick={() => navigate('resumes')}
            className={`flex flex-col sm:flex-row items-center gap-1 px-4 py-2 rounded-xl transition-colors ${state.currentView === 'resumes' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className="relative">
              <Layers className="w-6 h-6 sm:w-5 sm:h-5" />
              {isParsingResume && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse border-2 border-white" />
              )}
            </div>
            <span className="text-[10px] sm:text-sm font-medium">Experience</span>
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:pt-24 pb-24 sm:pb-8">
        {state.currentView === 'home' && (
          <HomeInput
            resumes={state.resumes}
            onJobCreated={handleJobCreated}
            onJobUpdated={handleUpdateJob}
          />
        )}

        {state.currentView === 'history' && (
          <History
            jobs={state.jobs}
            onSelectJob={(id) => navigate('job-detail', id)}
            onDeleteJob={handleDeleteJob}
          />
        )}

        {state.currentView === 'job-detail' && state.activeJobId && (
          <JobDetail
            job={state.jobs.find(j => j.id === state.activeJobId)!}
            resumes={state.resumes}
            onBack={() => navigate('history')}
            onUpdateJob={handleUpdateJob}
          />
        )}

        {state.currentView === 'resumes' && (
          <div className="space-y-4 animate-in fade-in">
            <ResumeEditor
              resumes={state.resumes}
              onSave={handleSaveResumes}
              onImport={handleImportResume}
              isParsing={isParsingResume}
              importError={importError}
              importTrigger={importTrigger}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
