import React, { useRef } from 'react';
import ProductCard, { Product } from './ProductCard';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface ProductGridProps {
  title?: string;
  description?: string;
  products: Product[];
  isLoading?: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({ title, description, products, isLoading }) => {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!isLoading && products.length > 0) {
      gsap.from('.product-card-wrapper', {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.05,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 80%',
        }
      });
    }
  }, [isLoading, products]);

  const handleAddToCart = (product: Product) => {
    // Shared Event Bus
    console.log('Thêm vào giỏ hàng:', product);
    const event = new CustomEvent('cart:add', { detail: product });
    window.dispatchEvent(event);
  };

  if (isLoading) {
    return (
      <div className="py-12">
        {(title || description) && (
          <div className="text-center mb-10">
            {title && <h2 className="text-3xl font-serif text-farm-primary-dark font-bold mb-3">{title}</h2>}
            {description && <p className="text-gray-500 max-w-2xl mx-auto">{description}</p>}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full animate-pulse">
              <div className="aspect-square bg-gray-200"></div>
              <div className="p-5 flex flex-col gap-3">
                <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
                <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-4 w-1/4 bg-gray-200 rounded mt-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={gridRef} className="py-12">
      {(title || description) && (
        <div className="text-center mb-10">
          {title && <h2 className="text-3xl font-serif text-farm-primary-dark font-bold mb-3">{title}</h2>}
          {description && <p className="text-gray-500 max-w-2xl mx-auto">{description}</p>}
        </div>
      )}
      
      {products.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl">
          <p className="text-gray-500">Chưa có sản phẩm nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-x-6 gap-y-10">
          {products.map(product => (
            <div key={product.id} className="product-card-wrapper h-full">
              <ProductCard product={product} onAddToCart={handleAddToCart} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
