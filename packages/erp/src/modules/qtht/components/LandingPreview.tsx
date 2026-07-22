// ============================================================
// LandingPreview — Preview trực tiếp landing page trong ERP admin
// ============================================================
//
// NHIỆM VỤ:
//   Nhận config làm props → render tất cả section của landing page
//   theo cùng cấu trúc như `landing-page/index.html`, nhưng bằng React +
//   Tailwind + inline styles để bind live với form (gõ xong hiện ngay).
//
// LƯU Ý VỀ RULE UI/UX (đọc FE_UI_UX_STANDARD trước khi sửa):
//   File này là MOCKUP của landing page (customer-facing content), KHÔNG
//   phải ERP admin chrome. Do đó chấp nhận vi phạm có kiểm soát:
//   - Emoji trong product/testimonial (mirror landing content thật).
//   - Hex color inline style (do primaryColor động từ color picker admin).
//   - Font "Be Vietnam Pro" (font của landing thật, không phải Inter).
//   - Aspect ratio + shadow lớn (thẩm mỹ marketing, không phải data table).
//   Mọi file khác trong /erp vẫn phải tuân thủ 100% rule.
//
// KHÔNG cần iframe / cross-origin — mọi thứ render trong-trang.
// KHÔNG dùng ảnh/asset ngoài (fallback emoji/svg + solid color) → preview
// hoạt động cả khi backend chưa upload logo/hero image.
// ============================================================

import { useMemo, useState, useEffect, useRef } from 'react'
import {
  Search, ArrowRight, Shield, Clock, CheckCircle2, ChevronLeft, ChevronRight,
  Star, Phone, Mail, MapPin, Facebook, Instagram, Youtube, Send,
  Sprout, Droplets, Radio, Bot, Truck,
  type LucideIcon,
} from 'lucide-react'

// ============================================================
// Types
// ============================================================
export interface LandingConfigLite {
  // Brand
  brandName?: string
  logoUrl?: string
  primaryColor?: string

  // Hero
  heroTitle?: string
  heroSubtitle?: string
  heroImageUrl?: string

  // Sections
  productTitle?: string
  productSubtitle?: string
  opsTitle?: string
  opsSubtitle?: string
  blogTitle?: string
  blogSubtitle?: string
  newsletterTitle?: string
  newsletterSubtitle?: string

  // About / footer
  aboutUs?: string
  footerText?: string

  // Contact
  contactEmail?: string
  contactPhone?: string
  contactAddress?: string
  workingHours?: string
  shippingPolicy?: string

  // Social
  facebookUrl?: string
  instagramUrl?: string
  youtubeUrl?: string
  tiktokUrl?: string
  zaloUrl?: string

  // SEO (không render trong preview nhưng vẫn nhận để hiển thị meta card)
  seoTitle?: string
  seoDescription?: string
  ogImageUrl?: string
}

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

interface Props {
  config: LandingConfigLite
  device?: PreviewDevice
  /** Section được highlight (scroll vào view khi user chọn ở form). */
  highlightSection?: string
  /** ID DOM của container — dùng cho scroll-to-section. */
  id?: string
}

