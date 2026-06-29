import React, { Suspense } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, Phone, Mail, User, Leaf, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Modules (Local Monolith structure directly from 1 port)
import ProductApp from './modules/product/App';
import BlogApp from './modules/blog/pages/BlogList';
import Checkout from './modules/cart/pages/Checkout';
import CartIcon from './modules/cart/components/CartIcon';
import CartDrawer from './modules/cart/components/CartDrawer';
import AuthModal from './modules/auth/components/AuthModal';
import About from './modules/about/About';
import { useConfigStore } from './shared/store/useConfigStore';

gsap.registerPlugin(useGSAP);

const GlobalLoading = ({ onFinished }: { onFinished: () => void }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.8,
          delay: 0.5,
          onComplete: onFinished
        });
      }
    });

    tl.fromTo('.frezo-logo-loading',
      { scale: 0.5, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1, ease: 'back.out(2)' }
    );

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="fixed inset-0 z-[9999]" style={{ backgroundColor: '#2b5c3f' }}>
      <div className="relative flex flex-col items-center">
        <img src="/logo.png" alt="Frezo" className="frezo-logo-loading h-20 w-auto" />
        <p className="mt-4 text-sm text-gray-500 font-medium">Cung ứng thực phẩm toàn quốc</p>
      </div>
    </div>
  );
};

