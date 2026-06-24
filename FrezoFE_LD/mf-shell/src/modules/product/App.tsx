import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ProductGrid from './components/ProductGrid';
import { Product } from './components/ProductCard';
import ProductDetail from './pages/ProductDetail';
import Breadcrumb from '../../shared/components/Breadcrumb';
import { useConfigStore } from '../../shared/store/useConfigStore';

// Dummy API
import { ProductApi } from '../../api';

const ProductListingPage = () => {
  const { config } = useConfigStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await ProductApi.getAll(0, 20);
        const mappedProducts = res.content.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.imageUrl,
          category: item.category,
          rating: item.rating,
          isNew: item.isNew
        }));
        setProducts(mappedProducts);
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <Helmet>
        <title>Sản Phẩm | {config.brandName}</title>
        <meta name="description" content={config.productSubtitle} />
      </Helmet>
      
      <Breadcrumb items={[
        { label: 'Trong chủ', path: '/' },
        { label: 'Khám Phá' }
      ]} />
      
      {/* Category Banner */}
      <div className="bg-farm-sand py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-serif font-bold text-farm-primary-dark mb-4">{config.productTitle}</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">{config.productSubtitle}</p>
        </div>
      </div>

      {/* Main Listing */}
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filter Placeholder */}
        <div className="w-full md:w-64 shrink-0">
          <div className="sticky top-24 bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <h3 className="font-serif text-lg font-bold text-farm-primary-dark mb-4">Danh Mục</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="font-medium text-farm-primary cursor-pointer hover:text-farm-primary-dark">Tất cả sản phẩm</li>
              <li className="cursor-pointer hover:text-farm-primary">Rau Ăn Lá</li>
              <li className="cursor-pointer hover:text-farm-primary">Củ Quả Theo Mùa</li>
              <li className="cursor-pointer hover:text-farm-primary">Trái Cây Nhập Khẩu</li>
              <li className="cursor-pointer hover:text-farm-primary">Gia Vị & Thảo Mộc</li>
            </ul>

            <h3 className="font-serif text-lg font-bold text-farm-primary-dark mb-4 mt-8">Mức Giá</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded text-farm-primary focus:ring-farm-primary" /> Dưới 50.000đ</label></li>
              <li><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded text-farm-primary" /> 50.000đ - 100.000đ</label></li>
              <li><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded text-farm-primary" /> Trên 100.000đ</label></li>
            </ul>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <div className="text-gray-500 font-medium">{products.length} sản phẩm được tìm thấy</div>
            <select className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:border-farm-primary cursor-pointer outline-none">
              <option>Sắp xếp: Mới nhất</option>
              <option>Giá: Thấp đến Cao</option>
              <option>Giá: Cao đến Thấp</option>
              <option>Đánh giá cao nhất</option>
            </select>
          </div>
          
          <ProductGrid products={products} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<ProductListingPage />} />
      <Route path="/:id" element={<ProductDetail />} />
    </Routes>
  );
};

export default App;
