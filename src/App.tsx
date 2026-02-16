import React from 'react';

// Context Providers
import { JobProvider } from './modules/job/context/JobContext';
import { ResumeProvider } from './modules/resume/context/ResumeContext';
import { CoachProvider } from './modules/career/context/CoachContext';
import { SkillProvider } from './modules/skills/context/SkillContext';
import { GlobalUIProvider } from './contexts/GlobalUIContext';
import { ModalProvider } from './contexts/ModalContext';

import { AppLayout } from './components/layout/AppLayout';
import { AppRoutes } from './components/layout/AppRoutes';
import { useTheme } from './hooks/useTheme';

const App: React.FC = () => {
  // Theme Initialization
  useTheme();

  return (
    <ModalProvider>
      <GlobalUIProvider>
        <SkillProvider>
          <ResumeProvider>
            <JobProvider>
              <CoachProvider>
                <AppLayout>
                  <AppRoutes />
                </AppLayout>
              </CoachProvider>
            </JobProvider>
          </ResumeProvider>
        </SkillProvider>
      </GlobalUIProvider>
    </ModalProvider>
  );
};

export default App;
