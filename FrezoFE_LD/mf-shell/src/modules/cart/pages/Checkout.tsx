import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, Truck, CheckCircle } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Breadcrumb from '../../../shared/components/Breadcrumb';

const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

const Checkout = () => {
  const { items, clearCart } = useCartStore();
  const [success, setSuccess] = useState(false);

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = totalAmount > 500000 ? 0 : 35000;
  const finalTotal = totalAmount + shippingFee;

  useGSAP(() => {
    gsap.from('.checkout-anim', {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out'
    });
  }, []);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setSuccess(true);
      clearCart();
    }, 1500);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm text-center max-w-lg w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-serif text-farm-primary-dark font-bold mb-4">Đặt hàng thành công!</h2>
          <p className="text-gray-600 mb-8">Cảm ơn bạn đã mua hàng tại Frezo. Đơn hàng của bạn đang được xử lý và sẽ được giao trong thời gian sớm nhất.</p>
          <a href="/" className="inline-block bg-farm-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-farm-primary-dark transition-colors">
            Tiếp tục mua sắm
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>Thanh Toán | Nông Sản Sạch Frezo</title>
      </Helmet>
      
      <Breadcrumb items={[
        { label: 'Trong chủ', path: '/' },
        { label: 'Giỏ Hàng', path: '/cart' },
        { label: 'Thanh Toán' }
      ]} />
      
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-serif text-farm-primary-dark font-bold mb-8 text-center md:text-left checkout-anim">Thủ Tục Thanh Toán</h1>
        
        {items.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center shadow-sm checkout-anim">
            <p className="text-gray-500 mb-6">Giỏ hàng của bạn đang trống.</p>
            <a href="/products" className="text-farm-primary font-bold hover:underline">Quay lại cửa hàng</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <form id="checkout-form" onSubmit={handleCheckout} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 checkout-anim">
                <h3 className="text-xl font-bold text-farm-primary-dark mb-6">Thông Tin Giao Hàng</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                    <input required type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-farm-primary focus:ring-1 focus:ring-farm-primary transition-all" placeholder="Nhập họ tên" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <input required type="tel" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-farm-primary focus:ring-1 focus:ring-farm-primary transition-all" placeholder="Nhập số điện thoại" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ chi tiết</label>
                    <input required type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-farm-primary focus:ring-1 focus:ring-farm-primary transition-all" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú cho đơn hàng</label>
                    <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-farm-primary focus:ring-1 focus:ring-farm-primary transition-all" placeholder="Ghi chú về thời gian giao hàng..."></textarea>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-farm-primary-dark mb-6 mt-8">Phương Thức Thanh Toán</h3>
                <div className="space-y-4">
                  <label className="flex items-center p-4 border border-farm-primary bg-farm-primary/5 rounded-xl cursor-pointer">
                    <input type="radio" name="payment" defaultChecked className="text-farm-primary focus:ring-farm-primary w-4 h-4" />
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-gray-900">Thanh toán khi nhận hàng (COD)</span>
                      <span className="block text-xs text-gray-500">Thanh toán bằng tiền mặt khi giao hàng</span>
                    </div>
                  </label>
                  <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="payment" className="text-farm-primary focus:ring-farm-primary w-4 h-4" />
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-gray-900">Chuyển khoản qua Ngân hàng / VNPay</span>
                      <span className="block text-xs text-gray-500">Mã QR hoặc thông tin CK sẽ hiện sau khi đặt hàng</span>
                    </div>
                  </label>
                </div>
              </form>
            </div>
            
            <div className="lg:col-span-5">
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24 checkout-anim">
                <h3 className="text-xl font-bold text-farm-primary-dark mb-6">Tóm Tắt Đơn Hàng</h3>
                <div className="space-y-4 mb-6">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative">
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg bg-gray-50 border border-gray-100" />
                        <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full z-10">{item.quantity}</span>
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="text-sm font-medium text-gray-800 line-clamp-2">{item.name}</h4>
                        <div className="text-gray-500 text-sm mt-1">{formatCurrency(item.price)}</div>
                      </div>
                      <div className="font-bold text-sm text-farm-primary-dark flex items-center">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-6 space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển</span>
                    <span>{shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between items-end border-t border-gray-100 pt-4 mt-2">
                    <span className="text-lg font-bold text-gray-800">Tổng cộng</span>
                    <span className="text-2xl font-bold text-farm-primary">{formatCurrency(finalTotal)}</span>
                  </div>
                </div>

                <button form="checkout-form" type="submit" className="w-full bg-farm-accent hover:bg-farm-accent-light text-farm-primary-dark py-4 rounded-xl font-bold shadow-lg shadow-farm-accent/30 transition-all flex justify-center items-center gap-2">
                  <ShieldCheck size={20} /> Đặt Hàng Ngay
                </button>
                
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Truck size={14} className="text-farm-primary" /> Có thể giao hàng trong ngày ở TP.HCM
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
