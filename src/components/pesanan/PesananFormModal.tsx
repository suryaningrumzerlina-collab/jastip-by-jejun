'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { mutate } from 'swr'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils'
import { hitungFeeSatuan } from '@/lib/feeCalculator'
import { useAturanFee } from '@/hooks/useJastipData'
import { useActiveBatch } from '@/components/providers/ActiveBatchProvider'
import type {
  Batch,
  Pemesan,
  PesananWithRelations,
  Produk,
  StatusJastip,
} from '@/types/database'

interface PesananFormModalProps {
  isOpen: boolean
  initialData: PesananWithRelations | null
  batchList: Batch[]
  pemesanList: Pemesan[]
  produkList: Produk[]
  onClose: () => void
  onSaved: (saved: PesananWithRelations, isEdit: boolean) => void
}

const STATUS_OPTIONS: { value: StatusJastip; label: string }[] = [
  { value: 'tercatat', label: 'Tercatat' },
  { value: 'dapat_barang', label: 'Dapat Barang' },
  { value: 'terkonfirmasi', label: 'Terkonfirmasi ke Pembeli' },
  { value: 'kosong_batal', label: 'Kosong / Batal' },
]

export function PesananFormModal({
  isOpen,
  initialData,
  batchList,
  pemesanList,
  produkList,
  onClose,
  onSaved,
}: PesananFormModalProps) {
  const supabase = createClient()
  const { data: aturanFeeList = [] } = useAturanFee()
  const { activeBatchId } = useActiveBatch()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const batchId = useId()
  const pemesanId = useId()
  const brandFilterId = useId()
  const produkId = useId()
  const varianId = useId()
  const qtyId = useId()
  const hargaId = useId()
  const feeId = useId()
  const statusId = useId()
  const catatanId = useId()

  const defaultBatch = useMemo(() => {
    if (activeBatchId !== 'semua') return activeBatchId
    return batchList.find((b) => b.status === 'aktif')?.id ?? batchList[0]?.id ?? ''
  }, [activeBatchId, batchList])

  const [idBatch, setIdBatch] = useState('')
  const [idPemesan, setIdPemesan] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('semua')
  const [idProduk, setIdProduk] = useState('')
  const [varianDipilih, setVarianDipilih] = useState('')
  const [qty, setQty] = useState('1')
  const [hargaSatuan, setHargaSatuan] = useState('')
  const [feeSatuan, setFeeSatuan] = useState('0')
  const [statusJastip, setStatusJastip] = useState<StatusJastip>('tercatat')
  const [catatan, setCatatan] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Daftar unik Brand untuk dropdown filter
  const brandOptions = useMemo(() => {
    const set = new Set<string>()
    for (const p of produkList) {
      set.add(p.brand?.trim() || 'Tanpa Brand')
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id'))
  }, [produkList])

  // Daftar produk yang sudah disaring berdasarkan Brand
  const filteredProdukList = useMemo(() => {
    if (selectedBrand === 'semua') return produkList
    return produkList.filter(
      (p) => (p.brand?.trim() || 'Tanpa Brand') === selectedBrand
    )
  }, [produkList, selectedBrand])

  const selectedProduk = useMemo(
    () => produkList.find((p) => p.id === idProduk) ?? null,
    [produkList, idProduk]
  )

  const varianOptions = useMemo(
    () => (Array.isArray(selectedProduk?.varian) ? selectedProduk.varian : []),
    [selectedProduk]
  )

  useEffect(() => {
    if (isOpen) {
      setIdBatch(initialData?.id_batch ?? defaultBatch)
      setIdPemesan(initialData?.id_pemesan ?? '')
      setSelectedBrand(
        initialData?.produk?.brand?.trim()
          ? initialData.produk.brand.trim()
          : 'semua'
      )
      setIdProduk(initialData?.id_produk ?? '')
      setVarianDipilih(initialData?.varian_dipilih ?? '')
      setQty(initialData ? String(initialData.qty) : '1')
      setHargaSatuan(initialData ? String(initialData.harga_satuan) : '')
      setFeeSatuan(initialData ? String(initialData.fee_satuan ?? 0) : '0')
      setStatusJastip(initialData?.status_jastip ?? 'tercatat')
      setCatatan(initialData?.catatan ?? '')
      setErrorMsg(null)
    }
  }, [isOpen, initialData, defaultBatch])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  function applyAutoFee(nextHarga: number, nextTipe: string | null | undefined, nextBatch: string) {
    const { totalFeeSatuan } = hitungFeeSatuan(nextHarga, nextTipe, nextBatch, aturanFeeList)
    setFeeSatuan(String(totalFeeSatuan))
  }

  function handleBatchChange(nextBatch: string) {
    setIdBatch(nextBatch)
    const numericHarga = parseInt(hargaSatuan.replace(/\D/g, ''), 10) || 0
    applyAutoFee(numericHarga, selectedProduk?.tipe_barang, nextBatch)
  }

  function handleBrandChange(nextBrand: string) {
    setSelectedBrand(nextBrand)
    setIdProduk('')
    setVarianDipilih('')
    setHargaSatuan('')
    setFeeSatuan('0')
  }

  function handleProdukChange(nextProdukId: string) {
    setIdProduk(nextProdukId)
    const prod = produkList.find((p) => p.id === nextProdukId)
    if (!prod) {
      setVarianDipilih('')
      setHargaSatuan('')
      setFeeSatuan('0')
      return
    }

    const listVarian = Array.isArray(prod.varian) ? prod.varian : []
    const hargaAwal = listVarian.length > 0 ? listVarian[0].harga : prod.harga_dasar
    setVarianDipilih(listVarian.length > 0 ? listVarian[0].nama : '')
    setHargaSatuan(String(hargaAwal))
    applyAutoFee(hargaAwal, prod.tipe_barang, idBatch)
  }

  function handleVarianChange(nextVarianNama: string) {
    setVarianDipilih(nextVarianNama)
    const found = varianOptions.find((v) => v.nama === nextVarianNama)
    if (found) {
      setHargaSatuan(String(found.harga))
      applyAutoFee(found.harga, selectedProduk?.tipe_barang, idBatch)
    }
  }

  function handleHargaManualChange(raw: string) {
    const clean = raw.replace(/\D/g, '')
    setHargaSatuan(clean)
    const numeric = parseInt(clean, 10) || 0
    applyAutoFee(numeric, selectedProduk?.tipe_barang, idBatch)
  }

  const parsedQty = parseInt(qty, 10) || 0
  const parsedHarga = parseInt(hargaSatuan.replace(/\D/g, ''), 10) || 0
  const parsedFee = parseInt(feeSatuan.replace(/\D/g, ''), 10) || 0
  const previewBarang = parsedQty * parsedHarga
  const previewFee = parsedQty * parsedFee

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)

    const payload = {
      id_batch: idBatch || null,
      id_pemesan: idPemesan,
      id_produk: idProduk,
      varian_dipilih: varianDipilih.trim() || null,
      qty: parsedQty || 1,
      harga_satuan: parsedHarga,
      fee_satuan: parsedFee,
      status_jastip: statusJastip,
      catatan: catatan.trim() || null,
    }

    const selectQuery = `
      *,
      pemesan:id_pemesan ( id, nama_jastiper, no_wa ),
      produk:id_produk ( id, nama_barang, brand, tipe_barang ),
      batch:id_batch ( id, nama_batch )
    `

    setIsSaving(true)
    try {
      if (initialData) {
        const { data, error } = await supabase
          .from('pesanan')
          .update(payload)
          .eq('id', initialData.id)
          .select(selectQuery)
          .single()

        if (error) throw error
        onSaved(data as unknown as PesananWithRelations, true)
      } else {
        const { data, error } = await supabase
          .from('pesanan')
          .insert(payload)
          .select(selectQuery)
          .single()

        if (error) throw error
        onSaved(data as unknown as PesananWithRelations, false)
      }
      mutate('pesanan')
      onClose()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan pesanan.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault()
        if (!isSaving) onClose()
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current && !isSaving) onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto rounded-[2rem] bg-white p-6 shadow-[0_20px_40px_rgb(0,0,0,0.15)] border border-[#EBDCC7] backdrop:bg-[#2D3436]/40 backdrop:backdrop-blur-xs"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-black text-xl text-[#2D3436]">
          {initialData ? 'Edit Pesanan' : 'Catat Pesanan Baru'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          aria-label="Tutup modal"
          className="w-9 h-9 rounded-full bg-[#FAF5EB] text-[#636E72] hover:text-[#FF6B6B] flex items-center justify-center cursor-pointer"
        >
          <Icon icon="solar:close-circle-bold" width={22} height={22} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div
            role="alert"
            aria-live="polite"
            className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-[#FF6B6B] rounded-2xl px-4 py-3 text-xs font-bold"
          >
            {errorMsg}
          </div>
        )}

        {/* Batch & Pemesan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor={batchId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Batch / Event
            </label>
            <select
              id={batchId}
              value={idBatch}
              onChange={(e) => handleBatchChange(e.target.value)}
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
            >
              <option value="">Tanpa Batch</option>
              {batchList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nama_batch}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={pemesanId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Pemesan *
            </label>
            <select
              id={pemesanId}
              required
              value={idPemesan}
              onChange={(e) => setIdPemesan(e.target.value)}
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
            >
              <option value="" disabled>
                Pilih jastiper...
              </option>
              {pemesanList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama_jastiper}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Brand (Mempersempit daftar produk) */}
        <div className="space-y-1.5">
          <label
            htmlFor={brandFilterId}
            className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#4ECDC4] pl-2"
          >
            Filter Brand
          </label>
          <select
            id={brandFilterId}
            value={selectedBrand}
            onChange={(e) => handleBrandChange(e.target.value)}
            className="w-full h-11 px-4 rounded-full bg-[#4ECDC4]/10 border border-[#4ECDC4]/40 text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
          >
            <option value="semua">Semua Brand ({produkList.length} produk)</option>
            {brandOptions.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        {/* Produk */}
        <div className="space-y-1.5">
          <label
            htmlFor={produkId}
            className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
          >
            Produk *
          </label>
          <select
            id={produkId}
            required
            value={idProduk}
            onChange={(e) => handleProdukChange(e.target.value)}
            className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
          >
            <option value="" disabled>
              Pilih barang ({filteredProdukList.length} tersedia)...
            </option>
            {filteredProdukList.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {selectedBrand === 'semua' && prod.brand ? `[${prod.brand}] ` : ''}
                {prod.nama_barang}
                {prod.tipe_barang && prod.tipe_barang !== 'Reguler'
                  ? ` (${prod.tipe_barang})`
                  : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Varian */}
        {varianOptions.length > 0 && (
          <div className="space-y-1.5">
            <label
              htmlFor={varianId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Varian *
            </label>
            <select
              id={varianId}
              required
              value={varianDipilih}
              onChange={(e) => handleVarianChange(e.target.value)}
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
            >
              {varianOptions.map((v, idx) => (
                <option key={idx} value={v.nama}>
                  {v.nama} — {formatRupiah(v.harga)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Qty, Harga Satuan, & Fee Satuan */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="space-y-1.5">
            <label
              htmlFor={qtyId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Qty *
            </label>
            <input
              id={qtyId}
              type="number"
              inputMode="numeric"
              min={1}
              required
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full h-11 px-3 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] text-center"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={hargaId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Harga *
            </label>
            <input
              id={hargaId}
              type="text"
              inputMode="numeric"
              required
              value={hargaSatuan}
              onChange={(e) => handleHargaManualChange(e.target.value)}
              placeholder="0"
              className="w-full h-11 px-3 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={feeId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#4ECDC4] pl-2"
            >
              Fee/Item
            </label>
            <input
              id={feeId}
              type="text"
              inputMode="numeric"
              value={feeSatuan}
              onChange={(e) => setFeeSatuan(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="w-full h-11 px-3 rounded-full bg-[#4ECDC4]/10 border border-[#4ECDC4]/40 text-sm font-bold text-[#2D3436]"
            />
          </div>
        </div>

        {/* Preview Total Barang + Fee */}
        <div className="bg-[#FAF5EB] rounded-2xl px-4 py-3 border border-[#EBDCC7]/70 space-y-1">
          <div className="flex justify-between text-xs font-bold text-[#636E72]">
            <span>Subtotal Barang</span>
            <span>{formatRupiah(previewBarang)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-[#4ECDC4]">
            <span>Total Fee ({parsedQty} &times; {formatRupiah(parsedFee)})</span>
            <span>+{formatRupiah(previewFee)}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-[#EBDCC7]">
            <span className="text-xs font-black uppercase tracking-[0.1em] text-[#2D3436]">
              Total Tagihan Item
            </span>
            <span className="font-black text-base text-[#FF6B6B]">
              {formatRupiah(previewBarang + previewFee)}
            </span>
          </div>
        </div>

        {/* Status & Catatan */}
        <div className="space-y-1.5">
          <label
            htmlFor={statusId}
            className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
          >
            Status Jastip
          </label>
          <select
            id={statusId}
            value={statusJastip}
            onChange={(e) => setStatusJastip(e.target.value as StatusJastip)}
            className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={catatanId}
            className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
          >
            Catatan (Opsional)
          </label>
          <textarea
            id={catatanId}
            rows={2}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Cth: Jika warna pink habis, boleh ganti lilac..."
            className="w-full p-4 rounded-2xl bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="flex-1 h-12 rounded-full bg-white border border-[#EBDCC7] text-[#2D3436] font-bold text-sm hover:bg-[#FAF5EB] cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 h-12 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Icon icon="solar:refresh-bold" width={18} height={18} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Icon icon="solar:diskette-bold" width={18} height={18} />
                Simpan Pesanan
              </>
            )}
          </button>
        </div>
      </form>
    </dialog>
  )
}