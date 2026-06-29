import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import BlogList from './pages/BlogList';
import './index.css';

const App = () => (
  <Routes>
    <Route path="/" element={<BlogList />} />
    <Route path="/:slug" element={<div className="container mx-auto py-20 text-center font-serif text-2xl">Đang tải nội dung bài viết...</div>} />
  </Routes>
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter basename="/blogs">
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
