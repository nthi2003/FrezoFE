import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import CartIcon from './components/CartIcon';
import CartDrawer from './components/CartDrawer';
import Checkout from './pages/Checkout';
import './index.css';

const App = () => (
  <div>
    <h2>Cart Module Debug App</h2>
    <div className="p-4 bg-gray-100 flex justify-end">
      <CartIcon />
    </div>
    <CartDrawer />
    <Routes>
      <Route path="/checkout" element={<Checkout />} />
    </Routes>
  </div>
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