// ============================================================
// Constants — mock data cho phần chưa có API
// ============================================================
const DEMO_PRODUCTS = [
  { name: 'Cải Xanh Bó',    origin: 'Đà Lạt',   price: '12.000',  unit: '/bó', emoji: '🥬', badge: 'Tươi mới', color: '#16a34a' },
  { name: 'Cà Chua Bi',     origin: 'Lâm Đồng', price: '28.000',  unit: '/kg', emoji: '🍅', badge: 'Organic',  color: '#dc2626' },
  { name: 'Xà Lách Lô Lô',  origin: 'Mộc Châu', price: '18.000',  unit: '/bó', emoji: '🥗', badge: 'Organic',  color: '#059669' },
  { name: 'Cà Rốt',         origin: 'Đà Lạt',   price: '22.000',  unit: '/kg', emoji: '🥕', badge: 'Tươi mới', color: '#f97316' },
  { name: 'Húng Quế',       origin: 'Vĩnh Phúc',price: '8.000',   unit: '/bó', emoji: '🌿', badge: 'Tươi mới', color: '#16a34a' },
  { name: 'Bông Cải Xanh',  origin: 'Đà Lạt',   price: '35.000',  unit: '/kg', emoji: '🥦', badge: 'Organic',  color: '#059669' },
  { name: 'Bí Đỏ',          origin: 'Gia Lai',  price: '25.000',  unit: '/kg', emoji: '🎃', badge: '-20%',     color: '#f59e0b' },
  { name: 'Rau Muống',      origin: 'Hưng Yên', price: '10.000',  unit: '/bó', emoji: '🌱', badge: 'Tươi mới', color: '#16a34a' },
]

const AUTOMATION_STEPS = [
  { icon: Sprout,   label: 'Gieo trồng',   desc: 'Robot gieo hạt chính xác, AI lập kế hoạch mùa vụ.' },
  { icon: Droplets, label: 'Tưới tiêu',    desc: 'Drip irrigation điều khiển bằng cảm biến độ ẩm.' },
  { icon: Radio,    label: 'Giám sát',     desc: '1,000+ sensor IoT theo dõi nhiệt độ, CO₂, ánh sáng.' },
  { icon: Bot,      label: 'Thu hoạch',    desc: 'Cánh tay robot + vision AI, năng suất gấp 8 lần.' },
  { icon: Truck,    label: 'Vận chuyển',   desc: 'Xe lạnh 2-8°C, GPS realtime, giao trong 24h.' },
]

const STATS = [
  { icon: '🌿', value: '500+',    label: 'Nông trại đối tác' },
  { icon: '👥', value: '50.000+', label: 'Khách hàng tin dùng' },
  { icon: '🥬', value: '120+',    label: 'Loại rau củ' },
  { icon: '⭐', value: '99%',     label: 'Khách hàng hài lòng' },
]

const TESTIMONIALS = [
  { name: 'Nguyễn Thị Thu',   role: 'Nội trợ, Hà Nội',           avatar: 'NT', color: '#22c55e', text: 'Từ khi dùng Frezo, tôi không còn lo lắng về rau bẩn nữa. Mỗi bó rau đều có QR truy xuất, tươi roi rói, giao đúng giờ.' },
  { name: 'Trần Minh Khoa',   role: 'Chủ nhà hàng, TP.HCM',      avatar: 'TM', color: '#3b82f6', text: 'Nhà hàng chúng tôi đặt rau từ Frezo mỗi ngày. Chất lượng ổn định, giá cạnh tranh, luôn đúng hẹn.' },
  { name: 'Lê Hoàng Nam',     role: 'Kỹ sư CN, Đà Nẵng',         avatar: 'LH', color: '#f59e0b', text: 'Công nghệ automation của Frezo thật sự ấn tượng. Tôi có thể xem trực tiếp nông trại qua app.' },
]

const DEVICE_WIDTHS: Record<PreviewDevice, string> = {
  desktop: '100%',
  tablet:  '768px',
  mobile:  '390px',
}

// ============================================================
// Helpers
// ============================================================

