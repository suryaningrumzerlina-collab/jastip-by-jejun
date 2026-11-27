'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'

interface StickyToolbarProps {
  eyebrow: string
  title: string
  searchValue: string
  onSearchChange: (val: string) => void
  searchPlaceholder: string
  /** Tombol aksi utama (opsional, misal di Belanja tidak ada tombol tambah) */
  actionLabel?: string
  actionIcon?: string
  onActionClick?: () => void
  /** Badge angka notifikasi di tombol (khusus Invoice) */
  actionBadge?: number
  /** Slot kanan header jika tidak pakai tombol aksi (misal counter sisa pcs di Belanja) */
  headerRightSlot?: React.ReactNode
  /** Baris filter, sort, atau toggle tampilan yang ikut freeze di bawah search bar */
  children?: React.ReactNode
}

export function StickyToolbar({
  eyebrow,
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  actionLabel,
  actionIcon = 'solar:add-circle-bold',
  onActionClick,
  actionBadge,
  headerRightSlot,
  children,
}: StickyToolbarProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [isSticky, setIsSticky] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting)
      },
      {
        rootMargin: '-88px 0px 0px 0px', // Sesuai tinggi Top App Bar
        threshold: 0,
      }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const hasAction = Boolean(onActionClick && actionLabel)

  return (
    <>
      {/* Header Judul Normal (Ikut tergulung ke atas saat scroll) */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72]">
            {eyebrow}
          </p>
          <h1 className="font-black text-3xl tracking-[-0.02em] text-[#2D3436]">
            {title}
          </h1>
        </div>

        {hasAction ? (
          <button
            type="button"
            onClick={onActionClick}
            className={`relative h-12 px-5 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] active:scale-95 text-white font-bold text-[13px] flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0 ${
              isSticky ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100'
            }`}
          >
            <Icon icon={actionIcon} width={20} height={20} />
            <span>{actionLabel}</span>
            {Boolean(actionBadge && actionBadge > 0) && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 rounded-full bg-[#FFE66D] text-[#2D3436] font-black text-[10px] flex items-center justify-center border-2 border-white shadow-sm">
                {actionBadge}
              </span>
            )}
          </button>
        ) : (
          headerRightSlot ?? null
        )}
      </div>

      {/* Sentinel tak terlihat untuk mendeteksi posisi scroll */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full -mt-3" />

      {/* Sticky Area: Search Bar + Tombol Ikon + Filter/Sort/Switch */}
      <div
        className={`sticky top-[84px] z-20 -mx-6 px-6 py-2.5 transition-all space-y-2.5 ${
          isSticky
            ? 'bg-[#FAF5EB]/90 backdrop-blur-md border-b border-[#EBDCC7]/60 shadow-[0_8px_20px_rgb(0,0,0,0.03)]'
            : ''
        }`}
      >
        <div className="flex items-center gap-2.5">
          {/* Search Bar (Lebar otomatis menyesuaikan jika tombol muncul di samping) */}
          <div className="flex-1 min-w-0 flex items-center gap-2.5 bg-white px-5 h-12 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#EBDCC7]/50 transition-all">
            <Icon
              icon="solar:magnifer-linear"
              className="text-[#4ECDC4] shrink-0"
              width={20}
              height={20}
            />
            <input
              type="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full bg-transparent text-sm font-bold text-[#2D3436] placeholder:text-[#636E72]/60 focus:outline-none"
            />
          </div>

          {/* Tombol Aksi Versi Ikon Saja (Muncul mulus saat isSticky = true) */}
          {hasAction && isSticky && (
            <button
              type="button"
              onClick={onActionClick}
              aria-label={actionLabel}
              title={actionLabel}
              className="relative w-12 h-12 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] active:scale-95 text-white flex items-center justify-center shadow-sm shrink-0 transition-all cursor-pointer"
            >
              <Icon icon={actionIcon} width={22} height={22} />
              {Boolean(actionBadge && actionBadge > 0) && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#FFE66D] text-[#2D3436] font-black text-[10px] flex items-center justify-center border-2 border-white shadow-sm">
                  {actionBadge}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Filter Chips / Sort / Layout Toggle */}
        {children}
      </div>
    </>
  )
}