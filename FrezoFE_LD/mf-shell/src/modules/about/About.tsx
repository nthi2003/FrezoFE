import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Leaf, CheckCircle, Sprout, Globe } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Breadcrumb from '../../shared/components/Breadcrumb';

const About = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Animate hero section
    gsap.from('.about-hero-title', { 
      y: 30, 
      opacity: 0, 
      duration: 0.8, 
      ease: 'power3.out' 
    });

    gsap.from('.about-hero-desc', { 
      y: 20, 
      opacity: 0, 
      duration: 0.6, 
      delay: 0.2,
      ease: 'power3.out' 
    });

    // Animate feature cards
    gsap.from('.feature-card', {
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.15,
      delay: 0.4,
      ease: 'power2.out'
    });

    // Animate story section
    gsap.from('.story-content', {
      x: -30,
      opacity: 0,
      duration: 0.8,
      delay: 0.6,
      ease: 'power3.out'
    });

    gsap.from('.story-image', {
      x: 30,
      opacity: 0,
      duration: 0.8,
      delay: 0.6,
      ease: 'power3.out'
    });

  }, { scope: containerRef });

  return (
    <>
      <Helmet>
        <title>Về Chúng Tôi | Frezo</title>
        <meta name="description" content="Tìm hiểu về Frezo - nhà cung cấp rau củ và trái cây sạch cho siêu thị, khách sạn và nhà hàng." />
      </Helmet>

      <Breadcrumb items={[
        { label: 'Trong chủ', path: '/' },
        { label: 'Về Chúng Tôi' }
      ]} />

      <div ref={containerRef}>
        {/* Hero Section */}
        <div 
          className="relative min-h-[500px] bg-cover bg-center flex items-center justify-center py-20 px-4"
          style={{backgroundImage: 'url(https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&q=80&w=1920)'}}
        >
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="relative z-10 text-center max-w-3xl">
            <div className="about-hero-title mb-6">
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-white mb-4 flex items-center justify-center gap-3">
                <Leaf size={40} fill="currentColor" /> THE FARM HOUSE
              </h1>
              <p className="text-2xl text-white/90 font-semibold">NHÀ CUNG CẤP RAU CỬ VÀ TRÁI CÂY CHO SIÊU THỊ, KHÁCH SẠN & NHÀ HÀNG</p>
            </div>
            <p className="about-hero-desc text-lg text-white/80 leading-relaxed">
              Mang đến sản phẩm chất lượng cao, an toàn và bền vững cho cả khách hàng doanh nghiệp và cá nhân
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="feature-card bg-farm-sand rounded-xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/60 rounded-full flex items-center justify-center">
                  <CheckCircle size={32} className="text-farm-primary" />
                </div>
                <h3 className="text-xl font-serif font-bold text-farm-primary-dark mb-3">Dẫn đầu thị trường & đáng tin cậy</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Trở thành thương hiệu hàng đầu trong lĩnh vực cung cấp nông sản tuân sạch và cao cấp.
                </p>
              </div>

              <div className="feature-card bg-farm-sand rounded-xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/60 rounded-full flex items-center justify-center">
                  <Sprout size={32} className="text-farm-primary" />
                </div>
                <h3 className="text-xl font-serif font-bold text-farm-primary-dark mb-3">Phát triển bền vững & truyền cảm hứng sống khoẻ</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Xây dựng chuỗi cung ứng thân thiện với môi trường, hỗ trợ nông nghiệp địa phương và khuyến khích lối sống lành mạnh với thực phẩm sạch.
                </p>
              </div>

              <div className="feature-card bg-farm-sand rounded-xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/60 rounded-full flex items-center justify-center">
                  <Globe size={32} className="text-farm-primary" />
                </div>
                <h3 className="text-xl font-serif font-bold text-farm-primary-dark mb-3">Nâng tầm ẩm thực & mở rộng quy mô</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Đồng hành cùng đầu bếp, nhà hàng, khách sạn cao cấp để đưa sản phẩm tuơi ngon nghiêm đúm thực, đóng thời vụn ra thị trường khu vực & quốc tế.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-white py-20 border-t border-gray-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="story-image">
                <div className="rounded-2xl overflow-hidden shadow-xl h-[500px]">
                  <img 
                    src="https://images.unsplash.com/photo-1488459716781-6918f33fc205?auto=format&fit=crop&q=80&w=800" 
                    alt="Rau củ tươi sạch tại Frezo" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="story-content">
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-farm-primary mb-8">
                  Frezo - Gourmet Rooted in Nature
                </h2>

                <div className="space-y-4 mb-8 text-gray-700">
                  <div className="flex items-start gap-3">
                    <Leaf size={20} className="text-farm-primary flex-shrink-0 mt-1" fill="currentColor" />
                    <p><span className="font-semibold text-farm-primary-dark">8 năm vun trồng niềm tin</span> — Gắn kết tình hoa ẩm thực với thiên nhiên</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Leaf size={20} className="text-farm-primary flex-shrink-0 mt-1" fill="currentColor" />
                    <p><span className="font-semibold text-farm-primary-dark">Frezo hoạt động từ năm 2017</span>, chuyên cung cấp rau củ, trái cây thuần Việt từ các nông trại ở Lâm Đồng và nhiều vùng khác, cùng sản phẩm nhập khẩu cao cấp.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Leaf size={20} className="text-farm-primary flex-shrink-0 mt-1" fill="currentColor" />
                    <p><span className="font-semibold text-farm-primary-dark">Hiện chúng tôi lớp đối tác của hơn 500 doanh nghiệp F&B</span>, trong đó có nhiều khách sạn, nhà hàng và siêu thị lớn trên toàn quốc.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Leaf size={20} className="text-farm-primary flex-shrink-0 mt-1" fill="currentColor" />
                    <p><span className="font-semibold text-farm-primary-dark">Đến năm 2025</span>, Frezo ra mắt của hàng bán lẻ đầu tiên, đồng thời giới thiệu các dòng sản phẩm mới như sệt quà trái cây, mặt ong, sữa ong chưa và nhiều sản phẩm thiên nhiên khác, đáp ứng nhu cầu ngày càng đa dạng của khách hàng.</p>
                  </div>
                </div>

                <button className="border-2 border-farm-primary text-farm-primary hover:bg-farm-primary hover:text-white px-8 py-3 rounded-full font-bold transition-all duration-300">
                  Xem thêm
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-farm-primary-dark text-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-farm-accent mb-2">8+</div>
                <p className="text-white/80">Năm kinh nghiệm</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-farm-accent mb-2">500+</div>
                <p className="text-white/80">Doanh nghiệp F&B</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-farm-accent mb-2">32+</div>
                <p className="text-white/80">Đối tác nông trại</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-farm-accent mb-2">1K+</div>
                <p className="text-white/80">Sản phẩm</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
