import React, { useRef, useEffect } from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
}

interface BlogPreviewProps {
  post: BlogPost;
}

const BlogPreview: React.FC<BlogPreviewProps> = ({ post }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Replace this with your optimized short loop (webm preferred) for best perf.
  const VIDEO_URL = 'https://assets.mixkit.co/videos/preview/mixkit-fresh-vegetables-4039-large.mp4';

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, { y: -10, duration: 0.4, ease: 'power2.out', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' });
    gsap.to(cardRef.current?.querySelector('.arrow-icon'), { x: 5, duration: 0.3 });
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, { y: 0, duration: 0.4, ease: 'power2.out', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' });
    gsap.to(cardRef.current?.querySelector('.arrow-icon'), { x: 0, duration: 0.3 });
  };

  // Lazy play / pause the background video when the card enters the viewport
  useEffect(() => {
    const vid = videoRef.current;
    const el = cardRef.current;
    if (!vid || !el) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          vid.play().catch(() => {});
        } else {
          vid.pause();
        }
      });
    }, { threshold: 0.25 });

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div 
      ref={cardRef}
      className="bg-white rounded-3xl overflow-hidden shadow-md flex flex-col h-full border border-gray-50 transition-all cursor-pointer group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative overflow-hidden aspect-[16/10]">
        {/* Background video (blurred + subtle opacity) - lazy-play handled via IntersectionObserver */}
        <video
          ref={videoRef}
          src={VIDEO_URL}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-105 opacity-60"
          aria-hidden="true"
        />

        {/* Foreground image remains crisp and on top */}
        <img 
          src={post.image} 
          alt={post.title} 
          className="relative z-10 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
        />

        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-farm-primary-dark flex items-center gap-1.5 shadow-sm">
          <Calendar size={14} /> {post.date}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-serif text-xl font-bold text-farm-primary-dark mb-3 line-clamp-2 group-hover:text-farm-primary transition-colors">
          {post.title}
        </h3>
        <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">
          {post.excerpt}
        </p>
        <span className="inline-flex items-center gap-2 text-farm-primary font-bold text-sm uppercase tracking-wide mt-auto">
          Đọc Tiếp <ArrowRight size={16} className="arrow-icon" />
        </span>
      </div>
    </div>
  );
};

export default BlogPreview;
