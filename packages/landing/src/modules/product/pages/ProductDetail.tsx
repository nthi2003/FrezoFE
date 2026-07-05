import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Star, Leaf, Shield, Truck, Heart, ShoppingCart, Loader2 } from 'lucide-react';
import Breadcrumb from '../../../shared/components/Breadcrumb';
import { ProductApi } from '../../../api';

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
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      setError(false);
      try {
        const item = await ProductApi.getById(id);
        if (item) {
          setProduct({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.imageUrl || 'https://images.unsplash.com/photo-1615485290382-441e4d0c9cb5?auto=format&fit=crop&q=80&w=600',
            category: item.category || '',
            rating: item.rating || 0,
            isNew: item.isNew
          });
        }
      } catch (err) {
        console.error('Lỗi khi tải sản phẩm:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-farm-primary" />
          <span className="text-gray-500 font-medium">Đang tải sản phẩm...</span>
        </div>
      </div>
    );
  }

  if (!product || error) {
    return <div className="container mx-auto px-4 py-20 text-center text-gray-500">Sản phẩm không tìm thấy</div>;
  }

  return (
    <>
      <Helmet>
        <title>{product.name} | Frezo</title>
        <meta name="description" content={`Chi tiết sản phẩm ${product.name} - nông sản sạch từ Frezo`} />
      </Helmet>

      <Breadcrumb items={[
        { label: 'Trang chủ', path: '/' },
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
