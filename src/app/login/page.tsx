'use client'

import { useState, useId } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const emailId = useId()
  const passwordId = useId()
  const errorId = useId()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage(null)
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('Email atau password salah. Coba periksa kembali ya!')
        } else {
          setErrorMessage(error.message)
        }
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setErrorMessage('Terjadi gangguan koneksi. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center px-6 py-10 overflow-hidden">
      {/* Atmospheric Blobs (Cream Storybook -z-10) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-20 -left-20 w-64 h-64 rounded-full bg-[#FF6B6B] opacity-10 blur-[80px] -z-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/3 -right-24 w-64 h-64 rounded-full bg-[#4ECDC4] opacity-10 blur-[80px] -z-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-24 left-1/4 w-64 h-64 rounded-full bg-[#FFE66D] opacity-15 blur-[80px] -z-10"
      />

      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Hero Illustration: Flat-Sticker Kawaii Shopping Bag + Pulsing Halo */}
        <div className="relative mb-5 flex items-center justify-center">
          <div
            aria-hidden="true"
            className="absolute w-32 h-32 rounded-full bg-[#FFE66D] blur-[50px] opacity-50 animate-pulse"
          />
          <svg
            viewBox="0 0 160 160"
            className="relative w-28 h-28 drop-shadow-2xl"
            role="img"
            aria-label="Maskot Jastip by Jejun"
          >
            {/* Gagang tas */}
            <path
              d="M55 52 C55 24, 105 24, 105 52"
              fill="none"
              stroke="#4ECDC4"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Badan tas koral */}
            <rect x="28" y="48" width="104" height="92" rx="26" fill="#FF6B6B" />
            {/* Aksen pita atas kuning mentega */}
            <rect x="28" y="48" width="104" height="22" rx="11" fill="#FFE66D" />
            {/* Mata oval hitam */}
            <ellipse cx="62" cy="96" rx="5.5" ry="7" fill="#2D3436" />
            <ellipse cx="98" cy="96" rx="5.5" ry="7" fill="#2D3436" />
            {/* Senyum kecil */}
            <path
              d="M72 103 Q80 112 88 103"
              fill="none"
              stroke="#2D3436"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            {/* Pipi merona */}
            <ellipse cx="48" cy="104" rx="7" ry="4.5" fill="#FFE66D" opacity="0.85" />
            <ellipse cx="112" cy="104" rx="7" ry="4.5" fill="#FFE66D" opacity="0.85" />
          </svg>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 bg-[#FF6B6B] text-white font-black text-[11px] uppercase tracking-[0.12em] px-3.5 py-1 rounded-full border-2 border-white shadow-sm mb-3">
            <Icon icon="solar:star-bold" width={14} height={14} />
            Admin Portal
          </span>
          <h1 className="font-black text-3xl tracking-[-0.02em] text-[#2D3436]">
            Jastip by Jejun
          </h1>
          <p className="text-sm font-bold text-[#636E72] mt-1">
            Masuk untuk kelola pesanan &amp; pengiriman
          </p>
        </div>

        {/* White Card Container */}
        <section className="w-full bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#EBDCC7]/50">
          <form onSubmit={handleLogin} className="space-y-4" noValidate={false}>
            {/* Error Banner (Accessible Live Region) */}
            {errorMessage && (
              <div
                id={errorId}
                role="alert"
                aria-live="polite"
                className="flex items-start gap-2.5 bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-[#FF6B6B] rounded-2xl px-4 py-3 text-xs font-bold"
              >
                <Icon
                  icon="solar:danger-circle-bold"
                  width={18}
                  height={18}
                  className="shrink-0 mt-0.5"
                />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Input Email */}
            <div className="space-y-1.5">
              <label
                htmlFor={emailId}
                className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
              >
                Email Admin
              </label>
              <div className="relative flex items-center">
                <Icon
                  icon="solar:letter-bold"
                  width={20}
                  height={20}
                  className="absolute left-4 text-[#4ECDC4] pointer-events-none"
                />
                <input
                  id={emailId}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jastipjejun.com"
                  aria-describedby={errorMessage ? errorId : undefined}
                  className="w-full h-12 pl-11 pr-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] placeholder:text-[#636E72]/60 focus:bg-white focus:border-[#4ECDC4] transition-colors"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label
                htmlFor={passwordId}
                className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <Icon
                  icon="solar:lock-password-bold"
                  width={20}
                  height={20}
                  className="absolute left-4 text-[#4ECDC4] pointer-events-none"
                />
                <input
                  id={passwordId}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  aria-describedby={errorMessage ? errorId : undefined}
                  className="w-full h-12 pl-11 pr-12 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] placeholder:text-[#636E72]/60 focus:bg-white focus:border-[#4ECDC4] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  className="absolute right-3 w-8 h-8 flex items-center justify-center rounded-full text-[#636E72] hover:text-[#4ECDC4] transition-colors"
                >
                  <Icon
                    icon={showPassword ? 'solar:eye-closed-bold' : 'solar:eye-bold'}
                    width={20}
                    height={20}
                  />
                </button>
              </div>
            </div>

            {/* Submit Button (Primary Coral) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-2 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[13px] flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Icon icon="solar:refresh-bold" width={20} height={20} className="animate-spin" />
                  <span>Memeriksa akun...</span>
                </>
              ) : (
                <>
                  <Icon icon="solar:login-2-bold" width={20} height={20} />
                  <span>Masuk ke Dashboard</span>
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}