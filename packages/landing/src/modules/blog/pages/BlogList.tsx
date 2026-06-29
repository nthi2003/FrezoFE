import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import BlogPreview, { BlogPost } from '../components/BlogPreview';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Breadcrumb from '../../../shared/components/Breadcrumb';
import BlogDetail from './BlogDetail';

import { ArticleApi } from '../../../api';
import { useConfigStore } from '../../../shared/store/useConfigStore';

const BlogList = () => {
  const { config } = useConfigStore();
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchArticles = async () => {
      try {
        const data = await ArticleApi.getPublicArticles();
        const mappedPosts = data.content.map((item: any) => ({
          id: item.id,
          slug: item.slug || item.id,
          title: item.title,
          excerpt: item.summary || (item.content ? item.content.substring(0, 150) + '...' : ''),
          date: new Date(item.createdAt).toLocaleDateString('vi-VN'),
          image: item.thumbnailUrl || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=800'
        }));
        setPosts(mappedPosts);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  useGSAP(() => {
    if (!loading) {
      gsap.from('.blog-card-wrap', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out'
      });
    }
  }, [loading]);

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <Helmet>
        <title>Tin Tức Xanh | Frezo</title>
        <meta name="description" content="Chuyên trang chia sẻ kiến thức sống khoẻ, dinh dưỡng và nông nghiệp sạch từ Frezo." />
      </Helmet>
      
      <Breadcrumb items={[
        { label: 'Trong chủ', path: '/' },
        { label: 'Tin Tức' }
      ]} />
      
      {/* Blog Head */}
      <div className="bg-farm-primary-dark py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1920" alt="Farm Background" className="w-full h-full object-cover" />
        </div>
        <div className="container mx-auto text-center relative z-10">
          <span className="text-farm-accent font-bold tracking-widest uppercase text-sm mb-4 block">Góc Chia Sẻ</span>
          <h1 className="text-4xl md:text-5xl font-serif text-white font-bold mb-6">{config.blogTitle}</h1>
          <p className="text-white/80 max-w-2xl mx-auto text-lg">{config.blogSubtitle}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-16 max-w-5xl">
        {loading ? (
          <div className="text-center py-20 text-gray-500 animate-pulse font-serif text-xl">Đang thu hoạch tin tức...</div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <div key={post.id} className="blog-card-wrap">
                <Link to={`/blogs/${post.slug}`} className="block h-full">
                  <BlogPreview post={post} />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500 italic">Chưa có bài viết nào được gieo trồng.</div>
        )}
      </div>
    </div>
  );
};


const BlogApp = () => {
  return (
    <Routes>
      <Route path="/" element={<BlogList />} />
      <Route path="/:slug" element={<BlogDetail />} />
    </Routes>
  );
};

export default BlogApp;
