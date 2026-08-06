// ============================================================
// FREZO ERP — Login Page
// Premium split-layout with animated background & glassmorphism
// ============================================================

import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, Loader2, AlertCircle, LogIn, ShieldCheck, Settings2, X,
  Globe, Server, Database, Monitor, Lock, WifiOff, ShieldAlert, ServerCrash,
  KeyRound, ArrowRight,
} from 'lucide-react'
import { Portal } from '@frezo/ui'
import { toast } from 'sonner'
import { SESSION_REVOKED_KEY } from '@/lib/axios/axiosClient'
import { useLogin } from '../hooks/useLogin'
import { parseAuthError, type AuthError } from '../utils/parseAuthError'
import logoSrc from '@/img/logo.png'

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

export function LoginPage() {
  const nav = useNavigate()
  const { login, isLoading, isError, error } = useLogin()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ username: '', password: '' })
  const [mounted, setMounted] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // ---- Client-side validation ----
  // Chỉ show validation lỗi SAU KHI user chạm vào field (touched) → tránh hiển thị đỏ ngay lúc load page.
  const [touched, setTouched] = useState<{ username?: boolean; password?: boolean }>({})

  // ---- Failed attempts counter (client-side) ----
  // Dùng để gợi ý "Quên mật khẩu?" sau 3 lần sai + kích shake tăng dần intensity.
  const [failedAttempts, setFailedAttempts] = useState(0)

  // ---- Caps Lock detection cho password field ----
  const [capsLockOn, setCapsLockOn] = useState(false)

  // ---- Retry countdown (khi BE trả 429 hoặc IP blocked) ----
  const [retryCountdown, setRetryCountdown] = useState(0)

  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  // Auto-focus username khi mount
  useEffect(() => {
    const t = setTimeout(() => {
      setMounted(true)
      usernameRef.current?.focus()
    }, 50)
    return () => clearTimeout(t)
  }, [])

  // Phiên bị thu hồi / hết hạn — toast một lần sau redirect từ axios interceptor
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_REVOKED_KEY)) {
        sessionStorage.removeItem(SESSION_REVOKED_KEY)
        toast.info('Phiên đăng nhập đã hết hạn hoặc bị thu hồi. Vui lòng đăng nhập lại.')
      }
    } catch {
      /* ignore */
    }
  }, [])

  // ---- Parse error thành typed object (memo tránh re-parse mỗi render) ----
  const authError = useMemo<AuthError | null>(() => {
    if (!isError || !error) return null
    return parseAuthError(error, { failedAttempts })
  }, [isError, error, failedAttempts])

  // Khi có lỗi mới → shake + focus lại field cần thiết + clear password nếu cần
  useEffect(() => {
    if (!authError) return
    setShake(true)
    const shakeT = setTimeout(() => setShake(false), 600)

    // Clear password (không clear username — user không cần gõ lại)
    if (authError.clearField === 'password' || authError.clearField === 'both') {
      setForm((f) => ({ ...f, password: '' }))
    }
    if (authError.clearField === 'both') {
      setForm({ username: '', password: '' })
    }

    // Focus lại field cần retry, delay nhỏ để shake xong
    const focusT = setTimeout(() => {
      if (authError.focusField === 'username') usernameRef.current?.focus()
      else passwordRef.current?.focus()
    }, 100)

    // Kích countdown nếu BE bảo phải chờ
    if (authError.retryAfterSeconds) {
      setRetryCountdown(authError.retryAfterSeconds)
    }

    return () => {
      clearTimeout(shakeT)
      clearTimeout(focusT)
    }
  }, [authError])

  // Countdown timer
  useEffect(() => {
    if (retryCountdown <= 0) return
    const iv = setInterval(() => setRetryCountdown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(iv)
  }, [retryCountdown])

  // Detect Caps Lock — chỉ báo khi user đang focus password field
  const handlePasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockOn(e.getModifierState('CapsLock'))
    }
  }

  // Validation errors — chỉ hiển thị khi field đã touched
  const usernameError =
    touched.username && !form.username.trim() ? 'Vui lòng nhập tên đăng nhập' : null
  const passwordError =
    touched.password && !form.password ? 'Vui lòng nhập mật khẩu' : null

  const canSubmit =
    !isLoading &&
    retryCountdown === 0 &&
    form.username.trim().length > 0 &&
    form.password.length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ username: true, password: true })
    if (!canSubmit) return
    login(form, {
      onError: () => setFailedAttempts((n) => n + 1),
      onSuccess: () => setFailedAttempts(0),
    })
  }

  return (
    <div className="min-h-screen flex bg-white overflow-hidden relative">

      {/* ============ ADVANCED TOGGLE BUTTON (top-right) ============ */}
      <button
        onClick={() => setShowAdvanced(prev => !prev)}
        title="Nâng cao"
        className={`fixed top-5 right-5 z-50 w-10 h-10 rounded-xl flex items-center justify-center
          border transition-all duration-300 group
          ${showAdvanced
            ? 'bg-emerald-100 border-emerald-300 text-emerald-600 rotate-90 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
            : 'bg-neutral-50 border-neutral-200 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300'
          }
        `}
      >
        <Settings2 size={18} className="transition-transform duration-300" />
      </button>

      {/* ============ ADVANCED SIDEBAR (slide from left) ============ */}
      <Portal>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300
          ${showAdvanced ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setShowAdvanced(false)}
      />

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[320px] bg-white backdrop-blur-xl
          border-r border-neutral-200 shadow-2xl
          transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${showAdvanced ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100
              flex items-center justify-center">
              <Settings2 size={14} className="text-emerald-600" />
            </div>
            <span className="text-sm font-semibold text-neutral-800">Cài đặt nâng cao</span>
          </div>
          <button
            onClick={() => setShowAdvanced(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400
              hover:text-neutral-600 hover:bg-neutral-50 transition-all duration-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Server Config */}
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Máy chủ</div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                <Globe size={15} className="text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider">API URL</div>
                  <div className="text-xs text-neutral-700 font-mono mt-0.5 truncate">http://localhost:8080</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                <Server size={15} className="text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Phiên bản</div>
                  <div className="text-xs text-neutral-700 font-mono mt-0.5">v1.0.0-beta</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                <Database size={15} className="text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Database</div>
                  <div className="text-xs text-neutral-700 font-mono mt-0.5">PostgreSQL</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                <Monitor size={15} className="text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Môi trường</div>
                  <div className="text-xs text-neutral-700 font-mono mt-0.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Development
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Giao diện</div>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-neutral-600 group-hover:text-neutral-800 transition-colors">Hiệu ứng hạt nổi</span>
                </div>
                <div className="relative">
                  <input type="checkbox" defaultChecked className="peer sr-only" />
                  <div className="w-9 h-5 rounded-full bg-neutral-200 peer-checked:bg-emerald-500 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white peer-checked:translate-x-4 transition-all shadow-sm" />
                </div>
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-neutral-600 group-hover:text-neutral-800 transition-colors">Hiệu ứng gradient</span>
                </div>
                <div className="relative">
                  <input type="checkbox" defaultChecked className="peer sr-only" />
                  <div className="w-9 h-5 rounded-full bg-neutral-200 peer-checked:bg-emerald-500 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white peer-checked:translate-x-4 transition-all shadow-sm" />
                </div>
              </label>
            </div>
          </div>

          {/* Keyboard shortcuts */}
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Phím tắt</div>
            <div className="space-y-1.5">
              {[
                { keys: ['Enter'], desc: 'Đăng nhập' },
                { keys: ['Tab'], desc: 'Chuyển trường' },
                { keys: ['Ctrl', 'H'], desc: 'Ẩn/hiện mật khẩu' },
              ].map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-1">
                  <span className="text-[11px] text-neutral-500">{shortcut.desc}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((k, j) => (
                      <kbd key={j} className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200
                        text-[10px] text-neutral-600 font-mono min-w-[24px] text-center shadow-sm">
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
        <div className="px-5 py-4 border-t border-neutral-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <span className="text-[11px] text-neutral-500">Hệ thống hoạt động bình thường</span>
          </div>
        </div>
      </div>
      </Portal>

      {/* ============ LEFT PANEL — Branding (Xanh đậm/tối để hiện logo màu trắng) ============ */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[55%] relative items-center justify-center p-12 overflow-hidden bg-[#060d09] shrink-0">
        
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

        {/* Big centered logo directly on dark bg */}
        <div className={`relative z-10 transition-all duration-1000 ${mounted ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
          <div className="w-56 h-56 xl:w-64 xl:h-64 flex items-center justify-center hover:scale-105 transition-transform duration-500">
            <img src={logoSrc} alt="Frezo" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      {/* ============ RIGHT PANEL — Login Form (Nền sáng trắng hết) ============ */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-neutral-50 relative">

        <div className={`relative z-10 w-full max-w-[420px] transition-all duration-700 delay-300
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          ${shake ? 'login-shake' : ''}
        `}>

          {/* Mobile branding (hidden on desktop) */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src={logoSrc} alt="Frezo" className="w-10 h-10 object-contain" />
            <span className="text-neutral-800 font-bold text-xl">Frezo ERP</span>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-neutral-200/80 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden">

            {/* Header */}
            <div className="px-8 pt-8 pb-5 text-center">
              <h1 className="text-2xl font-bold text-neutral-800 tracking-tight">Chào mừng trở lại</h1>
              <p className="text-sm text-neutral-400 mt-1.5">Đăng nhập để truy cập hệ thống quản trị</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5" noValidate>

              {/* Rich error card — icon + title + hint + optional forgot-password action */}
              {authError && (
                <AuthErrorCard
                  error={authError}
                  countdown={retryCountdown}
                  onForgotPassword={() => nav('/forgot-password')}
                />
              )}

              {/* Username */}
              <div className="space-y-1.5">
                <label htmlFor="login-username" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Tên đăng nhập
                </label>
                <div className={`relative rounded-xl transition-all duration-300
                  ${focusedField === 'username' ? 'ring-2 ring-emerald-500/20' : ''}
                  ${usernameError ? 'ring-2 ring-red-500/20' : ''}
                `}>
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`transition-colors duration-200
                        ${usernameError ? 'text-red-500' : focusedField === 'username' ? 'text-emerald-500' : 'text-neutral-400'}
                      `}>
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <input
                    id="login-username"
                    ref={usernameRef}
                    type="text"
                    autoComplete="username"
                    placeholder="Nhập tên đăng nhập"
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => {
                      setFocusedField(null)
                      setTouched((t) => ({ ...t, username: true }))
                    }}
                    disabled={isLoading}
                    aria-invalid={!!usernameError}
                    aria-describedby={usernameError ? 'login-username-error' : undefined}
                    className={`w-full h-12 pl-10 pr-4 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400/80
                      focus:outline-none focus:bg-white disabled:opacity-40 transition-all duration-200
                      ${usernameError
                        ? 'bg-red-50/50 border border-red-200 focus:border-red-400 hover:border-red-300'
                        : 'bg-neutral-50 border border-neutral-200 focus:border-emerald-500 hover:bg-neutral-100/70 hover:border-neutral-300'
                      }`}
                  />
                </div>
                {usernameError && (
                  <p id="login-username-error" className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle size={14} /> {usernameError}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="login-password" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Mật khẩu
                </label>
                <div className={`relative rounded-xl transition-all duration-300
                  ${focusedField === 'password' ? 'ring-2 ring-emerald-500/20' : ''}
                  ${passwordError ? 'ring-2 ring-red-500/20' : ''}
                `}>
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`transition-colors duration-200
                        ${passwordError ? 'text-red-500' : focusedField === 'password' ? 'text-emerald-500' : 'text-neutral-400'}
                      `}>
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    id="login-password"
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    onKeyDown={handlePasswordKey}
                    onKeyUp={handlePasswordKey}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => {
                      setFocusedField(null)
                      setTouched((t) => ({ ...t, password: true }))
                      setCapsLockOn(false)
                    }}
                    disabled={isLoading}
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? 'login-password-error' : undefined}
                    className={`w-full h-12 pl-10 pr-11 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400/80
                      focus:outline-none focus:bg-white disabled:opacity-40 transition-all duration-200
                      ${passwordError
                        ? 'bg-red-50/50 border border-red-200 focus:border-red-400 hover:border-red-300'
                        : 'bg-neutral-50 border border-neutral-200 focus:border-emerald-500 hover:bg-neutral-100/70 hover:border-neutral-300'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-400
                      hover:text-neutral-600 hover:bg-neutral-100 transition-all duration-155"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Inline hints — priority: validation error > Caps Lock warning */}
                {passwordError ? (
                  <p id="login-password-error" className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle size={14} /> {passwordError}
                  </p>
                ) : capsLockOn && focusedField === 'password' ? (
                  <p className="text-xs text-amber-700 flex items-center gap-1.5 mt-1 bg-amber-50 border border-amber-100 rounded-md px-2 py-1">
                    <ShieldAlert size={14} /> Caps Lock đang bật — có thể ảnh hưởng mật khẩu.
                  </p>
                ) : null}
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="w-4 h-4 rounded border border-neutral-300 bg-neutral-50
                      peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all duration-200
                      group-hover:border-neutral-400" />
                    <svg className="absolute top-0.5 left-0.5 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs text-neutral-500 group-hover:text-neutral-700 transition-colors select-none">Ghi nhớ đăng nhập</span>
                </label>
                <button
                  type="button"
                  onClick={() => nav('/forgot-password')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit */}
              <button
                id="btn-login"
                type="submit"
                disabled={!canSubmit}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600
                  hover:from-emerald-400 hover:to-emerald-500
                  active:from-emerald-600 active:to-emerald-700
                  text-white text-sm font-semibold rounded-xl
                  flex items-center justify-center gap-2.5
                  transition-all duration-200
                  shadow-[0_4px_18px_rgba(16,185,129,0.2)]
                  hover:shadow-[0_6px_25px_rgba(16,185,129,0.3)]
                  active:shadow-none
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                  disabled:hover:from-emerald-500 disabled:hover:to-emerald-600
                  hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : retryCountdown > 0 ? (
                  <>
                    <Lock size={16} />
                    <span>Thử lại sau {formatCountdown(retryCountdown)}</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Đăng nhập</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-neutral-200/60" />
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">Bảo mật</span>
                <div className="flex-1 h-px bg-neutral-200/60" />
              </div>

              {/* Security note */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <ShieldCheck size={13} className="text-emerald-600/80" />
                <span className="text-[11px] text-neutral-400">Kết nối được mã hóa SSL 256-bit</span>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-[11px] text-neutral-400">
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

// ============================================================
// AuthErrorCard — rich error display với icon/màu/CTA theo severity
// ============================================================

const SEVERITY_STYLES: Record<AuthError['severity'], {
  wrap: string
  icon: string
  iconBg: string
  title: string
  hint: string
}> = {
  error: {
    wrap:   'bg-red-50 border-red-100',
    icon:   'text-red-600',
    iconBg: 'bg-red-100',
    title:  'text-red-700',
    hint:   'text-red-600/85',
  },
  warning: {
    wrap:   'bg-amber-50 border-amber-100',
    icon:   'text-amber-700',
    iconBg: 'bg-amber-100',
    title:  'text-amber-800',
    hint:   'text-amber-700/85',
  },
  blocked: {
    wrap:   'bg-rose-50 border-rose-200',
    icon:   'text-rose-700',
    iconBg: 'bg-rose-100',
    title:  'text-rose-800',
    hint:   'text-rose-700/85',
  },
  network: {
    wrap:   'bg-indigo-50 border-indigo-100',
    icon:   'text-indigo-600',
    iconBg: 'bg-indigo-100',
    title:  'text-indigo-800',
    hint:   'text-indigo-700/85',
  },
  server: {
    wrap:   'bg-yellow-50 border-yellow-100',
    icon:   'text-yellow-700',
    iconBg: 'bg-yellow-100',
    title:  'text-yellow-800',
    hint:   'text-yellow-700/85',
  },
}

const SEVERITY_ICON: Record<AuthError['severity'], typeof AlertCircle> = {
  error:   Lock,
  warning: AlertCircle,
  blocked: ShieldAlert,
  network: WifiOff,
  server:  ServerCrash,
}

function AuthErrorCard({
  error, countdown, onForgotPassword,
}: {
  error: AuthError
  countdown: number
  onForgotPassword?: () => void
}) {
  const styles = SEVERITY_STYLES[error.severity]
  const Icon = SEVERITY_ICON[error.severity]

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex items-start gap-3 px-4 py-3 border rounded-xl animate-fade-in ${styles.wrap}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}>
        <Icon size={16} className={styles.icon} />
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-semibold ${styles.title}`}>{error.title}</div>
        {error.hint && (
          <div className={`text-xs mt-0.5 leading-relaxed ${styles.hint}`}>
            {error.hint}
            {countdown > 0 && ` (${formatCountdown(countdown)})`}
          </div>
        )}
        {error.showForgotPassword && (
          <button
            type="button"
            onClick={onForgotPassword}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <KeyRound size={14} /> Đặt lại mật khẩu <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

/** Format số giây → chuỗi "MM:SS" hoặc "Xs" cho ngắn. */
function formatCountdown(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

