import React, { useRef, useEffect } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import gsap from 'gsap';

const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

const CartDrawer = () => {
  const { items, isOpen, toggleDrawer, removeItem, updateQuantity } = useCartStore();
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  // GSAP animation for Drawer
  useEffect(() => {
    if (isOpen) {
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.3, ease: 'power2.out', display: 'block' });
      gsap.to(drawerRef.current, { x: 0, duration: 0.4, ease: 'power3.out' });
      
      // Stagger animate items
      gsap.fromTo('.cart-item-anim', 
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.1 }
      );
    } else {
      gsap.to(drawerRef.current, { x: '100%', duration: 0.3, ease: 'power2.in' });
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => {
        if (overlayRef.current) overlayRef.current.style.display = 'none';
      }});
    }
  }, [isOpen]);

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <>
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] hidden opacity-0"
        onClick={() => toggleDrawer(false)}
      />
      
      <div 
        ref={drawerRef}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] translate-x-full flex flex-col border-l border-gray-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
          <h2 className="font-serif text-xl font-bold text-farm-primary-dark">Giỏ Hàng Của Bạn</h2>
          <button 
            onClick={() => toggleDrawer(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div ref={itemsContainerRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
                <ShoppingBag size={40} className="text-gray-300" />
              </div>
              <p>Giỏ hàng đang trống</p>
              <button 
                onClick={() => toggleDrawer(false)}
                className="mt-4 px-6 py-2 border border-farm-primary text-farm-primary rounded-lg font-medium hover:bg-farm-primary hover:text-white transition-colors"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="cart-item-anim flex gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-50">
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg bg-gray-50" />
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-farm-primary-dark text-sm line-clamp-2">{item.name}</h4>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="text-farm-primary font-bold text-sm mt-1 mb-auto">
                    {formatCurrency(item.price)}
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-gray-200 rounded-md">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 text-gray-500 hover:bg-gray-50" disabled={item.quantity <= 1}><Minus size={14}/></button>
                      <span className="px-3 text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 text-gray-500 hover:bg-gray-50"><Plus size={14}/></button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Checkout */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-6 bg-gray-50">
            <div className="flex justify-between mb-4 text-sm font-medium">
              <span className="text-gray-500">Tạm tính</span>
              <span className="text-farm-primary-dark font-bold text-lg">{formatCurrency(totalAmount)}</span>
            </div>
            <p className="text-xs text-gray-400 mb-6 text-center">Phí vận chuyển sẽ được tính ở bước thanh toán.</p>
            <div className="flex flex-col gap-3">
              <a href="/cart" className="w-full text-center py-3 border-2 border-farm-primary text-farm-primary font-bold rounded-xl hover:bg-farm-primary hover:text-white transition-colors">
                Xem Giỏ Hàng
              </a>
              <a href="/checkout" className="w-full text-center py-3 bg-farm-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-farm-primary-dark transition-colors shadow-lg shadow-farm-primary/30">
                Thanh Toán Mua Hàng <ArrowRight size={18} />
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
