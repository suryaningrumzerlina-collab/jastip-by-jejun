'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import { useActiveBatch } from '@/components/providers/ActiveBatchProvider'

const MAIN_TABS = [
  { href: '/', label: 'Home', icon: 'solar:home-2-bold', activeColor: 'coral' },
  { href: '/pesanan', label: 'Pesanan', icon: 'solar:bag-smile-bold', activeColor: 'teal' },
  { href: '/belanja', label: 'Belanja', icon: 'solar:cart-large-2-bold', activeColor: 'teal' },
  { href: '/invoice', label: 'Invoice', icon: 'solar:bill-list-bold', activeColor: 'teal' },
  { href: '/report', label: 'Report', icon: 'solar:chart-2-bold', activeColor: 'teal' },
] as const

const MASTER_LINKS = [
  { href: '/produk', label: 'Master Produk', icon: 'solar:box-bold' },
  { href: '/pemesan', label: 'Kontak Jastiper', icon: 'solar:users-group-rounded-bold' },
  { href: '/batch', label: 'Kelola Batch PO', icon: 'solar:calendar-bold' },
  { href: '/fee', label: 'Aturan Fee', icon: 'solar:tag-price-bold' },
] as const

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { activeBatchId, activeBatch, batchList, setActiveBatchId } = useActiveBatch()

  const batchDialogRef = useRef<HTMLDialogElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    const dialog = batchDialogRef.current
    if (!dialog) return
    if (batchModalOpen && !dialog.open) {
      dialog.showModal()
    } else if (!batchModalOpen && dialog.open) {
      dialog.close()
    }
  }, [batchModalOpen])

  async function handleLogout() {
    setLogoutLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Top App Bar */}
      <header className="print:hidden relative z-50 flex justify-between items-center max-w-2xl mx-auto px-6 pt-6 pb-4">
        {/* Left: Menu Master Data */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-label="Buka menu master data"
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-[#EBDCC7]/50 text-[#4ECDC4] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <Icon
              icon={menuOpen ? 'solar:close-circle-bold' : 'solar:hamburger-menu-bold'}
              width={24}
              height={24}
            />
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

        {/* Center: Switcher Pill Batch/Event Aktif (Buka Pop-up Modal) */}
        <button
          type="button"
          onClick={() => setBatchModalOpen(true)}
          aria-label="Ganti batch atau event aktif"
          className="flex items-center gap-2 bg-white/85 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-[#EBDCC7]/60 max-w-[210px] hover:border-[#FF6B6B]/50 active:scale-95 transition-all cursor-pointer"
        >
          <Icon icon="solar:star-bold" className="text-[#FF6B6B] shrink-0" width={18} height={18} />
          <span className="font-bold text-sm text-[#2D3436] truncate">
            {activeBatch ? activeBatch.nama_batch : 'Semua Batch'}
          </span>
          <Icon
            icon="solar:alt-arrow-down-bold"
            className="text-[#636E72] shrink-0"
            width={14}
            height={14}
          />
        </button>

        {/* Right: Logout */}
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

      {/* Modal Switcher Batch/Event */}
      {batchModalOpen && (
        <dialog
          ref={batchDialogRef}
          onCancel={(e) => {
            e.preventDefault()
            setBatchModalOpen(false)
          }}
          onClick={(e) => {
            if (e.target === batchDialogRef.current) setBatchModalOpen(false)
          }}
          className="m-auto w-[calc(100%-2.5rem)] max-w-sm rounded-[2rem] bg-white p-6 shadow-[0_20px_40px_rgb(0,0,0,0.15)] border border-[#EBDCC7] backdrop:bg-[#2D3436]/40 backdrop:backdrop-blur-xs"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#4ECDC4]">
                Filter Utama
              </p>
              <h2 className="font-black text-xl text-[#2D3436]">Pilih Batch / Event</h2>
            </div>
            <button
              type="button"
              onClick={() => setBatchModalOpen(false)}
              aria-label="Tutup modal"
              className="w-9 h-9 rounded-full bg-[#FAF5EB] text-[#636E72] hover:text-[#FF6B6B] flex items-center justify-center cursor-pointer"
            >
              <Icon icon="solar:close-circle-bold" width={22} height={22} />
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {/* Opsi Semua Batch */}
            <button
              type="button"
              onClick={() => {
                setActiveBatchId('semua')
                setBatchModalOpen(false)
              }}
              className={`w-full px-4 py-3 rounded-2xl border flex items-center justify-between text-left transition-colors cursor-pointer ${
                activeBatchId === 'semua'
                  ? 'bg-[#FF6B6B]/10 border-[#FF6B6B] text-[#FF6B6B]'
                  : 'bg-[#FAF5EB]/60 border-[#EBDCC7] text-[#2D3436] hover:bg-[#FAF5EB]'
              }`}
            >
              <span className="font-black text-sm">Semua Batch / Event</span>
              {activeBatchId === 'semua' && (
                <Icon icon="solar:check-circle-bold" width={20} height={20} />
              )}
            </button>

            {/* Daftar Batch */}
            {batchList.map((b) => {
              const selected = activeBatchId === b.id
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setActiveBatchId(b.id)
                    setBatchModalOpen(false)
                  }}
                  className={`w-full px-4 py-3 rounded-2xl border flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#4ECDC4]/10 border-[#4ECDC4] text-[#2D3436]'
                      : 'bg-[#FAF5EB]/60 border-[#EBDCC7] text-[#2D3436] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-black text-sm truncate">{b.nama_batch}</p>
                    <p className="text-[11px] font-bold text-[#636E72]">
                      {b.status === 'aktif' ? 'Aktif' : 'Selesai'}
                      {b.tanggal_tutup ? ` • Tutup ${b.tanggal_tutup}` : ''}
                    </p>
                  </div>
                  {selected && (
                    <Icon
                      icon="solar:check-circle-bold"
                      width={20}
                      height={20}
                      className="text-[#4ECDC4] shrink-0"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </dialog>
      )}

      {/* Floating Bottom Tab Bar (5 Tab) */}
      <nav
        aria-label="Navigasi utama"
        className="print:hidden fixed bottom-6 left-4 right-4 max-w-md mx-auto bg-white rounded-[2.5rem] p-2 flex justify-between items-center shadow-[0_20px_40px_rgb(0,0,0,0.1)] border border-[#EBDCC7]/60 z-40"
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
              className={`flex-1 flex flex-col items-center py-2.5 rounded-[2rem] transition-colors ${
                isActive ? activeClasses : 'text-[#636E72] hover:text-[#4ECDC4]'
              }`}
            >
              <Icon icon={tab.icon} width={24} height={24} />
              <span className="text-[10px] font-bold mt-1 leading-none">{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}