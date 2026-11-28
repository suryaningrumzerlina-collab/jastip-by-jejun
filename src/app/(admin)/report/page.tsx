'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { useBatch, usePesanan } from '@/hooks/useJastipData'
import { formatRupiah } from '@/lib/utils'
import AdminLoading from '../loading'

interface BrandSummary {
  brand: string
  totalQty: number
  totalBarang: number
  totalFee: number
  itemCount: number
}

export default function ReportPage() {
  const { data: batchList, isLoading: l1 } = useBatch()
  const { data: allPesanan, isLoading: l2 } = usePesanan()

  const [selectedBatchId, setSelectedBatchId] = useState<string>('')

  const batches = batchList ?? []
  const effectiveBatchId =
    selectedBatchId ||
    batches.find((b) => b.status === 'aktif')?.id ||
    batches[0]?.id ||
    ''

  const selectedBatch = useMemo(
    () => batches.find((b) => b.id === effectiveBatchId) ?? null,
    [batches, effectiveBatchId]
  )

  // Ambil pesanan aktif (bukan kosong/batal) untuk batch terpilih
  const batchPesanan = useMemo(
    () =>
      (allPesanan ?? []).filter(
        (p) => p.id_batch === effectiveBatchId && p.status_jastip !== 'kosong_batal'
      ),
    [allPesanan, effectiveBatchId]
  )

  const summary = useMemo(() => {
    const totalQty = batchPesanan.reduce((sum, p) => sum + p.qty, 0)
    const totalBarang = batchPesanan.reduce((sum, p) => sum + p.harga_total, 0)
    const totalFee = batchPesanan.reduce((sum, p) => sum + (p.fee_total ?? 0), 0)
    const uniquePemesan = new Set(batchPesanan.map((p) => p.id_pemesan)).size
    return { totalQty, totalBarang, totalFee, uniquePemesan }
  }, [batchPesanan])

  // Summary per Brand
  const brandSummaries = useMemo<BrandSummary[]>(() => {
    const map = new Map<string, BrandSummary>()

    for (const p of batchPesanan) {
      const brand = p.produk?.brand?.trim() || 'Tanpa Brand'
      const existing = map.get(brand)
      if (existing) {
        existing.totalQty += p.qty
        existing.totalBarang += p.harga_total
        existing.totalFee += p.fee_total ?? 0
        existing.itemCount += 1
      } else {
        map.set(brand, {
          brand,
          totalQty: p.qty,
          totalBarang: p.harga_total,
          totalFee: p.fee_total ?? 0,
          itemCount: 1,
        })
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalFee - a.totalFee)
  }, [batchPesanan])

  if ((l1 && !batchList) || (l2 && !allPesanan)) {
    return <AdminLoading />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72]">
          Laporan &amp; Analisis
        </p>
        <h1 className="font-black text-3xl tracking-[-0.02em] text-[#2D3436]">
          Report Jastip
        </h1>
      </div>

      {/* Pilihan Batch / Event (Menampilkan semua batch) */}
      <div className="bg-white rounded-[2rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-[#EBDCC7]/50 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-black uppercase tracking-[0.1em] text-[#636E72] pl-2 shrink-0">
            Pilih Event
          </span>
          <select
            value={effectiveBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            aria-label="Pilih batch untuk report"
            className="flex-1 max-w-xs h-10 px-4 rounded-full bg-[#FAF5EB] border border-[#EBDCC7] text-sm font-bold text-[#2D3436]"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nama_batch} ({b.status === 'aktif' ? 'Aktif' : 'Selesai'})
              </option>
            ))}
          </select>
        </div>

        {selectedBatch && (
          <div className="flex items-center justify-between px-3 pt-2 border-t border-[#FAF5EB] text-xs font-bold text-[#636E72]">
            <span className="flex items-center gap-1.5">
              <Icon icon="solar:calendar-bold" width={16} height={16} className="text-[#4ECDC4]" />
              Tanggal Tutup: {selectedBatch.tanggal_tutup || '-'}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                selectedBatch.status === 'aktif'
                  ? 'bg-[#4ECDC4] text-white'
                  : 'bg-[#F0E6D6] text-[#636E72]'
              }`}
            >
              {selectedBatch.status}
            </span>
          </div>
        )}
      </div>

      {/* Kartu Ringkasan Utama */}
      <section className="grid grid-cols-2 gap-3">
        <div className="col-span-2 bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#4ECDC4]/40 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#4ECDC4]">
              Total Fee Didapat
            </p>
            <p className="font-black text-3xl text-[#2D3436] mt-1">
              {formatRupiah(summary.totalFee)}
            </p>
          </div>
          <div className="w-14 h-14 rounded-full bg-[#4ECDC4]/15 text-[#4ECDC4] flex items-center justify-center shrink-0">
            <Icon icon="solar:wallet-money-bold" width={30} height={30} />
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-[#EBDCC7]/50">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#636E72]">
            Nilai Barang
          </p>
          <p className="font-black text-lg text-[#FF6B6B] mt-1">
            {formatRupiah(summary.totalBarang)}
          </p>
        </div>

        <div className="bg-white rounded-[2rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-[#EBDCC7]/50">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#636E72]">
            Barang &amp; Pemesan
          </p>
          <p className="font-black text-lg text-[#2D3436] mt-1">
            {summary.totalQty} pcs{' '}
            <span className="text-xs font-bold text-[#636E72]">
              ({summary.uniquePemesan} org)
            </span>
          </p>
        </div>
      </section>

      {/* Summary per Brand */}
      <section className="space-y-3">
        <h2 className="font-black text-xl text-[#2D3436] px-1">
          Ringkasan per Brand ({brandSummaries.length})
        </h2>

        {brandSummaries.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-[#EBDCC7]/50">
            <p className="font-bold text-sm text-[#636E72]">
              Belum ada data pesanan aktif untuk event ini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {brandSummaries.map((b) => (
              <article
                key={b.brand}
                className="bg-white rounded-[1.75rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-[#EBDCC7]/50 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <h3 className="font-black text-base text-[#2D3436] truncate">
                    {b.brand}
                  </h3>
                  <p className="text-xs font-bold text-[#636E72] mt-0.5">
                    {b.totalQty} pcs &bull; Nilai {formatRupiah(b.totalBarang)}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#636E72]">
                    Fee
                  </p>
                  <p className="font-black text-base text-[#4ECDC4]">
                    {formatRupiah(b.totalFee)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}