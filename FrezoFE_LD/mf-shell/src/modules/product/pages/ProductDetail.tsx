import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Star, Leaf, Shield, Truck, Heart, ShoppingCart } from 'lucide-react';
import Breadcrumb from '../../../shared/components/Breadcrumb';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  isNew?: boolean;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    // Dummy fetch - replace with real API
    const allProducts: Product[] = [
      { id: '1', name: 'Bó Rau Cải Thìa Hữu Cơ', price: 25000, image: 'https://images.unsplash.com/photo-1601493700685-3037eb94cfb1?auto=format&fit=crop&q=80&w=600', category: 'Rau Ăn Lá', rating: 4.8, isNew: true },
      { id: '2', name: 'Cà Chua Cherry Đà Lạt', price: 45000, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600', category: 'Quả', rating: 5.0 },
      { id: '3', name: 'Khoai Tây Vàng Sạch', price: 30000, image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600', category: 'Củ', rating: 4.5 },
      { id: '4', name: 'Bắp Cải Sú Trái Tim', price: 35000, image: 'https://images.unsplash.com/photo-1557844352-761f2565b576?auto=format&fit=crop&q=80&w=600', category: 'Organic', rating: 4.9, isNew: true },
      { id: '5', name: 'Hành Tây Đà Lạt', price: 28000, image: 'https://images.unsplash.com/photo-1550828520-4cb496926fc9?auto=format&fit=crop&q=80&w=600', category: 'Củ', rating: 4.2 },
      { id: '6', name: 'Dưa Leo Nhật Bản', price: 32000, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=600', category: 'Quả', rating: 4.6 },
      { id: '7', name: 'Xà Lách Thuỷ Canh', price: 40000, image: 'https://images.unsplash.com/photo-1622312683995-103f6952865d?auto=format&fit=crop&q=80&w=600', category: 'Organic', rating: 4.7 },
      { id: '8', name: 'Bí Ngòi Xanh', price: 38000, image: 'https://images.unsplash.com/photo-1592683792019-354a3e215f7d?auto=format&fit=crop&q=80&w=600', category: 'Quả', rating: 4.5 }
    ];
    
    const found = allProducts.find(p => p.id === id);
    setProduct(found || null);
  }, [id]);

  if (!product) {
    return <div className="container mx-auto px-4 py-20 text-center text-gray-500">Sản phẩm không tìm thấy</div>;
  }

  return (
    <>
      <Helmet>
        <title>{product.name} | Frezo</title>
        <meta name="description" content={`Chi tiết sản phẩm ${product.name} - nông sản sạch từ Frezo`} />
      </Helmet>

      <Breadcrumb items={[
        { label: 'Trong chủ', path: '/' },
        { label: 'Khám Phá', path: '/products' },
        { label: product.name }
      ]} />

      <div className="bg-white min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div className="flex flex-col gap-4">
              <div className="bg-gray-100 rounded-2xl overflow-hidden h-[500px]">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-farm-accent text-farm-primary-dark px-3 py-1 rounded-full text-xs font-bold">
                    {product.category}
                  </span>
                  {product.isNew && (
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                      MỚI
                    </span>
                  )}
                </div>
                <h1 className="text-4xl font-serif font-bold text-farm-primary-dark mb-4">
                  {product.name}
                </h1>
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                  <span className="text-gray-600 ml-2">({product.rating})</span>
                </div>
              </div>

              <div className="mb-6 pb-6 border-b border-gray-100">
                <div className="text-3xl font-bold text-farm-primary mb-2">
                  {product.price.toLocaleString()}đ
                </div>
                <p className="text-gray-500 text-sm">Miễn phí vận chuyển cho đơn từ 500.000đ</p>
              </div>

              {/* Features */}
              <div className="mb-8 space-y-3">
                <div className="flex items-start gap-3">
                  <Leaf size={20} className="text-farm-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-700">100% Tự Nhiên</div>
                    <p className="text-sm text-gray-500">Không chứa hóa chất hay thuốc trừ sâu</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield size={20} className="text-farm-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-700">Đạt Tiêu Chuẩn VietGAP</div>
                    <p className="text-sm text-gray-500">Kiểm định chất lượng quốc tế</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck size={20} className="text-farm-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-700">Giao Hàng Nhanh</div>
                    <p className="text-sm text-gray-500">Giao trong vòng 24 giờ tại Hà Nội</p>
                  </div>
                </div>
              </div>

              {/* Quantity & Add to Cart */}
              <div className="mb-8 flex items-center gap-4">
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    −
                  </button>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center border-0 outline-none"
                  />
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
                <button className="flex-1 bg-farm-primary hover:bg-farm-primary-dark text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-farm-primary/30">
                  <ShoppingCart size={20} />
                  Thêm vào Giỏ
                </button>
                <button className="w-12 h-12 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <Heart size={20} />
                </button>
              </div>

              {/* Description */}
              <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
                <h3 className="font-semibold text-farm-primary-dark text-base">Mô Tả Sản Phẩm</h3>
                <p>Sản phẩm được lựa chọn và cung cấp trực tiếp từ những trang trại hữu cơ uy tín nhất. Đảm bảo tươi sạch ngay khi nhận hàng với quy trình kiểm định khắt khe.</p>
                <p>Phù hợp cho: Gia đình • Nhà hàng • Siêu thị • Cơ sở kinh doanh</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetail;
