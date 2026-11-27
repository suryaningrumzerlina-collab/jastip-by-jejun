'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils'
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
  const dialogRef = useRef<HTMLDialogElement>(null)

  const batchId = useId()
  const pemesanId = useId()
  const produkId = useId()
  const varianId = useId()
  const qtyId = useId()
  const hargaId = useId()
  const statusId = useId()
  const catatanId = useId()

  const defaultActiveBatch = useMemo(
    () => batchList.find((b) => b.status === 'aktif')?.id ?? batchList[0]?.id ?? '',
    [batchList]
  )

  const [idBatch, setIdBatch] = useState('')
  const [idPemesan, setIdPemesan] = useState('')
  const [idProduk, setIdProduk] = useState('')
  const [varianDipilih, setVarianDipilih] = useState('')
  const [qty, setQty] = useState('1')
  const [hargaSatuan, setHargaSatuan] = useState('')
  const [statusJastip, setStatusJastip] = useState<StatusJastip>('tercatat')
  const [catatan, setCatatan] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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
      setIdBatch(initialData?.id_batch ?? defaultActiveBatch)
      setIdPemesan(initialData?.id_pemesan ?? '')
      setIdProduk(initialData?.id_produk ?? '')
      setVarianDipilih(initialData?.varian_dipilih ?? '')
      setQty(initialData ? String(initialData.qty) : '1')
      setHargaSatuan(initialData ? String(initialData.harga_satuan) : '')
      setStatusJastip(initialData?.status_jastip ?? 'tercatat')
      setCatatan(initialData?.catatan ?? '')
      setErrorMsg(null)
    }
  }, [isOpen, initialData, defaultActiveBatch])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  // Saat produk diganti, otomatis isi varian pertama & harga
  function handleProdukChange(nextProdukId: string) {
    setIdProduk(nextProdukId)
    const prod = produkList.find((p) => p.id === nextProdukId)
    if (!prod) {
      setVarianDipilih('')
      setHargaSatuan('')
      return
    }

    const listVarian = Array.isArray(prod.varian) ? prod.varian : []
    if (listVarian.length > 0) {
      setVarianDipilih(listVarian[0].nama)
      setHargaSatuan(String(listVarian[0].harga))
    } else {
      setVarianDipilih('')
      setHargaSatuan(String(prod.harga_dasar))
    }
  }

  // Saat varian diganti, otomatis perbarui harga satuan
  function handleVarianChange(nextVarianNama: string) {
    setVarianDipilih(nextVarianNama)
    const found = varianOptions.find((v) => v.nama === nextVarianNama)
    if (found) {
      setHargaSatuan(String(found.harga))
    }
  }

  const previewTotal =
    (parseInt(qty, 10) || 0) * (parseInt(hargaSatuan.replace(/\D/g, ''), 10) || 0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)

    const parsedQty = parseInt(qty, 10) || 1
    const parsedHarga = parseInt(hargaSatuan.replace(/\D/g, ''), 10) || 0

    const payload = {
      id_batch: idBatch || null,
      id_pemesan: idPemesan,
      id_produk: idProduk,
      varian_dipilih: varianDipilih.trim() || null,
      qty: parsedQty,
      harga_satuan: parsedHarga,
      status_jastip: statusJastip,
      catatan: catatan.trim() || null,
    }

    const selectQuery = `
      *,
      pemesan:id_pemesan ( id, nama_jastiper, no_wa ),
      produk:id_produk ( id, nama_barang, brand ),
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
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan pesanan.'
      setErrorMsg(msg)
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
              Batch PO
            </label>
            <select
              id={batchId}
              value={idBatch}
              onChange={(e) => setIdBatch(e.target.value)}
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
            >
              <option value="">Tanpa Batch</option>
              {batchList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nama_batch} {b.status === 'aktif' ? '(Aktif)' : ''}
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
              Pilih barang...
            </option>
            {produkList.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {prod.brand ? `[${prod.brand}] ` : ''}
                {prod.nama_barang}
              </option>
            ))}
          </select>
        </div>

        {/* Varian (Muncul otomatis jika produk memiliki varian JSONB) */}
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

        {/* Qty & Harga Satuan */}
        <div className="grid grid-cols-3 gap-3">
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
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] text-center focus:bg-white focus:border-[#4ECDC4]"
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <label
              htmlFor={hargaId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Harga Satuan (Rp) *
            </label>
            <input
              id={hargaId}
              type="text"
              inputMode="numeric"
              required
              value={hargaSatuan}
              onChange={(e) => setHargaSatuan(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
            />
          </div>
        </div>

        {/* Preview Total */}
        <div className="flex items-center justify-between bg-[#FAF5EB] rounded-2xl px-4 py-3 border border-[#EBDCC7]/70">
          <span className="text-xs font-black uppercase tracking-[0.1em] text-[#636E72]">
            Subtotal Item
          </span>
          <span className="font-black text-lg text-[#FF6B6B]">
            {formatRupiah(previewTotal)}
          </span>
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
            className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
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
            className="w-full p-4 rounded-2xl bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4] resize-none"
          />
        </div>

        {/* Tombol Aksi */}
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