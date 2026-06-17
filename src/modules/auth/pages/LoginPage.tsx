// ============================================================
// FREZO ERP — Login Page
// Premium split-layout with animated background & glassmorphism
// ============================================================

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Loader2, AlertCircle, LogIn, ShieldCheck, BarChart3, Users, Zap, Settings2, X, Globe, Server, Database, Monitor } from 'lucide-react'
import { useLogin } from '../hooks/useLogin'

// ---- Animated floating particles ----
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="login-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  )
}

// ---- Feature card for branding panel ----
function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.06] border border-white/[0.08]
      backdrop-blur-sm hover:bg-white/[0.1] transition-all duration-300 group">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400/20 to-emerald-600/20
        flex items-center justify-center shrink-0 group-hover:from-emerald-400/30 group-hover:to-emerald-600/30 transition-all">
        <Icon size={16} className="text-emerald-400" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white/90">{title}</div>
        <div className="text-xs text-white/50 mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </div>
  )
}

export function LoginPage() {
  const { login, isLoading, isError, error } = useLogin()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ username: '', password: '' })
  const [mounted, setMounted] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  // Shake animation on error
  useEffect(() => {
    if (isError) {
      setShake(true)
      const t = setTimeout(() => setShake(false), 600)
      return () => clearTimeout(t)
    }
  }, [isError])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username || !form.password) return
    login(form)
  }

  const errorMsg = (() => {
    if (!isError || !error) return null
    const axiosErr = error as { response?: { data?: { message?: string } }; message?: string }
    return axiosErr?.response?.data?.message || axiosErr?.message || 'Đăng nhập thất bại'
  })()

  return (
    <div className="min-h-screen flex bg-[#060d09] overflow-hidden relative">

      {/* ============ ADVANCED TOGGLE BUTTON (top-right) ============ */}
      <button
        onClick={() => setShowAdvanced(prev => !prev)}
        title="Nâng cao"
        className={`fixed top-5 right-5 z-50 w-10 h-10 rounded-xl flex items-center justify-center
          border transition-all duration-300 group
          ${showAdvanced
            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 rotate-90 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
            : 'bg-white/[0.04] border-white/[0.08] text-white/30 hover:text-white/60 hover:bg-white/[0.08] hover:border-white/[0.15]'
          }
        `}
      >
        <Settings2 size={18} className="transition-transform duration-300" />
      </button>

      {/* ============ ADVANCED SIDEBAR (slide from left) ============ */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300
          ${showAdvanced ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setShowAdvanced(false)}
      />

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[320px] bg-[#0c1610]/95 backdrop-blur-xl
          border-r border-white/[0.08] shadow-[4px_0_40px_rgba(0,0,0,0.5)]
          transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${showAdvanced ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400/20 to-emerald-600/20
              flex items-center justify-center">
              <Settings2 size={14} className="text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-white/80">Cài đặt nâng cao</span>
          </div>
          <button
            onClick={() => setShowAdvanced(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30
              hover:text-white/60 hover:bg-white/[0.06] transition-all duration-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Server Config */}
          <div className="space-y-3">
            <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Máy chủ</div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <Globe size={15} className="text-emerald-400/60 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider">API URL</div>
                  <div className="text-xs text-white/70 font-mono mt-0.5 truncate">http://localhost:8080</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <Server size={15} className="text-emerald-400/60 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider">Phiên bản</div>
                  <div className="text-xs text-white/70 font-mono mt-0.5">v1.0.0-beta</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <Database size={15} className="text-emerald-400/60 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider">Database</div>
                  <div className="text-xs text-white/70 font-mono mt-0.5">PostgreSQL</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <Monitor size={15} className="text-emerald-400/60 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider">Môi trường</div>
                  <div className="text-xs text-white/70 font-mono mt-0.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Development
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="space-y-3">
            <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Giao diện</div>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">Hiệu ứng hạt nổi</span>
                </div>
                <div className="relative">
                  <input type="checkbox" defaultChecked className="peer sr-only" />
                  <div className="w-9 h-5 rounded-full bg-white/10 peer-checked:bg-emerald-500/60 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white/60 peer-checked:bg-white
                    peer-checked:translate-x-4 transition-all shadow-sm" />
                </div>
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">Hiệu ứng gradient</span>
                </div>
                <div className="relative">
                  <input type="checkbox" defaultChecked className="peer sr-only" />
                  <div className="w-9 h-5 rounded-full bg-white/10 peer-checked:bg-emerald-500/60 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white/60 peer-checked:bg-white
                    peer-checked:translate-x-4 transition-all shadow-sm" />
                </div>
              </label>
            </div>
          </div>

          {/* Keyboard shortcuts */}
          <div className="space-y-3">
            <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Phím tắt</div>
            <div className="space-y-1.5">
              {[
                { keys: ['Enter'], desc: 'Đăng nhập' },
                { keys: ['Tab'], desc: 'Chuyển trường' },
                { keys: ['Ctrl', 'H'], desc: 'Ẩn/hiện mật khẩu' },
              ].map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-1">
                  <span className="text-[11px] text-white/40">{shortcut.desc}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((k, j) => (
                      <kbd key={j} className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]
                        text-[10px] text-white/50 font-mono min-w-[24px] text-center">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="px-5 py-4 border-t border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
            <span className="text-[11px] text-white/30">Hệ thống hoạt động bình thường</span>
          </div>
        </div>
      </div>

      {/* ============ LEFT PANEL — Branding ============ */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[58%] relative flex-col justify-between p-10 xl:p-14 overflow-hidden">

        {/* Animated gradient orbs */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[120px] login-orb-1" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px] login-orb-2" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-teal-500/8 rounded-full blur-[80px] login-orb-3" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <FloatingParticles />

        {/* Top — Logo + tagline */}
        <div className={`relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center
              shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <span className="text-white font-extrabold text-xl tracking-tight">F</span>
            </div>
            <div>
              <div className="text-white font-bold text-xl tracking-tight">Frezo ERP</div>
              <div className="text-emerald-400/70 text-[11px] font-medium tracking-widest uppercase">Enterprise Platform</div>
            </div>
          </div>
        </div>

        {/* Center — Hero text */}
        <div className={`relative z-10 -mt-10 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h1 className="text-[2.8rem] xl:text-5xl font-extrabold text-white leading-[1.1] mb-5">
            Quản trị doanh nghiệp
            <span className="block bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              thông minh & hiệu quả
            </span>
          </h1>
          <p className="text-white/40 text-base max-w-md leading-relaxed">
            Nền tảng ERP toàn diện giúp tối ưu hoạt động kinh doanh, nhân sự, tài chính và quản lý tổ chức.
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-3 mt-8 max-w-lg">
            <FeatureCard icon={Users} title="Quản lý nhân sự" desc="Hồ sơ, chấm công, lương tự động" />
            <FeatureCard icon={BarChart3} title="Báo cáo thời gian thực" desc="Dashboard trực quan, dữ liệu live" />
            <FeatureCard icon={ShieldCheck} title="Bảo mật đa lớp" desc="Phân quyền Role, IP Trust, 2FA" />
            <FeatureCard icon={Zap} title="Hiệu suất cao" desc="Xử lý nhanh, auto scaling" />
          </div>
        </div>

        {/* Bottom — stats */}
        <div className={`relative z-10 flex items-center gap-8 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['#22c55e', '#16a34a', '#15803d', '#166534'].map((bg, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-[#060d09] flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: bg, zIndex: 4 - i }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <div>
              <div className="text-white text-sm font-semibold">500+</div>
              <div className="text-white/40 text-[10px]">Người dùng</div>
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-white text-sm font-semibold">99.9%</div>
            <div className="text-white/40 text-[10px]">Uptime</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-white text-sm font-semibold">24/7</div>
            <div className="text-white/40 text-[10px]">Hỗ trợ</div>
          </div>
        </div>
      </div>

      {/* ============ RIGHT PANEL — Login Form ============ */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative">

        {/* Subtle gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1510] via-[#0c1a12] to-[#060d09]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-600/5 rounded-full blur-[80px]" />

        <div className={`relative z-10 w-full max-w-[420px] transition-all duration-700 delay-300
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          ${shake ? 'login-shake' : ''}
        `}>

          {/* Mobile branding (hidden on desktop) */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center
              shadow-[0_0_20px_rgba(34,197,94,0.25)]">
              <span className="text-white font-extrabold text-lg">F</span>
            </div>
            <div>
              <div className="text-white font-bold text-lg">Frezo ERP</div>
              <div className="text-emerald-400/60 text-[10px] font-medium tracking-widest uppercase">Enterprise Platform</div>
            </div>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl
            shadow-[0_8px_60px_-12px_rgba(0,0,0,0.6)] overflow-hidden">

            {/* Header */}
            <div className="px-7 pt-8 pb-5">
              <h1 className="text-[1.65rem] font-bold text-white tracking-tight">Chào mừng trở lại</h1>
              <p className="text-sm text-white/40 mt-1.5">Đăng nhập để truy cập hệ thống quản trị</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-7 pb-7 space-y-5">

              {/* Error message */}
              {errorMsg && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/15
                  rounded-xl text-sm text-red-400 animate-fade-in backdrop-blur-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Username */}
              <div className="space-y-2">
                <label htmlFor="login-username" className="block text-xs font-medium text-white/50 uppercase tracking-wider">
                  Tên đăng nhập
                </label>
                <div className={`relative rounded-xl transition-all duration-300
                  ${focusedField === 'username' ? 'ring-2 ring-emerald-500/40 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : ''}
                `}>
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`transition-colors duration-200 ${focusedField === 'username' ? 'text-emerald-400' : 'text-white/20'}`}>
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <input
                    id="login-username"
                    type="text"
                    autoComplete="username"
                    placeholder="Nhập tên đăng nhập"
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isLoading}
                    className="w-full h-12 pl-10 pr-4 bg-white/[0.05] border border-white/[0.08] rounded-xl
                      text-sm text-white placeholder:text-white/20
                      focus:outline-none focus:border-emerald-500/30
                      disabled:opacity-40 transition-all duration-200
                      hover:bg-white/[0.07] hover:border-white/[0.12]"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="login-password" className="block text-xs font-medium text-white/50 uppercase tracking-wider">
                  Mật khẩu
                </label>
                <div className={`relative rounded-xl transition-all duration-300
                  ${focusedField === 'password' ? 'ring-2 ring-emerald-500/40 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : ''}
                `}>
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`transition-colors duration-200 ${focusedField === 'password' ? 'text-emerald-400' : 'text-white/20'}`}>
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isLoading}
                    className="w-full h-12 pl-10 pr-11 bg-white/[0.05] border border-white/[0.08] rounded-xl
                      text-sm text-white placeholder:text-white/20
                      focus:outline-none focus:border-emerald-500/30
                      disabled:opacity-40 transition-all duration-200
                      hover:bg-white/[0.07] hover:border-white/[0.12]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-white/25
                      hover:text-white/50 hover:bg-white/[0.05] transition-all duration-150"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="w-4 h-4 rounded border border-white/15 bg-white/[0.04]
                      peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all duration-200
                      group-hover:border-white/25" />
                    <svg className="absolute top-0.5 left-0.5 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs text-white/40 group-hover:text-white/55 transition-colors select-none">Ghi nhớ đăng nhập</span>
                </label>
                <button type="button" className="text-xs text-emerald-400/70 hover:text-emerald-400 transition-colors duration-200">
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit */}
              <button
                id="btn-login"
                type="submit"
                disabled={isLoading || !form.username || !form.password}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600
                  hover:from-emerald-400 hover:to-emerald-500
                  active:from-emerald-600 active:to-emerald-700
                  text-white text-sm font-semibold rounded-xl
                  flex items-center justify-center gap-2.5
                  transition-all duration-200
                  shadow-[0_4px_20px_rgba(34,197,94,0.25)]
                  hover:shadow-[0_6px_30px_rgba(34,197,94,0.35)]
                  active:shadow-[0_2px_10px_rgba(34,197,94,0.2)]
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                  disabled:hover:from-emerald-500 disabled:hover:to-emerald-600
                  hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={17} />
                    <span>Đăng nhập</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] text-white/20 uppercase tracking-widest font-medium">Bảo mật</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Security note */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <ShieldCheck size={13} className="text-emerald-500/40" />
                <span className="text-[11px] text-white/25">Kết nối được mã hóa SSL 256-bit</span>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-[11px] text-white/15">
              © 2025 Frezo ERP — All rights reserved
            </p>
          </div>
        </div>
      </div>

      {/* ============ INLINE STYLES for animations ============ */}
      <style>{`
        @keyframes loginOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes loginOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 20px) scale(1.08); }
          66% { transform: translate(15px, -10px) scale(0.92); }
        }
        @keyframes loginOrb3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50% { transform: translate(20px, -15px) scale(1.1); opacity: 0.8; }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
          10% { opacity: 0.6; }
          50% { opacity: 0.3; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-80px) translateX(20px); opacity: 0; }
        }
        @keyframes loginShake {
          0%, 100% { transform: translateX(0); }
          10%, 50%, 90% { transform: translateX(-4px); }
          30%, 70% { transform: translateX(4px); }
        }
        .login-orb-1 { animation: loginOrb1 12s ease-in-out infinite; }
        .login-orb-2 { animation: loginOrb2 15s ease-in-out infinite; }
        .login-orb-3 { animation: loginOrb3 10s ease-in-out infinite; }
        .login-particle {
          position: absolute;
          background: radial-gradient(circle, rgba(34,197,94,0.6) 0%, transparent 70%);
          border-radius: 50%;
          animation: floatParticle 8s ease-in-out infinite;
        }
        .login-shake {
          animation: loginShake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
