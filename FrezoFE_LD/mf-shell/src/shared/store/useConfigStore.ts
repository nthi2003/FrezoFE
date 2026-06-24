import { create } from 'zustand';
import { LandingApi } from '../../api';

interface ConfigState {
    config: {
        brandName: string;
        logoUrl: string;
        primaryColor: string;
        contactEmail: string;
        contactPhone: string;
        aboutUs: string;
        footerText: string;
        heroTitle: string;
        heroSubtitle: string;
        blogTitle: string;
        blogSubtitle: string;
        productTitle: string;
        productSubtitle: string;
        opsTitle: string;
        opsSubtitle: string;
        shippingPolicy: string;
        contactAddress: string;
        workingHours: string;
        newsletterTitle: string;
        newsletterSubtitle: string;
    };
    loading: boolean;
    fetchConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
    config: {
        brandName: 'Frezo - Cung ứng thực phẩm toàn quốc',
        logoUrl: '/logo.png',
        primaryColor: '#16a34a',
        contactEmail: 'hotro@frezo.vn',
        contactPhone: '1900 6868',
        aboutUs: '',
        footerText: '© 2026 Frezo - Cung ứng thực phẩm toàn quốc. Giao diện Micro Frontend GSAP.',
        heroTitle: 'Trải Nghiệm Hương Vị Thuần Khiết Từ Thiên Nhiên',
        heroSubtitle: 'Chúng tôi mang đến giải pháp nông sản sạch, minh bạch nguồn gốc và tràn đầy sức sống cho bữa ăn gia đình bạn.',
        blogTitle: 'Tạp Chí Nông Trại Xanh',
        blogSubtitle: 'Cập nhật những xu hướng ẩm thực sạch, mẹo vặt gia đình và những câu chuyện thú vị từ vùng nguyên liệu.',
        productTitle: 'Sản Phẩm Từ Tâm',
        productSubtitle: 'Từng hạt mầm được chăm sóc bởi lòng nhiệt huyết và quy trình kiểm định khắt khe.',
        opsTitle: 'Quy Trình Thực Tế',
        opsSubtitle: 'Từ mảnh vườn tâm huyết đến bàn ăn ấm cúng',
        shippingPolicy: 'Giao hàng miễn phí cho đơn từ 500.000đ',
        contactAddress: '76 Đường số 7, Khu phố 5, Bình Trưng, TP HCM',
        workingHours: 'Thứ 2 - Chủ nhật: 7:00 - 21:00',
        newsletterTitle: 'Đăng Ký Nhận Tin Tức',
        newsletterSubtitle: 'Nhận ngay Voucher 100K cho đơn hàng đầu tiên',
    },
    loading: false,
    fetchConfig: async () => {
        set({ loading: true });
        try {
            const data = await LandingApi.getConfig();
            if (data) {
                set({ config: data });
                // Dynamically update primary color in CSS variables if needed
                document.documentElement.style.setProperty('--farm-primary', data.primaryColor);
            }
        } catch (error) {
            console.error('Failed to fetch landing config:', error);
        } finally {
            set({ loading: false });
        }
    },
}));
