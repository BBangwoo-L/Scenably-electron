import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from '../../src/features/layout';
import HomePage from '../../src/app/page';
import ScenarioBuilderPage from '../../src/app/scenario/new/page';
import ScenarioEditPage from '../../src/app/scenario/edit/page';
import TestOptimizerPage from '../../src/app/test-optimizer/page';
import { ToastContainer } from '../../src/components/toast';
import { ConfirmModalContainer } from '../../src/components/confirm-modal';
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
          </Routes>
        </main>
        <ToastContainer />
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