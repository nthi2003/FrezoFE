import React, { useState, useRef, useEffect } from 'react';
import { X, Mail, Lock, User, Leaf } from 'lucide-react';
import gsap from 'gsap';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register' | 'forgot';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(defaultTab);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isOpen) {
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.3, display: 'flex' });
      gsap.fromTo(modalRef.current, 
        { y: 50, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.5)', delay: 0.1 }
      );
    } else {
      gsap.to(modalRef.current, { y: 20, opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in' });
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, display: 'none', delay: 0.1 });
    }
  }, [isOpen]);

  useEffect(() => {
    if (formRef.current && isOpen) {
      gsap.fromTo(formRef.current.children, 
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [tab, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy API call
    console.log(`${tab} submitted`);
    
    // Custom Event for EventBus
    if (tab === 'login' || tab === 'register') {
      const event = new CustomEvent('auth:login', { detail: { token: 'mock_jwt_token_123', user: { name: 'User' } } });
      window.dispatchEvent(event);
      localStorage.setItem('auth_token', 'mock_jwt_token_123');
      onClose();
    }
  };

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] hidden items-center justify-center p-4 opacity-0"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="bg-farm-primary-dark p-8 pb-10 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 opacity-20">
            <Leaf size={150} />
          </div>
          <div className="relative z-10">
            <Leaf size={40} className="mx-auto mb-4" />
            <h2 className="font-serif text-3xl font-bold mb-2">Frezo</h2>
            <p className="text-white/80 text-sm">Cùng xây dựng thói quen ăn uống lành mạnh.</p>
          </div>
        </div>

        <div className="p-8 -mt-6 bg-white relative rounded-t-3xl text-gray-800">
          <div className="flex gap-6 mb-8 border-b border-gray-100 pb-4">
            <button 
              className={`font-semibold pb-4 -mb-4 relative ${tab === 'login' ? 'text-farm-primary' : 'text-gray-400 hover:text-gray-600'}`}
              onClick={() => setTab('login')}
            >
              Đăng Nhập
              {tab === 'login' && <span className="absolute bottom-0 left-0 w-full h-1 bg-farm-primary rounded-t-lg" />}
            </button>
            <button 
              className={`font-semibold pb-4 -mb-4 relative ${tab === 'register' ? 'text-farm-primary' : 'text-gray-400 hover:text-gray-600'}`}
              onClick={() => setTab('register')}
            >
              Đăng Ký
              {tab === 'register' && <span className="absolute bottom-0 left-0 w-full h-1 bg-farm-primary rounded-t-lg" />}
            </button>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
            {tab === 'register' && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input required type="text" placeholder="Họ và tên" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-farm-primary focus:ring-2 focus:ring-farm-primary/20 transition-all" />
              </div>
            )}
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail size={18} />
              </div>
              <input required type="email" placeholder="Địa chỉ Email" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-farm-primary focus:ring-2 focus:ring-farm-primary/20 transition-all" />
            </div>

            {tab !== 'forgot' && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input required type="password" placeholder="Mật khẩu" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-farm-primary focus:ring-2 focus:ring-farm-primary/20 transition-all" />
              </div>
            )}

            {tab === 'login' && (
              <div className="flex justify-end mt-1">
                <button type="button" onClick={() => setTab('forgot')} className="text-sm text-farm-primary font-medium hover:underline">Quên mật khẩu?</button>
              </div>
            )}

            <button type="submit" className="w-full bg-farm-primary hover:bg-farm-primary-dark text-white font-bold py-3.5 rounded-xl shadow-lg shadow-farm-primary/30 mt-4 transition-colors">
              {tab === 'login' ? 'Đăng Nhập' : tab === 'register' ? 'Tạo Tài Khoản' : 'Khôi Phục Mật Khẩu'}
            </button>

            {tab === 'forgot' && (
              <button type="button" onClick={() => setTab('login')} className="text-sm text-gray-500 font-medium hover:text-gray-800 mt-2 text-center w-full">
                Quay lại đăng nhập
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
