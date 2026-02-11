import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from '../../src/features/layout';
import HomePage from '../../src/app/page';
import ScenarioBuilderPage from '../../src/app/scenario/new/page';
import ScenarioEditPage from '../../src/app/scenario/edit/page';
import TestOptimizerPage from '../../src/app/test-optimizer/page';
import ScheduleManagementPage from '../../src/app/schedules/page';
import ScheduleDetailPage from '../../src/app/schedules/id/page';
import ScheduleCreatePage from '../../src/app/schedules/new/page';
import { ToastContainer } from '../../src/components/toast';
import { ConfirmModalContainer } from '../../src/components/confirm-modal';
import { RecordingNotifier } from '../../src/components/recording-notifier';
import '../../src/app/globals.css';

// Electron API 타입 정의
declare global {
  interface Window {
    electronAPI: {
      scenarios: {
        getAll: () => Promise<any>;
        create: (data: any) => Promise<any>;
        getById: (id: string) => Promise<any>;
        update: (id: string, data: any) => Promise<any>;
        delete: (id: string) => Promise<any>;
        execute: (id: string, code: string) => Promise<any>;
        debug: (code: string) => Promise<any>;
      };
      recording: {
        start: (url: string) => Promise<any>;
        stop: (sessionId: string) => Promise<any>;
      };
      executions: {
        getById: (id: string) => Promise<any>;
        onStatusChanged: (callback: (data: any) => void) => () => void;
      };
      ai: {
        modify: (code: string, instruction: string) => Promise<any>;
      };
      schedules: {
        getByScenarioId: (scenarioId: string) => Promise<any>;
        save: (data: any) => Promise<any>;
        toggle: (scenarioId: string, enabled: boolean) => Promise<any>;
        delete: (scenarioId: string) => Promise<any>;
        list: () => Promise<any>;
        runs: (scheduleId: string) => Promise<any>;
      };
    };
  }
}

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/scenario/new" element={<ScenarioBuilderPage />} />
            <Route path="/scenario/edit/:id" element={<ScenarioEditPage />} />
            <Route path="/test-optimizer" element={<TestOptimizerPage />} />
            <Route path="/schedules" element={<ScheduleManagementPage />} />
            <Route path="/schedules/:id" element={<ScheduleDetailPage />} />
            <Route path="/schedules/new" element={<ScheduleCreatePage />} />
          </Routes>
        </main>
        <ToastContainer />
        <RecordingNotifier />
        <ConfirmModalContainer />
      </div>
    </Router>
  );
}

// 앱 마운트
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Root element not found');
}
