'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import type {
  InvoiceWithRelations,
  StatusPembayaran,
  StatusPengiriman,
} from '@/types/database'

interface EditInvoiceModalProps {
  invoice: InvoiceWithRelations | null
  onClose: () => void
  onUpdated: (updated: InvoiceWithRelations) => void
}

export function EditInvoiceModal({
  invoice,
  onClose,
  onUpdated,
}: EditInvoiceModalProps) {
  const supabase = createClient()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const statusBayarId = useId()
  const dpId = useId()
  const jasaId = useId()
  const ongkirId = useId()
  const resiId = useId()
  const statusKirimId = useId()
  const jatuhTempoId = useId()

  const [statusPembayaran, setStatusPembayaran] = useState<StatusPembayaran>('belum_lunas')
  const [nominalDp, setNominalDp] = useState('0')
  const [jasaPengiriman, setJasaPengiriman] = useState('')
  const [ongkir, setOngkir] = useState('0')
  const [resi, setResi] = useState('')
  const [statusPengiriman, setStatusPengiriman] = useState<StatusPengiriman>('pengemasan')
  const [jatuhTempo, setJatuhTempo] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isOpen = Boolean(invoice)

  useEffect(() => {
    if (invoice) {
      setStatusPembayaran(invoice.status_pembayaran)
      setNominalDp(String(invoice.nominal_dp))
      setJasaPengiriman(invoice.jasa_pengiriman ?? '')
      setOngkir(String(invoice.ongkir))
      setResi(invoice.resi ?? '')
      setStatusPengiriman(invoice.status_pengiriman)
      setJatuhTempo(invoice.jatuh_tempo ?? '')
      setErrorMsg(null)
    }
  }, [invoice])

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
    if (!invoice) return
    setErrorMsg(null)
    setIsSaving(true)

    const parsedOngkir = parseInt(ongkir.replace(/\D/g, ''), 10) || 0
    const parsedDp =
      statusPembayaran === 'dp' ? parseInt(nominalDp.replace(/\D/g, ''), 10) || 0 : 0

    try {
      const { data, error } = await supabase
        .from('invoice_pengiriman')
        .update({
          status_pembayaran: statusPembayaran,
          nominal_dp: parsedDp,
          jasa_pengiriman: jasaPengiriman.trim() || null,
          ongkir: parsedOngkir,
          resi: resi.trim() || null,
          status_pengiriman: statusPengiriman,
          jatuh_tempo: jatuhTempo || null,
        })
        .eq('id', invoice.id)
        .select(`
          *,
          pemesan:id_pemesan ( id, nama_jastiper, no_wa, alamat )
        `)
        .single()

      if (error) throw error
      onUpdated(data as unknown as InvoiceWithRelations)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui invoice.'
      setErrorMsg(msg)
    } finally {
      setIsSaving(false)
    }
  }

  if (!invoice) return null

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
      className="m-auto w-[calc(100%-2rem)] max-w-md max-h-[90dvh] overflow-y-auto rounded-[2rem] bg-white p-6 shadow-[0_20px_40px_rgb(0,0,0,0.15)] border border-[#EBDCC7] backdrop:bg-[#2D3436]/40 backdrop:backdrop-blur-xs"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#4ECDC4]">
            {invoice.nomor_invoice}
          </p>
          <h2 className="font-black text-xl text-[#2D3436]">
            Update Bayar &amp; Kirim
          </h2>
        </div>
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

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor={statusBayarId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Pembayaran
            </label>
            <select
              id={statusBayarId}
              value={statusPembayaran}
              onChange={(e) => setStatusPembayaran(e.target.value as StatusPembayaran)}
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436]"
            >
              <option value="belum_lunas">Belum Lunas</option>
              <option value="dp">DP</option>
              <option value="lunas">Lunas</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={jatuhTempoId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Jatuh Tempo
            </label>
            <input
              id={jatuhTempoId}
              type="date"
              value={jatuhTempo}
              onChange={(e) => setJatuhTempo(e.target.value)}
              className="w-full h-11 px-3 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-xs font-bold text-[#2D3436]"
            />
          </div>
        </div>

        {statusPembayaran === 'dp' && (
          <div className="space-y-1.5">
            <label
              htmlFor={dpId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Nominal DP (Rp)
            </label>
            <input
              id={dpId}
              type="text"
              inputMode="numeric"
              value={nominalDp}
              onChange={(e) => setNominalDp(e.target.value.replace(/\D/g, ''))}
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436]"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor={jasaId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Jasa Kirim
            </label>
            <input
              id={jasaId}
              type="text"
              value={jasaPengiriman}
              onChange={(e) => setJasaPengiriman(e.target.value)}
              placeholder="JNE / Paxel"
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={ongkirId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Ongkir (Rp)
            </label>
            <input
              id={ongkirId}
              type="text"
              inputMode="numeric"
              value={ongkir}
              onChange={(e) => setOngkir(e.target.value.replace(/\D/g, ''))}
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={statusKirimId}
            className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
          >
            Status Pengiriman
          </label>
          <select
            id={statusKirimId}
            value={statusPengiriman}
            onChange={(e) => setStatusPengiriman(e.target.value as StatusPengiriman)}
            className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436]"
          >
            <option value="pengemasan">Pengemasan</option>
            <option value="dalam_pengiriman">Dalam Pengiriman</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={resiId}
            className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
          >
            Nomor Resi
          </label>
          <input
            id={resiId}
            type="text"
            value={resi}
            onChange={(e) => setResi(e.target.value)}
            placeholder="Masukkan nomor resi kurir..."
            className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436]"
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
              <Icon icon="solar:refresh-bold" width={18} height={18} className="animate-spin" />
            ) : (
              'Simpan Update'
            )}
          </button>
        </div>
      </form>
    </dialog>
  )
}