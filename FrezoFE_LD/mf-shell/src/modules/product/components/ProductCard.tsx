import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  isNew?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, { y: -8, duration: 0.3, ease: 'power2.out', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' });
    gsap.to(cardRef.current?.querySelector('.add-btn'), { opacity: 1, y: 0, duration: 0.3 });
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, { y: 0, duration: 0.3, ease: 'power2.out', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' });
    gsap.to(cardRef.current?.querySelector('.add-btn'), { opacity: 0, y: 10, duration: 0.3 });
  };

  return (
    <div 
      ref={cardRef}
      className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-50 flex flex-col h-full relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {product.isNew && <span className="bg-farm-primary text-white text-xs font-bold px-2 py-1 rounded-sm">MỚI</span>}
        {product.category === 'Organic' && <span className="bg-farm-accent text-white text-xs font-bold px-2 py-1 rounded-sm">HỮU CƠ</span>}
      </div>
      
      {/* Wishlist Button */}
      <button className="absolute top-3 right-3 z-10 p-2 bg-white/80 hover:bg-red-50 hover:text-red-500 rounded-full backdrop-blur-sm transition-colors shadow-sm">
        <Heart size={18} />
      </button>

      {/* Product Image Wrapper */}
      <Link to={`/products/${product.id}`} className="aspect-square overflow-hidden bg-gray-50 relative group block">
        <img 
          src={product.image} 
          alt={product.name} 
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Quick Add Button Reveal */}
        <div className="add-btn absolute bottom-0 left-0 w-full p-4 opacity-0 translate-y-2">
          <button 
            onClick={(e) => {
              e.preventDefault();
              onAddToCart(product);
            }}
            className="w-full bg-farm-primary/95 backdrop-blur-sm hover:bg-farm-primary text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg transition-colors"
          >
            <ShoppingCart size={18} /> Thêm Vào Giỏ
          </button>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">{product.category}</div>
        <Link to={`/products/${product.id}`} className="font-serif text-lg text-farm-primary-dark font-bold mb-2 line-clamp-2 hover:text-farm-primary transition-colors">
          {product.name}
        </Link>
        
        <div className="flex items-center gap-1 mb-3 mt-auto">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={14} className={i < Math.floor(product.rating) ? "fill-orange-400 text-orange-400" : "fill-gray-200 text-gray-200"} />
          ))}
          <span className="text-xs text-gray-500 ml-1">({product.rating})</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-farm-primary">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