/** Chuyển hex → rgba với alpha (dùng cho overlay/gradient). */
function withAlpha(hex: string, alpha: number): string {
  if (!hex?.startsWith('#')) return `rgba(22, 163, 74, ${alpha})`
  const h = hex.replace('#', '')
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Đảo màu sáng/tối để dùng cho gradient title. */
function shade(hex: string, amount: number): string {
  if (!hex?.startsWith('#')) return '#15803d'
  const h = hex.replace('#', '')
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  const r = Math.max(0, Math.min(255, ((bigint >> 16) & 255) + amount))
  const g = Math.max(0, Math.min(255, ((bigint >> 8) & 255) + amount))
  const b = Math.max(0, Math.min(255, (bigint & 255) + amount))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

// ============================================================
// Main Preview Component
// ============================================================
export function LandingPreview({ config, device = 'desktop', highlightSection, id }: Props) {
  const primary = config.primaryColor || '#16a34a'
  const primaryDark = shade(primary, -30)
  const primaryLight = shade(primary, 30)
  const brand = config.brandName || 'Frezo'
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll-to-section khi user chọn section ở panel bên trái.
  useEffect(() => {
    if (!highlightSection || !containerRef.current) return
    const el = containerRef.current.querySelector(`[data-section="${highlightSection}"]`)
    if (el && 'scrollIntoView' in el) {
      (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [highlightSection])

  return (
    <div
      className="mx-auto bg-white shadow-xl overflow-hidden transition-all duration-300"
      style={{
        width: DEVICE_WIDTHS[device],
        maxWidth: '100%',
        border: device === 'desktop' ? 'none' : '10px solid #1f2937',
        borderRadius: device === 'desktop' ? 12 : 24,
      }}
    >
      <div
        ref={containerRef}
        id={id}
        className="w-full max-h-[calc(100vh-260px)] overflow-y-auto scroll-smooth"
        style={{ fontFamily: '"Be Vietnam Pro", "Inter", system-ui, sans-serif' }}
      >
        <PreviewNavbar brand={brand} logoUrl={config.logoUrl} primary={primary} />

        {/* HERO */}
        <section
          data-section="hero"
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${withAlpha(primary, 0.06)} 0%, ${withAlpha(primaryLight, 0.03)} 100%)`,
            paddingTop: 72,
          }}
        >
          <PreviewHero config={config} primary={primary} primaryDark={primaryDark} />
        </section>

        {/* STATS TICKER */}
        <div
          className="py-3 overflow-hidden text-white text-sm font-semibold whitespace-nowrap"
          style={{ background: `linear-gradient(90deg, ${primaryDark}, ${primary})` }}
        >
          <div className="flex animate-marquee gap-8 px-6">
            {[...STATS, ...STATS].map((s, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                <span className="text-yellow-300 font-bold">{s.value}</span> {s.label}
                <span className="text-white/40 mx-2">✦</span>
              </span>
            ))}
          </div>
        </div>

        {/* ABOUT */}
        <section data-section="about" className="py-16 px-6 md:px-12 bg-white">
          <PreviewAbout config={config} primary={primary} />
        </section>

        {/* PRODUCTS */}
        <section data-section="product" className="py-16 px-6 md:px-12 bg-neutral-50">
          <SectionHeader
            eyebrow="Sản phẩm"
            title={config.productTitle || 'Rau Củ Tươi Mỗi Ngày'}
            subtitle={
              config.productSubtitle ||
              '120+ loại rau củ quả từ các nông trại đối tác được kiểm định nghiêm ngặt theo tiêu chuẩn VietGAP & GlobalGAP.'
            }
            primary={primary}
          />
          <PreviewProducts primary={primary} device={device} />
        </section>

        {/* AUTOMATION */}
        <section data-section="ops" className="py-16 px-6 md:px-12 bg-white">
          <SectionHeader
            eyebrow="Công nghệ"
            title={config.opsTitle || 'Automation Toàn Diện'}
            subtitle={
              config.opsSubtitle ||
              'Hệ thống quản lý nông trại thông minh — từ gieo hạt đến thu hoạch, mọi thứ đều được tự động hoá.'
            }
            primary={primary}
          />
          <PreviewAutomation primary={primary} />
        </section>

        {/* STATS SECTION */}
        <section
          data-section="stats"
          className="py-16 px-6 md:px-12 text-white"
          style={{ background: `linear-gradient(135deg, #0a1a0f, ${primaryDark})` }}
        >
          <SectionHeader
            eyebrow="Con số nói lên tất cả"
            title="Frezo bằng những con số"
            primary="#4ade80"
            light
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mt-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:-translate-y-1 transition-transform">
                <div className="text-4xl mb-2">{s.icon}</div>
                <div className="text-3xl font-black text-green-300 mb-1">{s.value}</div>
                <div className="text-xs text-white/70 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section data-section="testimonials" className="py-16 px-6 md:px-12 bg-neutral-50">
          <SectionHeader
            eyebrow="Khách hàng nói gì"
            title="Hàng nghìn gia đình đã tin tưởng"
            primary={primary}
          />
          <PreviewTestimonials primary={primary} />
        </section>

        {/* NEWSLETTER (small strip trước contact) */}
        {(config.newsletterTitle || config.newsletterSubtitle) && (
          <section
            data-section="newsletter"
            className="py-10 px-6 md:px-12 text-white text-center"
            style={{ background: `linear-gradient(135deg, ${primary}, ${primaryLight})` }}
          >
            <h3 className="text-2xl font-bold mb-2">{config.newsletterTitle || 'Đăng ký nhận tin'}</h3>
            <p className="text-white/90 max-w-xl mx-auto text-sm">
              {config.newsletterSubtitle || 'Nhận thông báo về sản phẩm mới và ưu đãi đặc biệt.'}
            </p>
            <div className="mt-4 max-w-md mx-auto flex gap-2">
              <input
                type="email"
                placeholder="email@example.com"
                className="flex-1 px-4 py-2.5 rounded-lg text-neutral-900 text-sm focus:outline-none"
                disabled
              />
              <button
                type="button"
                className="px-5 py-2.5 rounded-lg bg-white font-semibold text-sm hover:bg-white/95"
                style={{ color: primaryDark }}
                disabled
              >
                Đăng ký
              </button>
            </div>
          </section>
        )}

        {/* CONTACT */}
        <section data-section="contact" className="py-16 px-6 md:px-12 bg-white">
          <PreviewContact config={config} primary={primary} primaryDark={primaryDark} />
        </section>

        {/* FOOTER */}
        <PreviewFooter config={config} primary={primary} />
      </div>

      {/* CSS animation cho ticker + reveal */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 40s linear infinite; }
      ` }} />
    </div>
  )
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function PreviewNavbar({ brand, logoUrl, primary }: { brand: string; logoUrl?: string; primary: string }) {
  return (
    <nav className="absolute top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur border-b border-neutral-100">
      <div className="flex items-center justify-between px-6 md:px-12 py-3">
        <div className="flex items-center gap-2 min-w-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={brand}
              className="h-8 max-w-[120px] object-contain"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
            />
          ) : (
            <span className="text-2xl">🌿</span>
          )}
          <span className="text-lg font-black tracking-tight bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(135deg, ${primary}, ${shade(primary, -30)})` }}>
            {brand}
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-neutral-600">
          <a className="hover:text-neutral-900" href="#about">Về chúng tôi</a>
          <a className="hover:text-neutral-900" href="#product">Sản phẩm</a>
          <a className="hover:text-neutral-900" href="#ops">Automation</a>
          <a className="hover:text-neutral-900" href="#contact">Liên hệ</a>
        </div>
        <button
          type="button"
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-sm font-bold shadow-md"
          style={{ background: `linear-gradient(135deg, ${primary}, ${shade(primary, -30)})` }}
        >
          Đặt hàng ngay <ArrowRight size={14} />
        </button>
      </div>
    </nav>
  )
}

function PreviewHero({
  config, primary, primaryDark,
}: { config: LandingConfigLite; primary: string; primaryDark: string }) {
  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 pt-16 pb-20 grid md:grid-cols-2 gap-10 items-center">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
             style={{ background: withAlpha(primary, 0.1), color: primaryDark }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: primary }} />
          Nền tảng Nông Nghiệp Số #1 Việt Nam
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-neutral-900 leading-tight mb-4">
          {(config.heroTitle || 'Rau Củ Tươi Sạch\nTrực Tiếp Nông Trại')
            .split('\n')
            .map((line, i) => (
              <div key={i} className={i > 0 ? 'bg-clip-text text-transparent' : ''}
                   style={i > 0 ? {
                     backgroundImage: `linear-gradient(135deg, ${primary}, ${primaryDark})`,
                   } : undefined}>
                {line}
              </div>
            ))}
        </h1>
        <p className="text-neutral-600 text-base md:text-lg leading-relaxed mb-6 max-w-lg">
          {config.heroSubtitle ||
            'Frezo ứng dụng công nghệ Automation & IoT tiên tiến — giám sát, thu hoạch và phân phối rau củ tươi đến tận tay bạn trong vòng 24 giờ.'}
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold shadow-lg text-sm"
            style={{ background: `linear-gradient(135deg, ${primary}, ${primaryDark})` }}
          >
            Khám phá sản phẩm <ArrowRight size={16} />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold border-2 text-sm"
            style={{ borderColor: primary, color: primary }}
          >
            <Search size={16} /> Xem công nghệ
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1.5"><Shield size={14} style={{ color: primary }} /> Chứng nhận VietGAP</span>
          <span className="text-neutral-300">·</span>
          <span className="inline-flex items-center gap-1.5"><Clock size={14} style={{ color: primary }} /> Giao trong 24h</span>
          <span className="text-neutral-300">·</span>
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} style={{ color: primary }} /> Hoàn tiền 100%</span>
        </div>
      </div>

      <div className="relative">
        <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] bg-neutral-100 relative">
          {config.heroImageUrl ? (
            <img
              src={config.heroImageUrl}
              alt="Hero"
              className="w-full h-full object-cover"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-8xl"
              style={{ background: `linear-gradient(135deg, ${withAlpha(primary, 0.15)}, ${withAlpha(primaryDark, 0.3)})` }}
            >
              🌿
            </div>
          )}
          <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </div>
        </div>
        {/* Floating cards */}
        <div className="absolute -top-3 -right-3 bg-white shadow-lg rounded-xl px-3 py-2 text-xs flex items-center gap-2">
          <span>🌡️</span>
          <div>
            <div className="text-neutral-500 text-[10px]">Nhiệt độ</div>
            <div className="font-black">24°C</div>
          </div>
        </div>
        <div className="absolute -bottom-3 -left-3 bg-white shadow-lg rounded-xl px-3 py-2 text-xs flex items-center gap-2">
          <span>✅</span>
          <div>
            <div className="text-neutral-500 text-[10px]">Chất lượng</div>
            <div className="font-black" style={{ color: primary }}>98.7%</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({
  eyebrow, title, subtitle, primary, light,
}: { eyebrow?: string; title: string; subtitle?: string; primary: string; light?: boolean }) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-8">
      {eyebrow && (
        <div className="inline-block text-xs font-bold uppercase tracking-widest mb-3"
             style={{ color: primary }}>
          {eyebrow}
        </div>
      )}
      <h2 className={`text-2xl md:text-4xl font-black tracking-tight mb-3 ${light ? 'text-white' : 'text-neutral-900'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-sm md:text-base ${light ? 'text-white/70' : 'text-neutral-600'}`}>{subtitle}</p>
      )}
    </div>
  )
}