const Home = () => {
  const { config } = useConfigStore();
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    console.log('🌟 Home Component Animation Starting...');
    const tl = gsap.timeline();

    // Animate Badge
    tl.from('.hero-badge', { y: -20, opacity: 0, duration: 0.6, ease: 'power3.out' })
      // Animate Title
      .from('.hero-title', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
      // Animate Description
      .from('.hero-desc', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.6')
      // Animate Button
      .from('.hero-btn', { scale: 0.9, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' }, '-=0.4')
      // Animate Image
      .from('.hero-image', { x: 50, opacity: 0, duration: 1, ease: 'power3.out' }, '-=1');

    // Floating animation for image
    gsap.to('.hero-image img', {
      y: -15,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    // Counter animation for stats (if present)
    const statEls = document.querySelectorAll<HTMLElement>('.stat-number');
    statEls.forEach((el) => {
      const target = Number(el.dataset.target || '0');
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 2.5,
        delay: 0.4,
        ease: 'power2.out',
        onUpdate: () => {
          // Add + sign and format with dot/comma
          el.innerText = Math.floor(obj.val).toLocaleString('vi-VN') + '+';
        }
      });
    });

  }, { scope: containerRef });

  return (
    <>
      <div ref={containerRef} className="relative min-h-[700px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0 scale-105">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.7] contrast-[1.1]"
          >
            <source src="https://cdn.pixabay.com/video/2021/03/20/68435-528670701_large.mp4" type="video/mp4" />
          </video>
          {/* Multi-layer Overlays for Deep Cinematic Feel */}
          <div className="absolute inset-0 bg-gradient-to-r from-farm-primary-dark/80 via-farm-primary-dark/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-farm-primary-dark/60 via-transparent to-black/20"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_transparent_0%,_rgba(0,0,0,0.4)_100%)]"></div>
          {/* Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>
        </div>

        <div className="container mx-auto px-4 py-24 flex flex-col md:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="hero-badge inline-flex items-center gap-2 bg-farm-accent/90 backdrop-blur-md px-5 py-2.5 rounded-full text-farm-primary-dark font-bold mb-8 shadow-2xl"
            >
              <Leaf size={18} fill="currentColor" /> <span className="text-sm tracking-wide">100% Thuần Tự Nhiên</span>
            </motion.div>

            <h1 className="hero-title text-6xl md:text-7xl font-bold mb-8 text-white leading-[1.1] drop-shadow-2xl">
              {config.heroTitle}
            </h1>

            <p className="hero-desc text-xl text-white/90 mb-10 max-w-xl mx-auto md:mx-0 leading-relaxed font-medium">
              {config.heroSubtitle}
            </p>

            <div className="hero-btn flex flex-wrap gap-4 justify-center md:justify-start">
              <Link to="/products" className="inline-flex items-center gap-2 bg-farm-primary hover:bg-white hover:text-farm-primary-dark text-white px-10 py-5 rounded-2xl font-bold transition-all duration-300 shadow-[0_20px_40px_rgba(22,163,74,0.4)] hover:-translate-y-1">
                Khám Phá Ngay <ChevronRight size={22} />
              </Link>
              <button className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white px-10 py-5 rounded-2xl font-bold transition-all duration-300">
                Tìm Hiểu Quy Trình
              </button>
            </div>
          </div>

          <div className="flex-1 w-full max-w-lg relative hero-image group hidden lg:block">
            {/* Floating Glassmorphism Hero Element */}
            <div className="relative rounded-[40px] overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 p-1 bg-gradient-to-br from-white/20 to-transparent shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-700">
              <div className="absolute inset-0 bg-gradient-to-tr from-farm-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

              <div className="relative rounded-[36px] overflow-hidden h-[500px] border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1615485290382-441e4d0c9cb5?auto=format&fit=crop&q=80&w=1000"
                  alt="Nông sản cao cấp đạt chuẩn VietGAP tại Frezo"
                  className="w-full h-full object-cover"
                />

                {/* Floating Stats or Badges inside the glass frame */}
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Leaf size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Chứng nhận</p>
                    <p className="text-sm font-bold text-gray-800">VietGAP</p>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 bg-farm-primary-dark/80 backdrop-blur-lg p-6 rounded-3xl border border-white/10 text-white max-w-[240px]">
                  <p className="text-2xl font-bold mb-1">99%</p>
                  <p className="text-xs opacity-80 leading-relaxed font-medium">Khách hàng hài lòng với chất lượng rau củ tươi trong ngày.</p>
                </div>
              </div>
            </div>

            {/* Decorative Orbs */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-farm-accent/30 rounded-full blur-[60px] animate-pulse"></div>
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-farm-primary/30 rounded-full blur-[80px]"></div>
          </div>
        </div>
      </div>

      {/* Operations Section - Real-world authentic layout */}
      <div className="bg-[#fdfbf7] py-24 relative overflow-hidden">
        {/* Background texture for a less "flat" look */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/sandpaper.png')` }}></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h3 className="text-4xl font-serif font-black text-farm-primary-dark mb-4 tracking-tight uppercase">{config.opsTitle}</h3>
            <p className="text-gray-500 font-serif italic">{config.opsSubtitle}</p>
            <div className="w-20 h-1 bg-farm-accent mx-auto mt-6 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
            {/* Organic Connecting Line (Vine style) */}
            <div className="hidden md:block absolute top-[80px] left-[15%] w-[70%] h-12 border-t-2 border-dashed border-farm-primary/20 rounded-[100%] -z-10"></div>
            
            {[
              { 
                step: '01', 
                title: 'Hái Tươi Tại Vườn', 
                desc: 'Đôi bàn tay người nông dân tỉ mỉ lựa chọn những sản phẩm đạt độ chín hoàn hảo nhất.',
                img: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=400'
              },
              { 
                step: '02', 
                title: 'Kiểm Định Từng Gốc', 
                desc: 'Sản phẩm được làm sạch tự nhiên và kiểm tra chuẩn VietGAP trước khi đóng vào thùng gỗ.',
                img: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=400'
              },
              { 
                step: '03', 
                title: 'Giao Hàng Tận Tâm', 
                desc: 'Đội ngũ giao hàng hiểu rõ giá trị của sự tươi ngon, vận chuyển nhanh nhất có thể.',
                img: 'https://images.unsplash.com/photo-1580674285054-91321ca67ca8?auto=format&fit=crop&q=80&w=400'
              }
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                <div className="relative mb-8">
                  {/* Photo Circle with Organic Border */}
                  <div className="w-40 h-40 rounded-[2rem] rotate-3 group-hover:rotate-0 overflow-hidden border-4 border-white shadow-2xl transition-all duration-700">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700" />
                  </div>
                  {/* Step Badge */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-farm-accent text-farm-primary-dark flex items-center justify-center font-black text-lg shadow-lg border-2 border-white transform -rotate-12 group-hover:rotate-0 transition-transform">
                    {item.step}
                  </div>
                </div>
                <h4 className="text-xl font-serif font-black text-farm-primary-dark mb-4 tracking-wide">{item.title}</h4>
                <p className="text-gray-600 max-w-[300px] text-sm leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* High-Impact Stats Section with Vegetable Background */}
      <div className="relative py-32 overflow-hidden group">
        {/* Background Image with Parallax-like effect */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&q=80&w=2000" 
            alt="Fresh Organic Tomatoes" 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-farm-primary-dark/85 backdrop-blur-[2px]"></div>
          {/* Organic noise overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/carbon-fibre.png')` }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { label: 'Khách Hàng Hiện Tại', target: '12543', sub: 'Hộ gia đình đồng hành' },
              { label: 'Đơn Hàng / Tháng', target: '784', sub: 'Tươi ngon mỗi ngày' },
              { label: 'Đối Tác Nông Trại', target: '32', sub: 'Mô hình liên kết sạch' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-[2.5rem] text-center transform transition-all duration-500 hover:-translate-y-2 hover:bg-white/15">
                <p className="text-farm-accent text-xs font-black uppercase tracking-[0.3em] mb-6">{stat.label}</p>
                <div className="text-6xl font-black text-white mb-2 stat-number tabular-nums tracking-tighter" data-target={stat.target}>0</div>
                <div className="w-16 h-1 bg-farm-accent/40 mx-auto rounded-full mb-6"></div>
                <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Partners Logos Marquee (right-to-left) */}
      <div className="bg-white py-14 border-y border-gray-100 overflow-hidden">
        <div className="container mx-auto px-4">
          <style>{`@keyframes marqueeRTL { 0% { transform: translateX(100%);} 100% { transform: translateX(-100%);} }`}</style>
          <div className="relative overflow-hidden">
            <div style={{ display: 'flex', gap: '4rem', alignItems: 'center', animation: 'marqueeRTL 18s linear infinite' }}>
              {[
                { name: 'VietGAP', color: '#16a34a' },
                { name: 'GlobalGAP', color: '#059669' },
                { name: 'Organic Org', color: '#7c3aed' },
                { name: 'EcoCert', color: '#0891b2' },
                { name: 'SafeFood', color: '#dc2626' },
                { name: 'VietGAP', color: '#16a34a' },
                { name: 'GlobalGAP', color: '#059669' },
                { name: 'Organic Org', color: '#7c3aed' }
              ].map((partner, i) => (
                <div
                  key={partner.name + i}
                  className="hover:scale-110 transition-transform text-xl md:text-2xl font-serif font-black tracking-tighter whitespace-nowrap"
                  style={{ color: partner.color }}
                >
                  {partner.name.toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const Header = () => {
  const { config } = useConfigStore();

  return (
    <header className="sticky top-0 z-50 shadow-sm" style={{ backgroundColor: '#2b5c3f' }}>
      <div className="text-white/90 text-xs py-2 hidden md:block" style={{ backgroundColor: '#1f442d' }}>
        <div className="container mx-auto px-4 flex justify-between">
          <div className="flex gap-6">
            <span className="flex items-center gap-2"><Phone size={14} /> Hotline: {config.contactPhone}</span>
            <span className="flex items-center gap-2"><Mail size={14} /> {config.contactEmail}</span>
          </div>
          <div>{config.shippingPolicy}</div>
        </div>
      </div>

      <div className="container mx-auto px-4 h-20 flex justify-between items-center">
        <div className="flex items-center gap-2 z-50">
          <Link to="/" className="flex items-center gap-2">
            <img src={config.logoUrl} alt={config.brandName} className="h-10 w-auto brightness-0 invert" />
          </Link>
        </div>

        <nav className="hidden md:flex gap-8 relative">
          {[
            { path: '/', label: 'Trang Chủ' },
            { path: '/about', label: 'Về Chúng Tôi' },
            { path: '/products', label: 'Khám Phá' },
            { path: '/blogs', label: 'Tin Tức' },
            { path: '/contact', label: 'Liên Hệ' }
          ].map(item => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`font-medium text-sm transition-colors relative py-2 ${isActive ? 'text-white font-bold' : 'text-white/80 hover:text-white'
                  }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-farm-accent rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-4 text-white">
          <button className="p-2 hover:bg-white/20 rounded-full transition-colors"><Search size={20} /></button>
          <button className="p-2 hover:bg-white/20 rounded-full transition-colors hidden sm:block btn-auth-trigger"><User size={20} /></button>
          <Suspense fallback={<div className="w-8 h-8 rounded-full bg-white/20 animate-pulse"></div>}>
            <CartIcon />
          </Suspense>
          <button className="md:hidden p-2 hover:bg-white/20 rounded-full transition-colors"><Menu size={24} /></button>
        </div>
      </div>
    </header>
  );
};

const Footer = () => {
  const { config } = useConfigStore();
  return (
    <footer className="relative text-white/80 pt-20 pb-8 rounded-t-[40px] mt-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" style={{ backgroundColor: '#2b5c3f' }}></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-3">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <img src={config.logoUrl} alt={config.brandName} className="h-12 w-auto brightness-0 invert" />
          </Link>
            <p className="mb-6 max-w-sm leading-relaxed">{config.aboutUs || "Tiên phong mang đến hệ sinh thái thực phẩm sạch, minh bạch nguồn gốc và tốt cho sức khoẻ gia đình bạn."}</p>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-farm-accent transition-colors cursor-pointer text-sm font-bold shadow-lg">Fb</div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-farm-accent transition-colors cursor-pointer text-sm font-bold shadow-lg">Ig</div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-farm-accent transition-colors cursor-pointer text-sm font-bold shadow-lg">Yt</div>
          </div>
        </div>

        <div className="md:col-span-3">
          <h3 className="text-white font-serif text-xl mb-6">Sản Phẩm</h3>
          <ul className="space-y-3">
            <li><Link to="#" className="hover:text-farm-accent hover:translate-x-1 inline-block transition-transform">Rau củ hữu cơ</Link></li>
            <li><Link to="#" className="hover:text-farm-accent hover:translate-x-1 inline-block transition-transform">Trái cây theo mùa</Link></li>
            <li><Link to="#" className="hover:text-farm-accent hover:translate-x-1 inline-block transition-transform">Gia vị tự nhiên</Link></li>
            <li><Link to="#" className="hover:text-farm-accent hover:translate-x-1 inline-block transition-transform">Sản phẩm chế biến</Link></li>
          </ul>
        </div>

        <div className="md:col-span-3">
          <h3 className="text-white font-serif text-xl mb-6">Liên Hệ</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <Phone size={18} className="text-farm-accent mt-0.5 flex-shrink-0" />
              <a href={`tel:${config.contactPhone}`} className="hover:text-farm-accent transition-colors">{config.contactPhone}</a>
            </li>
            <li className="flex items-start gap-3">
              <Mail size={18} className="text-farm-accent mt-0.5 flex-shrink-0" />
              <a href={`mailto:${config.contactEmail}`} className="hover:text-farm-accent transition-colors break-all">{config.contactEmail}</a>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center mt-0.5 flex-shrink-0 text-xs">📍</div>
              <span>{config.contactAddress}</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center mt-0.5 flex-shrink-0 text-xs">🕐</div>
              <span>{config.workingHours}</span>
            </li>
          </ul>
        </div>

        <div className="md:col-span-3">
          <h3 className="text-white font-serif text-xl mb-6">Bản Đồ</h3>
          <div className="rounded-lg overflow-hidden border-2 border-white/20 shadow-lg h-48">
            <iframe
              title="Bản đồ địa chỉ Frezo tại TP.HCM"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4520340990916!2d106.76832!3d10.801698!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317529f9f5f5f5f5%3A0x1234567890abcdef!2s76%20Duong%20so%207%2C%20Binh%20Trung%2C%20Ho%20Chi%20Minh%20City!5e0!3m2!1svi!2svn!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="container mx-auto px-4 py-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h3 className="text-white font-serif text-2xl mb-4">{config.newsletterTitle}</h3>
          <p className="text-white/70 mb-6">{config.newsletterSubtitle}</p>
        </div>
        <div className="flex max-w-md shadow-lg rounded-lg overflow-hidden border border-white/20">
          <input type="email" placeholder="Nhập địa chỉ email..." className="flex-1 bg-white/10 border-none px-4 py-3 outline-none text-white placeholder-white/50 focus:bg-white/20 transition-colors" />
          <button className="bg-farm-accent hover:bg-farm-accent-light text-farm-primary-dark font-bold px-6 py-3 transition-colors">Gửi</button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 border-t border-white/10 text-sm text-center md:flex justify-between items-center">
        <p>{config.footerText || "© 2026 Frezo. Giao diện Micro Frontend GSAP."}</p>
        <div className="flex justify-center gap-6 mt-4 md:mt-0">
          <Link to="#" className="hover:text-white transition-colors">Bảo mật</Link>
          <Link to="#" className="hover:text-white transition-colors">Điều khoản</Link>
          <Link to="#" className="hover:text-white transition-colors">Sitemap</Link>
        </div>
      </div>
    </div>
    <div className="absolute top-10 left-10 opacity-10 animate-bounce z-0">
      <Leaf size={64} className="text-white" fill="currentColor" />
    </div>
    <div className="absolute bottom-32 right-12 opacity-10 z-0">
      <Leaf size={80} className="text-white" fill="currentColor" />
    </div>
  </footer>
  );
};

const App = () => {
  const [isAuthOpen, setIsAuthOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const { config, fetchConfig } = useConfigStore();

  React.useEffect(() => {
    const initApp = async () => {
      await fetchConfig();
      // Keep loading screen for at least 1s for effect
      setTimeout(() => setIsLoading(false), 1000);
    };
    initApp();
  }, [fetchConfig]);

  return (
    <>
      <AnimatePresence>
        {isLoading && <GlobalLoading onFinished={() => {}} />}
      </AnimatePresence>

      <div className={`flex flex-col min-h-screen transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        <Helmet>
          <title>{config.brandName} | Tinh Hoa Nông Sản Việt</title>
          <meta name="description" content={config.aboutUs || "Trải nghiệm mua sắm nông sản sạch, đạt chuẩn VietGAP với hệ thống giao diện Micro Frontend chuyên nghiệp."} />
        </Helmet>

        {/* Click listener wrapper */}
        <div onClick={(e) => {
          if ((e.target as HTMLElement).closest('.btn-auth-trigger')) setIsAuthOpen(true);
        }}>
          <Header />
        </div>

        <main className="flex-grow">
          <Suspense fallback={<div className="container mx-auto px-4 py-20 text-center text-gray-500 animate-pulse font-serif text-xl">Đang tải module hệ thống...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/products/*" element={<ProductApp />} />
              <Route path="/blogs/*" element={<BlogApp />} />
              <Route path="/cart" element={<Checkout />} />
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                  <div className="w-24 h-24 bg-farm-sand rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <Leaf size={48} className="text-farm-primary" fill="currentColor" fillOpacity={0.2} />
                  </div>
                  <h2 className="text-4xl font-serif font-bold text-farm-primary-dark mb-4">404</h2>
                  <p className="text-xl font-serif text-gray-500 mb-8 max-w-md">Kiến thức này chưa được gieo trồng trên cánh đồng của chúng tôi.</p>
                  <Link to="/" className="bg-farm-primary hover:bg-farm-primary-dark text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-farm-primary/30">
                    Quay lại trang chủ
                  </Link>
                </div>
              } />
            </Routes>
          </Suspense>
        </main>

        <Footer />

        <Suspense fallback={null}>
          <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
          <CartDrawer />
        </Suspense>
      </div>
    </>
  );
};

export default App;
