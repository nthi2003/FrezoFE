// ============================================================
// ForgotPasswordPage — 3 bước: email → OTP + mật khẩu mới → xong
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Loader2, Mail, KeyRound, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { authApi } from '../services/authApi'
import logoSrc from '@/img/logo.png'

type Step = 'email' | 'otp' | 'done'

function extractErrorMessage(err: unknown): string {
  const anyErr = err as { response?: { data?: { message?: string } }; message?: string }
  return anyErr?.response?.data?.message
    || anyErr?.message
    || 'Có lỗi xảy ra. Vui lòng thử lại.'
}

export function ForgotPasswordPage() {
  const nav = useNavigate()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  const emailRef = useRef<HTMLInputElement>(null)
  const otpRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setMounted(true)
      emailRef.current?.focus()
    }, 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const iv = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(iv)
  }, [resendCooldown])

  const requestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)
    setInfo(null)
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Vui lòng nhập email hợp lệ đã đăng ký trên hệ thống.')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.forgotPassword(trimmed)
      setInfo(res?.message || 'Nếu email tồn tại, mã OTP đã được gửi. Kiểm tra hộp thư.')
      setStep('otp')
      setResendCooldown(60)
      setTimeout(() => otpRef.current?.focus(), 100)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Mã OTP phải gồm 6 chữ số.')
      return
    }
    if (password.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }
    if (password !== confirm) {
      setError('Xác nhận mật khẩu không khớp.')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword({ key: otp.trim(), newPassword: password })
      setStep('done')
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white overflow-hidden">
      {/* Left brand panel — mirror LoginPage */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[55%] relative items-center justify-center p-12 overflow-hidden bg-[#060d09] shrink-0">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px]" />
        <div className={`relative z-10 transition-all duration-1000 ${mounted ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
          <div className="w-56 h-56 xl:w-64 xl:h-64 flex items-center justify-center">
            <img src={logoSrc} alt="Frezo" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-neutral-50 relative">
        <div className={`relative z-10 w-full max-w-[420px] transition-all duration-700
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src={logoSrc} alt="Frezo" className="w-10 h-10 object-contain" />
            <span className="text-neutral-800 font-bold text-xl">Frezo ERP</span>
          </div>

          <div className="rounded-3xl border border-neutral-200/80 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-8 pt-8 pb-5 text-center">
              <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                {step === 'done' ? <CheckCircle2 size={22} /> : <KeyRound size={22} />}
              </div>
              <h1 className="text-2xl font-bold text-neutral-800 tracking-tight">
                {step === 'done' ? 'Đặt lại thành công' : 'Quên mật khẩu'}
              </h1>
              <p className="text-sm text-neutral-400 mt-1.5">
                {step === 'email' && 'Nhập email tài khoản để nhận mã OTP'}
                {step === 'otp' && 'Nhập mã OTP gửi về email và mật khẩu mới'}
                {step === 'done' && 'Bạn có thể đăng nhập bằng mật khẩu mới'}
              </p>
            </div>

            {/* Step indicator */}
            {step !== 'done' && (
              <div className="px-8 pb-2 flex items-center gap-2 justify-center text-[11px] font-semibold text-neutral-400">
                <span className={step === 'email' ? 'text-emerald-600' : 'text-emerald-500'}>1. Email</span>
                <span>→</span>
                <span className={step === 'otp' ? 'text-emerald-600' : ''}>2. OTP & mật khẩu</span>
              </div>
            )}

            <div className="px-8 pb-8 space-y-4">
              {error && (
                <div role="alert" className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {info && step === 'otp' && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm">
                  <Mail size={16} className="mt-0.5 shrink-0" />
                  <span>{info}</span>
                </div>
              )}

              {step === 'email' && (
                <form onSubmit={requestOtp} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <label htmlFor="fp-email" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Email đăng ký
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        ref={emailRef}
                        id="fp-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ban@congty.com"
                        className="w-full h-12 pl-10 pr-4 rounded-xl border border-neutral-200 bg-neutral-50 text-sm
                          focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold
                      flex items-center justify-center gap-2 shadow-[0_4px_18px_rgba(16,185,129,0.2)]
                      hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={16} />}
                    {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                  </button>
                </form>
              )}

              {step === 'otp' && (
                <form onSubmit={submitReset} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <label htmlFor="fp-otp" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Mã OTP (6 số)
                    </label>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        ref={otpRef}
                        id="fp-otp"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        className="w-full h-12 pl-10 pr-4 rounded-xl border border-neutral-200 bg-neutral-50 text-sm tracking-[0.35em] font-semibold
                          focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="fp-pw" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        id="fp-pw"
                        type={showPw ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ít nhất 6 ký tự"
                        className="w-full h-12 pl-10 pr-11 rounded-xl border border-neutral-200 bg-neutral-50 text-sm
                          focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="fp-confirm" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        id="fp-confirm"
                        type={showPw ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                        className="w-full h-12 pl-10 pr-4 rounded-xl border border-neutral-200 bg-neutral-50 text-sm
                          focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold
                      flex items-center justify-center gap-2 shadow-[0_4px_18px_rgba(16,185,129,0.2)]
                      hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
                    {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                  </button>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      className="text-neutral-500 hover:text-neutral-700"
                      onClick={() => { setStep('email'); setError(null); setInfo(null) }}
                    >
                      Đổi email
                    </button>
                    <button
                      type="button"
                      disabled={loading || resendCooldown > 0}
                      onClick={() => requestOtp()}
                      className="font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : 'Gửi lại OTP'}
                    </button>
                  </div>
                </form>
              )}

              {step === 'done' && (
                <div className="space-y-4">
                  <p className="text-sm text-neutral-600 text-center leading-relaxed">
                    Mật khẩu đã được cập nhật. Hãy đăng nhập lại bằng mật khẩu mới.
                  </p>
                  <button
                    type="button"
                    onClick={() => nav('/login', { replace: true })}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold
                      flex items-center justify-center gap-2"
                  >
                    Về trang đăng nhập
                  </button>
                </div>
              )}

              {step !== 'done' && (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-700 pt-1"
                >
                  <ArrowLeft size={14} /> Quay lại đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
