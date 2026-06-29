import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, User, Share2, Heart } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Breadcrumb from '../../../shared/components/Breadcrumb';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  author?: string;
  content: string;
  readTime?: number;
}

import { ArticleApi } from '../../../api';

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = React.useState<BlogPost | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [scrollProgress, setScrollProgress] = React.useState(0);

  React.useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const item = await ArticleApi.getArticleById(slug);
        if (item) {
          setPost({
            id: item.id,
            slug: item.slug || item.id,
            title: item.title,
            excerpt: item.summary || '',
            date: new Date(item.createdAt).toLocaleDateString('vi-VN'),
            image: item.thumbnailUrl || 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=1200',
            author: item.authorName || 'Frezo',
            content: item.content,
            readTime: item.readTime || 5
          });
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  React.useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useGSAP(() => {
    if (!loading && post) {
      gsap.from('.blog-header-content', {
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out'
      });

      gsap.from('.blog-main-img', {
        scale: 1.1,
        opacity: 0,
        duration: 1.5,
        ease: 'power2.out'
      });
    }
  }, [loading, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center font-serif text-2xl text-gray-400 italic">
        Đang tìm hạt mầm tri thức...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center font-serif text-2xl text-gray-400 italic">
        Kiến thức này chưa được gieo trồng.
      </div>
    );
  }


  return (
    <>
      <Helmet>
        <title>{post.title} | Frezo</title>
        <meta name="description" content={post.excerpt} />
      </Helmet>

      {/* Reading Progress Bar */}
      <div 
        className="fixed top-20 left-0 h-1 bg-farm-accent z-[60] transition-all duration-100 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="bg-[#fcfaf6] min-h-screen pb-32">
        {/* Cinematic Header */}
        <div className="relative h-[80vh] min-h-[600px] overflow-hidden">
          <img
            src={post.image}
            alt={post.title}
            className="blog-main-img w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#fcfaf6] via-black/20 to-black/40"></div>
          
          <div className="absolute inset-0 flex flex-col justify-end pb-24">
            <div className="container mx-auto px-4">
              <div className="blog-header-content max-w-4xl mx-auto">
                <div className="flex items-center gap-4 text-white/80 mb-6 font-bold tracking-[0.2em] uppercase text-xs">
                  <span className="bg-farm-accent text-farm-primary-dark px-3 py-1 rounded-full uppercase">Kiến Thức</span>
                  <div className="w-12 h-px bg-white/30"></div>
                  <span>{post.date}</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-serif font-black text-white mb-8 leading-[1.1] drop-shadow-xl">
                  {post.title}
                </h1>
                <p className="text-xl md:text-2xl text-white/90 font-medium italic max-w-2xl leading-relaxed">
                  "{post.excerpt}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="container mx-auto px-4 -mt-16 relative z-20">
          <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
            
            {/* Sidebar / Reading Info */}
            <aside className="lg:w-1/4">
              <div className="sticky top-32 space-y-8">
                <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-farm-primary/5 border border-farm-sand">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-farm-sand flex items-center justify-center text-farm-primary">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Tác giả</p>
                      <p className="text-sm font-bold text-farm-primary-dark">{post.author}</p>
                    </div>
                  </div>
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Thời gian đọc</span>
                      <span className="font-bold text-farm-primary-dark">{post.readTime} phút</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Chủ đề</span>
                      <span className="font-bold text-farm-primary-dark">Hữu cơ</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-white border border-gray-100 hover:border-farm-accent hover:text-farm-primary transition-all duration-300 font-bold text-sm shadow-sm group">
                    <Heart size={20} className="group-hover:fill-current" /> Lưu Lại
                  </button>
                  <button className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-white border border-gray-100 hover:border-farm-accent hover:text-farm-primary transition-all duration-300 font-bold text-sm shadow-sm">
                    <Share2 size={20} /> Chia Sẻ
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Article Content */}
            <article className="lg:w-3/4 bg-white p-8 md:p-16 rounded-[3rem] shadow-2xl shadow-farm-primary/5 border border-farm-sand relative">
               {/* Decorative Leaf Drop */}
               <div className="absolute top-10 right-10 opacity-5">
                 <Leaf size={120} className="text-farm-primary" fill="currentColor" />
               </div>

               <div className="prose prose-xl prose-stone max-w-none">
                  <div 
                    dangerouslySetInnerHTML={{ __html: post.content }} 
                    className="blog-main-body leading-[1.8] text-[#334155] font-medium"
                  />
               </div>

               {/* Footer of article */}
               <div className="mt-20 pt-10 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Từ khoá:</span>
                    <div className="flex gap-2">
                      {['#HữuCơ', '#SứcKhoẻ', '#NôngSảnSạch'].map(tag => (
                        <span key={tag} className="text-sm font-bold text-farm-primary">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm italic text-gray-400">Hãy lan toả tri thức nông nghiệp sạch...</p>
                  </div>
               </div>
            </article>
          </div>

          {/* Related CTA */}
          <div className="mt-24 bg-farm-primary-dark rounded-[4rem] p-12 md:p-20 relative overflow-hidden text-center text-white">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/carbon-fibre.png')` }}></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-serif font-black mb-6 italic text-white leading-tight">Gieo mầm sức khoẻ cho gia đình bạn?</h2>
              <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto">Mỗi lựa chọn thực phẩm hôm nay là một bước tiến cho tương lai vững bền ngày mai.</p>
              <a 
                href="/products" 
                className="inline-block bg-farm-accent hover:bg-white text-farm-primary-dark px-12 py-5 rounded-2xl font-black text-lg transition-all transform hover:-translate-y-2 shadow-2xl"
              >
                MUA SẮM NGAY
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogDetail;
