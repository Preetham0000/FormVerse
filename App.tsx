import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import MyFormsPage from './pages/MyFormsPage';
import CreateFormPage from './pages/CreateFormPage';
import PreviewFormPage from './pages/PreviewFormPage';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-slate-800 dark:text-slate-200">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Navigate to="/myforms" />} />
          <Route path="/myforms" element={<MyFormsPage />} />
          <Route path="/create" element={<CreateFormPage />} />
          <Route path="/preview/:formId" element={<PreviewFormPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;