function PreviewAbout({ config, primary }: { config: LandingConfigLite; primary: string }) {
  return (
    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
      <div className="aspect-square rounded-3xl overflow-hidden bg-neutral-100 relative shadow-xl">
        <div
          className="absolute inset-0 flex items-center justify-center text-9xl"
          style={{ background: `linear-gradient(135deg, ${withAlpha(primary, 0.15)}, ${withAlpha(primary, 0.05)})` }}
        >
          🥬
        </div>
        <div className="absolute -bottom-3 -right-3 bg-white shadow-xl rounded-2xl p-3 flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <div>
            <div className="font-black text-neutral-900">5 năm</div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Kinh nghiệm</div>
          </div>
        </div>
      </div>
      <div>
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: primary }}>
          Về Frezo
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-neutral-900 mb-4 leading-tight">
          Chúng tôi không chỉ bán rau –<br />
          <span style={{ color: primary }}>chúng tôi bán sự an tâm</span>
        </h2>
        <p className="text-neutral-600 mb-6 leading-relaxed text-sm">
          {config.aboutUs ||
            'Frezo ra đời từ niềm tin rằng mọi gia đình Việt đều xứng đáng được ăn rau củ thật sự sạch, thật sự tươi. Với hệ thống automation tích hợp AI, chúng tôi kiểm soát toàn bộ chuỗi cung ứng từ hạt giống đến bàn ăn.'}
        </p>
        <div className="space-y-3">
          {[
            { icon: '🔍', title: 'Truy xuất nguồn gốc', desc: 'QR code từng lô hàng, biết rõ nông trại nào.' },
            { icon: '📡', title: 'Kiểm soát vi khí hậu', desc: 'Sensor IoT 24/7 theo dõi nhiệt độ, độ ẩm.' },
            { icon: '🚚', title: 'Vận chuyển lạnh', desc: 'Xe chuyên dụng duy trì 2-8°C, bảo đảm tươi.' },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                   style={{ background: withAlpha(primary, 0.1) }}>
                {f.icon}
              </div>
              <div>
                <div className="font-bold text-neutral-900 text-sm">{f.title}</div>
                <div className="text-xs text-neutral-500">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PreviewProducts({ primary, device }: { primary: string; device: PreviewDevice }) {
  const [filter, setFilter] = useState('all')
  const filters = ['all', 'leafy', 'root', 'herb', 'organic']
  const shown = DEMO_PRODUCTS.slice(0, device === 'mobile' ? 4 : 8)
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-center flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition ${
              filter === f
                ? 'text-white border-transparent shadow-md'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
            }`}
            style={filter === f ? { background: primary } : undefined}
          >
            {f === 'all' ? 'Tất cả' : f === 'leafy' ? 'Rau lá' : f === 'root' ? 'Củ quả' : f === 'herb' ? 'Thảo mộc' : 'Organic'}
          </button>
        ))}
      </div>
      <div className={`grid gap-4 ${device === 'mobile' ? 'grid-cols-2' : device === 'tablet' ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {shown.map((p) => (
          <div key={p.name} className="bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:shadow-lg transition group">
            <div className="aspect-square relative flex items-center justify-center text-6xl"
                 style={{ background: `linear-gradient(135deg, ${p.color}15, ${p.color}05)` }}>
              {p.emoji}
              <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: p.color }}>{p.badge}</span>
            </div>
            <div className="p-3">
              <div className="font-bold text-sm text-neutral-900 truncate">{p.name}</div>
              <div className="text-xs text-neutral-500 mt-0.5">📍 {p.origin}</div>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <span className="font-black" style={{ color: primary }}>{p.price}đ</span>
                  <span className="text-xs text-neutral-500">{p.unit}</span>
                </div>
                <button
                  type="button"
                  className="w-7 h-7 rounded-full text-white font-bold text-lg flex items-center justify-center shadow-md"
                  style={{ background: primary }}
                >+</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewAutomation({ primary }: { primary: string }) {
  const [active, setActive] = useState(0)
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-2 mb-6 overflow-x-auto pb-2">
        {AUTOMATION_STEPS.map((s, i) => {
          const Icon = s.icon
          const on = i === active
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => setActive(i)}
              className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition min-w-[80px] ${
                on ? 'shadow-lg' : 'opacity-70 hover:opacity-100'
              }`}
              style={on ? { background: withAlpha(primary, 0.1) } : undefined}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition`}
                   style={{ background: on ? primary : '#f3f4f6', color: on ? '#fff' : '#6b7280' }}>
                <Icon size={18} />
              </div>
              <span className={`text-[11px] font-bold ${on ? 'text-neutral-900' : 'text-neutral-500'}`}>{s.label}</span>
            </button>
          )
        })}
      </div>
      <div className="rounded-2xl p-6 border shadow-sm"
           style={{ background: withAlpha(primary, 0.03), borderColor: withAlpha(primary, 0.15) }}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
               style={{ background: primary, color: '#fff' }}>
            {(() => { const Icon = AUTOMATION_STEPS[active].icon; return <Icon size={24} /> })()}
          </div>
          <div>
            <h3 className="font-black text-neutral-900 mb-1">{AUTOMATION_STEPS[active].label}</h3>
            <p className="text-sm text-neutral-600">{AUTOMATION_STEPS[active].desc}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewTestimonials({ primary }: { primary: string }) {
  const [idx, setIdx] = useState(0)
  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-3 gap-4">
        {TESTIMONIALS.map((t, i) => (
          <div
            key={t.name}
            className={`bg-white p-5 rounded-2xl border transition-all ${
              i === idx ? 'shadow-lg -translate-y-1' : 'border-neutral-100'
            }`}
            style={i === idx ? { borderColor: primary } : undefined}
          >
            <div className="flex text-yellow-400 mb-3">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} fill="currentColor" />)}
            </div>
            <p className="text-sm text-neutral-700 leading-relaxed mb-4">"{t.text}"</p>
            <div className="flex items-center gap-3 pt-3 border-t border-neutral-100">
              <div className="w-10 h-10 rounded-full text-white font-bold text-sm flex items-center justify-center"
                   style={{ background: t.color }}>
                {t.avatar}
              </div>
              <div>
                <div className="font-bold text-sm text-neutral-900">{t.name}</div>
                <div className="text-xs text-neutral-500">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 mt-6">
        <button type="button" onClick={() => setIdx(Math.max(0, idx - 1))}
                className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50">
          <ChevronLeft size={16} />
        </button>
        {TESTIMONIALS.map((_, i) => (
          <span key={i}
                className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'w-6' : ''}`}
                style={{ background: i === idx ? primary : '#d4d4d8' }} />
        ))}
        <button type="button" onClick={() => setIdx(Math.min(TESTIMONIALS.length - 1, idx + 1))}
                className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function PreviewContact({
  config, primary, primaryDark,
}: { config: LandingConfigLite; primary: string; primaryDark: string }) {
  return (
    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: primary }}>
          Liên hệ
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-neutral-900 mb-4 leading-tight">
          Bắt đầu hành trình<br />
          <span style={{ color: primary }}>ăn sạch cùng {config.brandName || 'Frezo'}</span>
        </h2>
        <p className="text-neutral-600 mb-6 text-sm">
          Đăng ký ngay để nhận ưu đãi <strong>20% đơn đầu tiên</strong>.
        </p>
        <div className="space-y-4">
          <ContactRow icon={Phone} label="Hotline" value={config.contactPhone || '1800 - FREZO'} primary={primary} />
          <ContactRow icon={Mail}  label="Email"   value={config.contactEmail || 'hello@frezo.vn'} primary={primary} />
          <ContactRow icon={MapPin} label="Văn phòng" value={config.contactAddress || '123 Nguyễn Huệ, Q.1, TP.HCM'} primary={primary} />
          {config.workingHours && (
            <ContactRow icon={Clock} label="Giờ làm việc" value={config.workingHours} primary={primary} />
          )}
        </div>
      </div>
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-neutral-100">
        <h3 className="font-black text-lg text-neutral-900 mb-4">Đăng ký tư vấn miễn phí</h3>
        {['Họ và tên', 'Số điện thoại', 'Email'].map((label) => (
          <div key={label} className="mb-3">
            <label className="text-xs font-semibold text-neutral-700 mb-1 block">{label}</label>
            <input className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none"
                   placeholder={label === 'Email' ? 'you@example.com' : label === 'Họ và tên' ? 'Nguyễn Văn A' : '0901 234 567'}
                   disabled />
          </div>
        ))}
        <div className="mb-3">
          <label className="text-xs font-semibold text-neutral-700 mb-1 block">Nhu cầu</label>
          <select className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm" disabled>
            <option>Cá nhân / Gia đình</option>
          </select>
        </div>
        <button
          type="button"
          className="w-full py-3 rounded-lg text-white font-bold flex items-center justify-center gap-2 shadow-lg mt-2"
          style={{ background: `linear-gradient(135deg, ${primary}, ${primaryDark})` }}
        >
          Gửi đăng ký ngay <ArrowRight size={16} />
        </button>
        <p className="text-[11px] text-neutral-400 text-center mt-3">
          🔒 Thông tin được bảo mật tuyệt đối. {config.shippingPolicy || 'Chúng tôi sẽ liên hệ trong 24h.'}
        </p>
      </div>
    </div>
  )
}

function ContactRow({ icon: Icon, label, value, primary }: { icon: LucideIcon; label: string; value: string; primary: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{ background: withAlpha(primary, 0.1), color: primary }}>
        <Icon size={18} />
      </div>
      <div>
        <div className="text-[11px] text-neutral-500 uppercase tracking-wider">{label}</div>
        <div className="font-bold text-neutral-900 text-sm">{value}</div>
      </div>
    </div>
  )
}

function PreviewFooter({ config, primary }: { config: LandingConfigLite; primary: string }) {
  const socials = [
    { key: 'facebookUrl',  Icon: Facebook,  url: config.facebookUrl },
    { key: 'instagramUrl', Icon: Instagram, url: config.instagramUrl },
    { key: 'youtubeUrl',   Icon: Youtube,   url: config.youtubeUrl },
    { key: 'zaloUrl',      Icon: Send,      url: config.zaloUrl },
  ].filter((s) => s.url)

  return (
    <footer className="bg-neutral-900 text-white py-12 px-6 md:px-12">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🌿</span>
            <span className="text-lg font-black">{config.brandName || 'Frezo'}</span>
          </div>
          <p className="text-sm text-white/60 leading-relaxed mb-4">
            {config.footerText || 'Rau củ tươi sạch – Automation nông nghiệp – Đến tận tay bạn trong 24h.'}
          </p>
          {socials.length > 0 && (
            <div className="flex gap-2">
              {socials.map(({ key, Icon }) => (
                <span key={key} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
                      style={{ color: primary }}>
                  <Icon size={14} />
                </span>
              ))}
            </div>
          )}
        </div>
        {[
          { title: 'Sản phẩm', items: ['Rau lá', 'Củ quả', 'Thảo mộc', 'Organic'] },
          { title: 'Công ty', items: ['Về chúng tôi', 'Công nghệ', 'Đối tác', 'Tuyển dụng'] },
          { title: 'Hỗ trợ', items: ['Đặt hàng', 'Đổi trả', 'FAQ', 'Bảo mật'] },
        ].map((col) => (
          <div key={col.title}>
            <h4 className="font-bold text-sm mb-3">{col.title}</h4>
            <ul className="space-y-2 text-sm text-white/60">
              {col.items.map((i) => <li key={i}><a className="hover:text-white transition" href="#">{i}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-6xl mx-auto border-t border-white/10 mt-8 pt-6 text-center text-xs text-white/40">
        © 2024 {config.brandName || 'Frezo'}. Bảo lưu mọi quyền.
      </div>
    </footer>
  )
}

export default LandingPreview
