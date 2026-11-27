'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils'
import type { Batch, PesananWithRelations, StatusJastip } from '@/types/database'

interface BelanjaClientProps {
  initialPesanan: PesananWithRelations[]
  batchList: Batch[]
}

interface ShoppingGroup {
  key: string
  namaBarang: string
  brand: string | null
  varian: string | null
  totalQty: number
  items: PesananWithRelations[]
}

interface LastAction {
  items: PesananWithRelations[]
  newStatus: StatusJastip
  label: string
}

export function BelanjaClient({ initialPesanan, batchList }: BelanjaClientProps) {
  const supabase = createClient()

  const defaultBatchId = useMemo(
    () => batchList.find((b) => b.status === 'aktif')?.id ?? 'semua',
    [batchList]
  )

  const [pesananList, setPesananList] = useState<PesananWithRelations[]>(initialPesanan)
  const [selectedBatch, setSelectedBatch] = useState<string>(defaultBatchId)
  const [search, setSearch] = useState('')
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<LastAction | null>(null)

  // Filter berdasarkan batch & pencarian
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return pesananList.filter((item) => {
      const matchBatch = selectedBatch === 'semua' || item.id_batch === selectedBatch
      if (!matchBatch) return false
      if (!q) return true
      return (
        (item.produk?.nama_barang ?? '').toLowerCase().includes(q) ||
        (item.produk?.brand ?? '').toLowerCase().includes(q) ||
        (item.varian_dipilih ?? '').toLowerCase().includes(q) ||
        (item.pemesan?.nama_jastiper ?? '').toLowerCase().includes(q)
      )
    })
  }, [pesananList, selectedBatch, search])

  // Kelompokkan berdasarkan Produk + Varian
  const groups = useMemo<ShoppingGroup[]>(() => {
    const map = new Map<string, ShoppingGroup>()

    for (const item of filteredItems) {
      const key = `${item.id_produk}__${item.varian_dipilih ?? ''}`
      const existing = map.get(key)
      if (existing) {
        existing.totalQty += item.qty
        existing.items.push(item)
      } else {
        map.set(key, {
          key,
          namaBarang: item.produk?.nama_barang ?? 'Produk',
          brand: item.produk?.brand ?? null,
          varian: item.varian_dipilih ?? null,
          totalQty: item.qty,
          items: [item],
        })
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.namaBarang.localeCompare(b.namaBarang)
    )
  }, [filteredItems])

  const totalPcsToBuy = useMemo(
    () => filteredItems.reduce((sum, item) => sum + item.qty, 0),
    [filteredItems]
  )

  async function updateItemsStatus(
    items: PesananWithRelations[],
    nextStatus: StatusJastip,
    actionKey: string,
    label: string
  ) {
    setBusyKey(actionKey)
    try {
      const ids = items.map((i) => i.id)
      const { error } = await supabase
        .from('pesanan')
        .update({ status_jastip: nextStatus })
        .in('id', ids)

      if (!error) {
        setPesananList((prev) => prev.filter((p) => !ids.includes(p.id)))
        setLastAction({ items, newStatus: nextStatus, label })
      }
    } finally {
      setBusyKey(null)
    }
  }

  async function handleUndo() {
    if (!lastAction) return
    setBusyKey('undo')
    try {
      const ids = lastAction.items.map((i) => i.id)
      const { error } = await supabase
        .from('pesanan')
        .update({ status_jastip: 'tercatat' })
        .in('id', ids)

      if (!error) {
        setPesananList((prev) => [...lastAction.items, ...prev])
        setLastAction(null)
      }
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72]">
            Mode Lapangan
          </p>
          <h1 className="font-black text-3xl tracking-[-0.02em] text-[#2D3436]">
            Daftar Belanja
          </h1>
        </div>

        <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-[#EBDCC7] text-right shrink-0">
          <span className="font-black text-lg text-[#FF6B6B]">{totalPcsToBuy}</span>
          <span className="text-xs font-bold text-[#636E72] ml-1">pcs sisa</span>
        </div>
      </div>

      {/* Filter Batch & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-2.5 bg-white px-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#EBDCC7]/50">
          <Icon icon="solar:magnifer-linear" className="text-[#4ECDC4] shrink-0" width={20} height={20} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari barang atau pemesan..."
            aria-label="Cari daftar belanja"
            className="w-full bg-transparent text-sm font-bold text-[#2D3436] placeholder:text-[#636E72]/60 focus:outline-none"
          />
        </div>

        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          aria-label="Filter Batch PO"
          className="h-12 px-5 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#EBDCC7]/50 text-sm font-bold text-[#2D3436] focus:border-[#4ECDC4]"
        >
          <option value="semua">Semua Batch PO</option>
          {batchList.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nama_batch} {b.status === 'aktif' ? '(Aktif)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Banner Undo (Jika baru saja menandai barang) */}
      {lastAction && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-[#4ECDC4]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Icon
              icon={
                lastAction.newStatus === 'dapat_barang'
                  ? 'solar:check-circle-bold'
                  : 'solar:close-circle-bold'
              }
              width={20}
              height={20}
              className={
                lastAction.newStatus === 'dapat_barang'
                  ? 'text-[#4ECDC4] shrink-0'
                  : 'text-[#FF6B6B] shrink-0'
              }
            />
            <span className="text-xs font-bold text-[#2D3436] truncate">
              {lastAction.label}
            </span>
          </div>
          <button
            type="button"
            disabled={busyKey === 'undo'}
            onClick={handleUndo}
            className="shrink-0 text-xs font-black uppercase tracking-wider text-[#FF6B6B] hover:underline cursor-pointer disabled:opacity-50"
          >
            Batal (Undo)
          </button>
        </div>
      )}

      {/* Daftar Produk Terkelompok */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#EBDCC7]/50 space-y-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#4ECDC4]/15 text-[#4ECDC4] flex items-center justify-center">
            <Icon icon="solar:check-read-bold" width={30} height={30} />
          </div>
          <h2 className="font-black text-lg text-[#2D3436]">Semua Beres!</h2>
          <p className="font-bold text-sm text-[#636E72]">
            Tidak ada barang berstatus &ldquo;Tercatat&rdquo; yang perlu dibeli saat ini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isGroupBusy = busyKey === group.key
            return (
              <details
                key={group.key}
                open
                className="group bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-[#EBDCC7]/50 overflow-hidden"
              >
                {/* Header Accordion: Produk, Varian & Total Qty */}
                <summary className="list-none cursor-pointer p-5 flex items-center justify-between gap-3 select-none">
                  <div className="min-w-0">
                    {group.brand && (
                      <span className="inline-block text-[10px] font-black uppercase tracking-[0.12em] text-[#4ECDC4] mb-0.5">
                        {group.brand}
                      </span>
                    )}
                    <h2 className="font-black text-lg text-[#2D3436] leading-snug">
                      {group.namaBarang}
                    </h2>
                    {group.varian && (
                      <span className="inline-block mt-1 bg-[#FAF5EB] border border-[#EBDCC7] px-2.5 py-0.5 rounded-full text-xs font-bold text-[#636E72]">
                        {group.varian}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="bg-[#FF6B6B] text-white font-black px-3.5 py-1.5 rounded-full text-sm border-2 border-white shadow-sm">
                      {group.totalQty} pcs
                    </div>
                    <Icon
                      icon="solar:alt-arrow-down-bold"
                      width={20}
                      height={20}
                      className="text-[#636E72] transition-transform group-open:rotate-180"
                    />
                  </div>
                </summary>

                {/* Isi Accordion: Daftar Pemesan & Tombol Aksi */}
                <div className="px-5 pb-5 pt-1 space-y-3 border-t border-[#EBDCC7]/40">
                  {group.items.map((item) => {
                    const isItemBusy = busyKey === item.id || isGroupBusy
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 bg-[#FAF5EB]/70 rounded-2xl p-3.5"
                      >
                        <div className="min-w-0">
                          <p className="font-black text-sm text-[#2D3436] truncate">
                            {item.pemesan?.nama_jastiper ?? 'Tanpa Nama'}{' '}
                            <span className="text-[#FF6B6B]">(&times;{item.qty})</span>
                          </p>
                          <p className="text-xs font-bold text-[#636E72]">
                            {formatRupiah(item.harga_total)}
                          </p>
                          {item.catatan && (
                            <p className="text-[11px] font-bold text-[#636E72] mt-1 italic">
                              &ldquo;{item.catatan}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={isItemBusy}
                            onClick={() =>
                              updateItemsStatus(
                                [item],
                                'kosong_batal',
                                item.id,
                                `${group.namaBarang} (${item.pemesan?.nama_jastiper}) ditandai kosong`
                              )
                            }
                            aria-label={`Tandai kosong untuk ${item.pemesan?.nama_jastiper}`}
                            className="h-9 px-3 rounded-full bg-white border border-[#EBDCC7] text-[#FF6B6B] hover:bg-[#FF6B6B]/10 font-bold text-xs cursor-pointer disabled:opacity-50"
                          >
                            Kosong
                          </button>
                          <button
                            type="button"
                            disabled={isItemBusy}
                            onClick={() =>
                              updateItemsStatus(
                                [item],
                                'dapat_barang',
                                item.id,
                                `${group.namaBarang} (${item.pemesan?.nama_jastiper}) sudah didapat`
                              )
                            }
                            className="h-9 px-3.5 rounded-full bg-[#4ECDC4] hover:bg-[#3dbdb4] text-white font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Icon icon="solar:check-circle-bold" width={16} height={16} />
                            Dapat
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {/* Tombol Cepat "Dapat Semua" jika pemesan > 1 */}
                  {group.items.length > 1 && (
                    <button
                      type="button"
                      disabled={isGroupBusy}
                      onClick={() =>
                        updateItemsStatus(
                          group.items,
                          'dapat_barang',
                          group.key,
                          `Semua ${group.namaBarang} (${group.totalQty} pcs) sudah didapat`
                        )
                      }
                      className="w-full h-11 rounded-full bg-[#FFE66D] hover:bg-[#ffd93d] text-[#2D3436] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Icon icon="solar:check-read-bold" width={18} height={18} />
                      <span>Tandai Semua Dapat ({group.totalQty} pcs)</span>
                    </button>
                  )}
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}