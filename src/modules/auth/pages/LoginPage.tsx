// ============================================================
// FREZO ERP — Login Page
// Dark green ERP design, form login → BE /auth/login
// ============================================================

import { useState } from 'react'
import { Eye, EyeOff, Loader2, AlertCircle, LogIn } from 'lucide-react'
import { useLogin } from '../hooks/useLogin'

export function LoginPage() {
  const { login, isLoading, isError, error } = useLogin()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ username: '', password: '' })

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
    <div className="min-h-screen bg-[#0a1510] flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96
        bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Card */}
        <div className="bg-[#0f1a14] border border-[#1e3a23] rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-[#1e3a23]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-primary">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <div>
                <div className="text-white font-bold text-xl leading-tight">Frezo ERP</div>
                <div className="text-primary-400 text-xs font-medium">Enterprise Resource Planning</div>
              </div>
            </div>
            <h1 className="text-xl font-bold text-white">Đăng nhập hệ thống</h1>
            <p className="text-sm text-[#a3c4a8] mt-1">Nhập thông tin tài khoản để tiếp tục</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
            {/* Error message */}
            {errorMsg && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/20
                rounded-lg text-sm text-red-400 animate-fade-in">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-[#a3c4a8] mb-1.5">
                Tên đăng nhập
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="admin"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                disabled={isLoading}
                className="w-full h-10 px-3.5 bg-[#1a2e1f] border border-[#1e3a23] rounded-lg
                  text-sm text-white placeholder:text-[#4a6a50]
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  disabled:opacity-50 transition-all duration-150"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-[#a3c4a8] mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  disabled={isLoading}
                  className="w-full h-10 px-3.5 pr-10 bg-[#1a2e1f] border border-[#1e3a23] rounded-lg
                    text-sm text-white placeholder:text-[#4a6a50]
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    disabled:opacity-50 transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a6a50] hover:text-[#a3c4a8]
                    transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <button type="button" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                Quên mật khẩu?
              </button>
            </div>

            {/* Submit button */}
            <button
              id="btn-login"
              type="submit"
              disabled={isLoading || !form.username || !form.password}
              className="w-full h-10 bg-primary-500 hover:bg-primary-600 active:bg-primary-700
                text-white text-sm font-semibold rounded-lg
                flex items-center justify-center gap-2
                transition-all duration-150 shadow-primary
                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Đăng nhập</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-[#4a6a50]">
              © 2025 Frezo ERP — All rights reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

