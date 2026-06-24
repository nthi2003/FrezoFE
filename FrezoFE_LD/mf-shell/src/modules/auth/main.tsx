import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import AuthModal from './components/AuthModal';
import './index.css';

const App = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Auth Module Debug</h1>
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-farm-primary text-white px-6 py-2 rounded-lg"
        >
          Open Login Modal
        </button>
      </div>
      <AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
