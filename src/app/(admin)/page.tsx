'use client'

import Link from 'next/link'
import { Icon } from '@iconify/react'
import { useInvoices, usePesanan } from '@/hooks/useJastipData'
import { formatRupiah, formatTanggalSingkat } from '@/lib/utils'
import AdminLoading from './loading'
import type { StatusJastip } from '@/types/database'

const STATUS_BADGE: Record<StatusJastip, { label: string; color: string }> = {
  tercatat: { label: 'Tercatat', color: 'text-[#636E72] bg-[#F0E6D6]' },
  dapat_barang: { label: 'Dapat Barang', color: 'text-[#2D3436] bg-[#FFE66D]' },
  terkonfirmasi: { label: 'Terkonfirmasi', color: 'text-white bg-[#4ECDC4]' },
  kosong_batal: { label: 'Kosong/Batal', color: 'text-white bg-[#FF6B6B]' },
}

export default function DashboardPage() {
  const { data: allPesanan, isLoading: loadingPesanan } = usePesanan()
  const { data: allInvoices, isLoading: loadingInvoices } = useInvoices()

  if ((loadingPesanan && !allPesanan) || (loadingInvoices && !allInvoices)) {
    return <AdminLoading />
  }

  const pesananList = allPesanan ?? []
  const unpaidInvoices = (allInvoices ?? []).filter(
    (inv) => inv.status_pembayaran !== 'lunas'
  )

  const pesananAktif = pesananList.filter((p) => p.status_jastip !== 'kosong_batal')
  const totalOmzet = pesananAktif.reduce((sum, p) => sum + p.harga_total, 0)
  const belumBeli = pesananList.filter((p) => p.status_jastip === 'tercatat').length
  const siapKonfirmasi = pesananList.filter((p) => p.status_jastip === 'dapat_barang').length
  const belumLunasCount = unpaidInvoices.length

  const recentPesanan = pesananList.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Hero Summary Section */}
      <section className="text-center pt-2">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72]">
          Total Nilai Pesanan Aktif
        </p>
        <h1 className="font-black text-4xl sm:text-5xl tracking-[-0.03em] text-[#2D3436] mt-2">
          {formatRupiah(totalOmzet)}
        </h1>

        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-[#EBDCC7] mt-4">
          <span className="w-2 h-2 rounded-full bg-[#FF6B6B] animate-pulse" />
          <span className="text-xs font-bold text-[#FF6B6B]">
            {pesananAktif.length} Item Aktif Tercatat
          </span>
        </div>
      </section>

      {/* 3 Metric Tiles */}
      <section aria-label="Ringkasan tugas" className="grid grid-cols-3 gap-3 sm:gap-4">
        <Link
          href="/belanja"
          className="bg-white rounded-[2rem] p-4 flex flex-col items-center text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#EBDCC7]/50 hover:scale-[1.02] transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-[#4ECDC4]/20 flex items-center justify-center text-[#4ECDC4] mb-3">
            <Icon icon="solar:cart-large-2-bold" width={26} height={26} />
          </div>
          <span className="font-black text-2xl text-[#2D3436] leading-none">
            {belumBeli}
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#636E72] mt-2">
            Belum Beli
          </span>
        </Link>

        <Link
          href="/pesanan"
          className="bg-white rounded-[2rem] p-4 flex flex-col items-center text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#EBDCC7]/50 hover:scale-[1.02] transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-[#FFE66D]/35 flex items-center justify-center text-[#2D3436] mb-3">
            <Icon icon="solar:chat-round-check-bold" width={26} height={26} />
          </div>
          <span className="font-black text-2xl text-[#2D3436] leading-none">
            {siapKonfirmasi}
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#636E72] mt-2">
            Konfirmasi
          </span>
        </Link>

        <Link
          href="/invoice"
          className="bg-white rounded-[2rem] p-4 flex flex-col items-center text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#EBDCC7]/50 hover:scale-[1.02] transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-[#C3AED6]/25 flex items-center justify-center text-[#2D3436] mb-3">
            <Icon icon="solar:wallet-money-bold" width={26} height={26} />
          </div>
          <span className="font-black text-2xl text-[#2D3436] leading-none">
            {belumLunasCount}
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#636E72] mt-2">
            Blm Lunas
          </span>
        </Link>
      </section>

      {/* Pesanan Terbaru */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-black text-xl text-[#2D3436]">Pesanan Terbaru</h2>
          <Link
            href="/pesanan"
            className="text-xs font-bold text-[#FF6B6B] hover:underline flex items-center gap-1"
          >
            Lihat Semua
            <Icon icon="solar:alt-arrow-right-bold" width={16} height={16} />
          </Link>
        </div>

        {recentPesanan.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#EBDCC7]/50">
            <p className="font-bold text-sm text-[#636E72]">
              Belum ada pesanan tercatat. Yuk mulai catat pesanan pertama!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPesanan.map((item) => {
              const badge = STATUS_BADGE[item.status_jastip]
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-5 flex items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#EBDCC7]/50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-base text-[#2D3436] truncate">
                        {item.pemesan?.nama_jastiper ?? 'Tanpa Nama'}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-[#636E72] truncate mt-1">
                      {item.produk?.nama_barang ?? 'Produk'}
                      {item.varian_dipilih ? ` (${item.varian_dipilih})` : ''} &times; {item.qty}
                    </p>
                    <p className="text-xs font-bold text-[#636E72]/70 mt-0.5">
                      {formatTanggalSingkat(item.order_time)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-base text-[#2D3436]">
                      {formatRupiah(item.harga_total)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}