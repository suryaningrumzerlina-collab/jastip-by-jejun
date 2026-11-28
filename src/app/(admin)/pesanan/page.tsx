'use client'

import { useMemo } from 'react'
import { PesananClient } from '@/components/pesanan/PesananClient'
import { useActiveBatch } from '@/components/providers/ActiveBatchProvider'
import { useBatch, usePemesan, usePesanan, useProduk } from '@/hooks/useJastipData'
import AdminLoading from '../loading'

export default function PesananPage() {
  const { activeBatchId } = useActiveBatch()
  const { data: pesanan, isLoading: l1 } = usePesanan()
  const { data: batch, isLoading: l2 } = useBatch()
  const { data: pemesan, isLoading: l3 } = usePemesan()
  const { data: produk, isLoading: l4 } = useProduk()

  const filteredPesanan = useMemo(
    () =>
      (pesanan ?? []).filter(
        (p) => activeBatchId === 'semua' || p.id_batch === activeBatchId
      ),
    [pesanan, activeBatchId]
  )

  if ((l1 && !pesanan) || (l2 && !batch) || (l3 && !pemesan) || (l4 && !produk)) {
    return <AdminLoading />
  }

  return (
    <PesananClient
      key={activeBatchId}
      initialPesanan={filteredPesanan}
      batchList={batch ?? []}
      pemesanList={pemesan ?? []}
      produkList={produk ?? []}
    />
  )
}