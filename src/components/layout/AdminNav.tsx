'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'

const MAIN_TABS = [
  { href: '/', label: 'Home', icon: 'solar:home-2-bold', activeColor: 'coral' },
  { href: '/pesanan', label: 'Pesanan', icon: 'solar:bag-smile-bold', activeColor: 'teal' },
  { href: '/belanja', label: 'Belanja', icon: 'solar:cart-large-2-bold', activeColor: 'teal' },
  { href: '/invoice', label: 'Invoice', icon: 'solar:bill-list-bold', activeColor: 'teal' },
] as const

const MASTER_LINKS = [
  { href: '/produk', label: 'Master Produk', icon: 'solar:box-bold' },
  { href: '/pemesan', label: 'Kontak Jastiper', icon: 'solar:users-group-rounded-bold' },
  { href: '/batch', label: 'Kelola Batch PO', icon: 'solar:calendar-bold' },
] as const

export function AdminNav({ activeBatchName }: { activeBatchName?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  async function handleLogout() {
    setLogoutLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Top App Bar (Three-Cluster) */}
      <header className="print:hidden relative z-30 flex justify-between items-center max-w-2xl mx-auto px-6 pt-6 pb-4">
        {/* Left: Menu Master Data */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-label="Buka menu master data"
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-[#EBDCC7]/50 text-[#4ECDC4] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <Icon icon={menuOpen ? 'solar:close-circle-bold' : 'solar:hamburger-menu-bold'} width={24} height={24} />
          </button>

          {menuOpen && (
            <>
              <div
                aria-hidden="true"
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-40"
              />
              <div className="absolute left-0 mt-3 w-60 bg-white rounded-[2rem] p-3 shadow-[0_20px_40px_rgb(0,0,0,0.1)] border border-[#EBDCC7]/60 z-50 space-y-1">
                <p className="px-3 pt-2 pb-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72]">
                  Master Data
                </p>
                {MASTER_LINKS.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold transition-colors ${
                        isActive
                          ? 'bg-[#4ECDC4]/10 text-[#4ECDC4]'
                          : 'text-[#2D3436] hover:bg-[#FAF5EB]'
                      }`}
                    >
                      <Icon icon={item.icon} width={20} height={20} className="text-[#4ECDC4]" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Center: Context Pill (Nama Brand / Batch Aktif) */}
        <Link
          href="/batch"
          className="flex items-center gap-2 bg-white/75 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-[#EBDCC7]/50 max-w-[200px]"
        >
          <Icon icon="solar:star-bold" className="text-[#FF6B6B] shrink-0" width={18} height={18} />
          <span className="font-bold text-sm text-[#2D3436] truncate">
            {activeBatchName || 'Jastip by Jejun'}
          </span>
        </Link>

        {/* Right: Tombol Logout */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutLoading}
          aria-label="Keluar dari akun admin"
          title="Keluar"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-[#EBDCC7]/50 text-[#4ECDC4] hover:text-[#FF6B6B] hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <Icon
            icon={logoutLoading ? 'solar:refresh-bold' : 'solar:logout-2-bold'}
            width={24}
            height={24}
            className={logoutLoading ? 'animate-spin' : ''}
          />
        </button>
      </header>

      {/* Floating Bottom Tab Bar */}
      <nav
        aria-label="Navigasi utama"
        className="print:hidden fixed bottom-6 left-6 right-6 max-w-md mx-auto bg-white rounded-[2.5rem] p-2.5 flex justify-between items-center shadow-[0_20px_40px_rgb(0,0,0,0.1)] border border-[#EBDCC7]/60 z-40"
      >
        {MAIN_TABS.map((tab) => {
          const isActive =
            tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)

          const activeClasses =
            tab.activeColor === 'coral'
              ? 'text-[#FF6B6B] bg-[#FF6B6B]/10'
              : 'text-[#4ECDC4] bg-[#4ECDC4]/10'

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center py-3 rounded-[2rem] transition-colors ${
                isActive ? activeClasses : 'text-[#636E72] hover:text-[#4ECDC4]'
              }`}
            >
              <Icon icon={tab.icon} width={28} height={28} />
              <span className="text-[11px] font-bold mt-1 leading-none">{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}