'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { mutate } from 'swr'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_TIPE_BARANG } from '@/lib/feeCalculator'
import { useBatch } from '@/hooks/useJastipData'
import { VarianEditor } from './VarianEditor'
import type { Produk, VarianProduk } from '@/types/database'

interface ProdukFormModalProps {
  isOpen: boolean
  initialData: Produk | null
  onClose: () => void
  onSaved: (saved: Produk, isEdit: boolean) => void
}

export function ProdukFormModal({
  isOpen,
  initialData,
  onClose,
  onSaved,
}: ProdukFormModalProps) {
  const supabase = createClient()
  const { data: batchList = [] } = useBatch()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const namaId = useId()
  const brandId = useId()
  const hargaId = useId()
  const tipeId = useId()
  const tipeListId = useId()
  const batchId = useId()
  const deskripsiId = useId()

  const [namaBarang, setNamaBarang] = useState('')
  const [brand, setBrand] = useState('')
  const [hargaDasar, setHargaDasar] = useState('')
  const [tipeBarang, setTipeBarang] = useState('Reguler')
  const [idBatch, setIdBatch] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [varian, setVarian] = useState<VarianProduk[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setNamaBarang(initialData?.nama_barang ?? '')
      setBrand(initialData?.brand ?? '')
      setHargaDasar(initialData ? String(initialData.harga_dasar) : '')
      setTipeBarang(initialData?.tipe_barang ?? 'Reguler')
      setIdBatch(initialData?.id_batch ?? '')
      setDeskripsi(initialData?.deskripsi ?? '')
      setVarian(Array.isArray(initialData?.varian) ? initialData.varian : [])
      setErrorMsg(null)
    }
  }, [isOpen, initialData])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)

    const parsedHarga = parseInt(hargaDasar.replace(/\D/g, ''), 10) || 0
    const cleanedVarian = varian
      .map((v) => ({ nama: v.nama.trim(), harga: v.harga }))
      .filter((v) => v.nama.length > 0)

    const payload = {
      nama_barang: namaBarang.trim(),
      brand: brand.trim() || null,
      deskripsi: deskripsi.trim() || null,
      harga_dasar: parsedHarga,
      tipe_barang: tipeBarang.trim() || 'Reguler',
      id_batch: idBatch || null,
      varian: cleanedVarian,
    }

    setIsSaving(true)
    try {
      if (initialData) {
        const { data, error } = await supabase
          .from('produk')
          .update(payload)
          .eq('id', initialData.id)
          .select()
          .single()

        if (error) throw error
        onSaved(data as Produk, true)
      } else {
        const { data, error } = await supabase
          .from('produk')
          .insert(payload)
          .select()
          .single()

        if (error) throw error
        onSaved(data as Produk, false)
      }
      mutate('produk')
      onClose()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan produk.')
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
          {initialData ? 'Edit Produk' : 'Tambah Produk Baru'}
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

        <div className="space-y-1.5">
          <label
            htmlFor={namaId}
            className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
          >
            Nama Barang *
          </label>
          <input
            id={namaId}
            type="text"
            required
            value={namaBarang}
            onChange={(e) => setNamaBarang(e.target.value)}
            placeholder="Cth: Stroller Cabin Friendly"
            className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor={brandId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Brand
            </label>
            <input
              id={brandId}
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Cth: Bugaboo / Uniqlo"
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={hargaId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Harga Dasar (Rp) *
            </label>
            <input
              id={hargaId}
              type="text"
              inputMode="numeric"
              required
              value={hargaDasar}
              onChange={(e) => setHargaDasar(e.target.value.replace(/\D/g, ''))}
              placeholder="250000"
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
            />
          </div>
        </div>

        {/* Tipe Barang (untuk Extra Fee) & Batch/Event */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor={tipeId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Tipe Barang (Fee)
            </label>
            <input
              id={tipeId}
              list={tipeListId}
              type="text"
              value={tipeBarang}
              onChange={(e) => setTipeBarang(e.target.value)}
              placeholder="Reguler"
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
            />
            <datalist id={tipeListId}>
              {DEFAULT_TIPE_BARANG.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={batchId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Event / Batch (Opsional)
            </label>
            <select
              id={batchId}
              value={idBatch}
              onChange={(e) => setIdBatch(e.target.value)}
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
            >
              <option value="">Umum (Semua Event)</option>
              {batchList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nama_batch}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={deskripsiId}
            className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
          >
            Deskripsi
          </label>
          <textarea
            id={deskripsiId}
            rows={2}
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Catatan bahan, ukuran, atau info jastip..."
            className="w-full p-4 rounded-2xl bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4] resize-none"
          />
        </div>

        <div className="pt-1">
          <VarianEditor
            value={varian}
            defaultHarga={parseInt(hargaDasar, 10) || 0}
            onChange={setVarian}
          />
        </div>

        <div className="flex gap-3 pt-3">
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
                Simpan Produk
              </>
            )}
          </button>
        </div>
      </form>
    </dialog>
  )
}