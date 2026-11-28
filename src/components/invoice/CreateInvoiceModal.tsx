'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils'
import type {
  InvoiceWithRelations,
  Pemesan,
  PesananWithRelations,
  StatusPembayaran,
} from '@/types/database'

interface CreateInvoiceModalProps {
  isOpen: boolean
  pemesanList: Pemesan[]
  unbilledPesanan: PesananWithRelations[]
  onClose: () => void
  onCreated: (invoice: InvoiceWithRelations, bundledPesananIds: string[]) => void
}

function generateNomorInvoice(): string {
  const now = new Date()
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `INV-${ym}-${rand}`
}

export function CreateInvoiceModal({
  isOpen,
  pemesanList,
  unbilledPesanan,
  onClose,
  onCreated,
}: CreateInvoiceModalProps) {
  const supabase = createClient()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const pemesanId = useId()
  const jasaId = useId()
  const ongkirId = useId()
  const jatuhTempoId = useId()
  const statusBayarId = useId()
  const dpId = useId()

  const [selectedPemesanId, setSelectedPemesanId] = useState('')
  const [selectedPesananIds, setSelectedPesananIds] = useState<string[]>([])
  const [jasaPengiriman, setJasaPengiriman] = useState('')
  const [ongkir, setOngkir] = useState('0')
  const [jatuhTempo, setJatuhTempo] = useState('')
  const [statusPembayaran, setStatusPembayaran] = useState<StatusPembayaran>('belum_lunas')
  const [nominalDp, setNominalDp] = useState('0')

  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Hitung jumlah item siap tagih per pemesan
  const readyCountByPemesan = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of unbilledPesanan) {
      counts.set(p.id_pemesan, (counts.get(p.id_pemesan) ?? 0) + 1)
    }
    return counts
  }, [unbilledPesanan])

  // Daftar pesanan siap tagih milik pemesan terpilih
  const pemesanItems = useMemo(
    () => unbilledPesanan.filter((p) => p.id_pemesan === selectedPemesanId),
    [unbilledPesanan, selectedPemesanId]
  )

  useEffect(() => {
    if (isOpen) {
      setSelectedPemesanId('')
      setSelectedPesananIds([])
      setJasaPengiriman('')
      setOngkir('0')
      setJatuhTempo('')
      setStatusPembayaran('belum_lunas')
      setNominalDp('0')
      setErrorMsg(null)
    }
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  // Saat pemesan dipilih, otomatis centang semua pesanannya yang siap tagih
  function handleSelectPemesan(id: string) {
    setSelectedPemesanId(id)
    const ids = unbilledPesanan.filter((p) => p.id_pemesan === id).map((p) => p.id)
    setSelectedPesananIds(ids)
  }

  function togglePesanan(id: string) {
    setSelectedPesananIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const hargaBundle = useMemo(() => {
    return pemesanItems
      .filter((item) => selectedPesananIds.includes(item.id))
      .reduce((sum, item) => sum + item.harga_total, 0)
  }, [pemesanItems, selectedPesananIds])

  const totalFee = useMemo(() => {
  return pemesanItems
    .filter((item) => selectedPesananIds.includes(item.id))
    .reduce((sum, item) => sum + (item.fee_total ?? 0), 0)
}, [pemesanItems, selectedPesananIds])

  const parsedOngkir = parseInt(ongkir.replace(/\D/g, ''), 10) || 0
  const grandTotal = hargaBundle + totalFee + parsedOngkir

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)

    if (!selectedPemesanId) {
      setErrorMsg('Pilih pemesan terlebih dahulu.')
      return
    }
    if (selectedPesananIds.length === 0) {
      setErrorMsg('Pilih minimal 1 pesanan untuk dimasukkan ke invoice.')
      return
    }

    const parsedDp =
      statusPembayaran === 'dp' ? parseInt(nominalDp.replace(/\D/g, ''), 10) || 0 : 0

    setIsSaving(true)
    try {
      // 1. Buat baris invoice_pengiriman baru
      const { data: createdInv, error: invError } = await supabase
        .from('invoice_pengiriman')
        .insert({
          nomor_invoice: generateNomorInvoice(),
          id_batch: pemesanItems.find((i) => selectedPesananIds.includes(i.id))?.id_batch ?? null,
          total_fee: totalFee,
          id_pemesan: selectedPemesanId,
          harga_bundle: hargaBundle,
          jasa_pengiriman: jasaPengiriman.trim() || null,
          ongkir: parsedOngkir,
          nominal_dp: parsedDp,
          status_pembayaran: statusPembayaran,
          jatuh_tempo: jatuhTempo || null,
          status_pengiriman: 'pengemasan',
        })
        .select(`
          *,
          pemesan:id_pemesan ( id, nama_jastiper, no_wa, alamat )
        `)
        .single()

      if (invError) throw invError

      // 2. Ikat semua pesanan terpilih ke id_pengiriman baru
      const { error: linkError } = await supabase
        .from('pesanan')
        .update({ id_pengiriman: createdInv.id })
        .in('id', selectedPesananIds)

      if (linkError) throw linkError

      onCreated(createdInv as unknown as InvoiceWithRelations, selectedPesananIds)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat invoice.'
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
        <h2 className="font-black text-xl text-[#2D3436]">Buat Invoice Baru</h2>
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

        {/* Pilih Pemesan */}
        <div className="space-y-1.5">
          <label
            htmlFor={pemesanId}
            className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
          >
            Pilih Pemesan *
          </label>
          <select
            id={pemesanId}
            required
            value={selectedPemesanId}
            onChange={(e) => handleSelectPemesan(e.target.value)}
            className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
          >
            <option value="" disabled>
              Pilih jastiper...
            </option>
            {pemesanList.map((p) => {
              const count = readyCountByPemesan.get(p.id) ?? 0
              return (
                <option key={p.id} value={p.id}>
                  {p.nama_jastiper} {count > 0 ? `(${count} item siap tagih)` : '(0 item)'}
                </option>
              )
            })}
          </select>
        </div>

        {/* Checklist Pesanan Terkonfirmasi */}
        {selectedPemesanId && (
          <div className="space-y-2">
            <span className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2">
              Pesanan Siap Tagih (Terkonfirmasi)
            </span>

            {pemesanItems.length === 0 ? (
              <div className="rounded-2xl bg-[#FAF5EB] border border-dashed border-[#EBDCC7] p-4 text-center">
                <p className="text-xs font-bold text-[#636E72]">
                  Belum ada pesanan berstatus &ldquo;Terkonfirmasi&rdquo; yang belum ditagihkan untuk pemesan ini.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {pemesanItems.map((item) => {
                  const checked = selectedPesananIds.includes(item.id)
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center justify-between gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
                        checked
                          ? 'bg-[#4ECDC4]/10 border-[#4ECDC4]'
                          : 'bg-[#FAF5EB]/50 border-[#EBDCC7]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePesanan(item.id)}
                          className="w-4 h-4 accent-[#4ECDC4] rounded shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-black text-xs text-[#2D3436] truncate">
                            {item.produk?.nama_barang ?? 'Produk'} &times; {item.qty}
                          </p>
                          {item.varian_dipilih && (
                            <p className="text-[11px] font-bold text-[#636E72] truncate">
                              {item.varian_dipilih}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-black text-xs text-[#2D3436] shrink-0">
                        {formatRupiah(item.harga_total)}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Jasa Pengiriman & Ongkir */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor={jasaId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Jasa Pengiriman
            </label>
            <input
              id={jasaId}
              type="text"
              value={jasaPengiriman}
              onChange={(e) => setJasaPengiriman(e.target.value)}
              placeholder="Cth: JNE Reg / Paxel"
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
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
              placeholder="0"
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
            />
          </div>
        </div>

        {/* Jatuh Tempo & Status Pembayaran */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={statusBayarId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Status Pembayaran
            </label>
            <select
              id={statusBayarId}
              value={statusPembayaran}
              onChange={(e) => setStatusPembayaran(e.target.value as StatusPembayaran)}
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
            >
              <option value="belum_lunas">Belum Lunas</option>
              <option value="dp">DP (Uang Muka)</option>
              <option value="lunas">Lunas</option>
            </select>
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
              placeholder="0"
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
            />
          </div>
        )}

        {/* Ringkasan Total */}
        <div className="bg-[#FAF5EB] rounded-2xl p-4 border border-[#EBDCC7]/70 space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-[#636E72]">
            <span>Total Barang ({selectedPesananIds.length} item)</span>
            <span>{formatRupiah(hargaBundle)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-[#4ECDC4]">
            <span>Total Fee Jastip</span>
            <span>{formatRupiah(totalFee)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-[#636E72]">
            <span>Ongkir</span>
            <span>{formatRupiah(parsedOngkir)}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-[#EBDCC7]">
            <span className="text-xs font-black uppercase tracking-[0.1em] text-[#2D3436]">
              Total Tagihan
            </span>
            <span className="font-black text-lg text-[#FF6B6B]">
              {formatRupiah(grandTotal)}
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
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
            disabled={isSaving || selectedPesananIds.length === 0}
            className="flex-1 h-12 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Icon icon="solar:refresh-bold" width={18} height={18} className="animate-spin" />
                Membuat...
              </>
            ) : (
              <>
                <Icon icon="solar:bill-check-bold" width={18} height={18} />
                Buat Invoice
              </>
            )}
          </button>
        </div>
      </form>
    </dialog>
  )
}