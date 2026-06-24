import React, { useEffect, useRef } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import gsap from 'gsap';

const CartIcon = () => {
  const { items, toggleDrawer } = useCartStore();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const badgeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Shared Event Bus listening
    const handleAddToCart = (e: CustomEvent) => {
      useCartStore.getState().addItem(e.detail);
      
      // Animate badge jump when item is added
      if (badgeRef.current) {
        gsap.fromTo(badgeRef.current, 
          { scale: 1.5, y: -5 },
          { scale: 1, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" }
        );
      }
    };

    window.addEventListener('cart:add' as any, handleAddToCart);
    return () => {
      window.removeEventListener('cart:add' as any, handleAddToCart);
    };
  }, []);

  return (
    <button 
      className="p-2 hover:bg-gray-100 rounded-full transition-colors relative text-gray-700"
      onClick={() => toggleDrawer()}
      aria-label="Open Cart"
    >
      <ShoppingBag size={20} />
      {totalItems > 0 && (
        <span 
          ref={badgeRef}
          className="absolute top-0 right-0 bg-farm-accent text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold"
        >
          {totalItems}
        </span>
      )}
    </button>
  );
};

export default CartIcon;
