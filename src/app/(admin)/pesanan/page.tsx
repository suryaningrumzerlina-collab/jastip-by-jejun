'use client'

import { PesananClient } from '@/components/pesanan/PesananClient'
import { useBatch, usePemesan, usePesanan, useProduk } from '@/hooks/useJastipData'
import AdminLoading from '../loading'

export default function PesananPage() {
  const { data: pesanan, isLoading: l1 } = usePesanan()
  const { data: batch, isLoading: l2 } = useBatch()
  const { data: pemesan, isLoading: l3 } = usePemesan()
  const { data: produk, isLoading: l4 } = useProduk()

  if ((l1 && !pesanan) || (l2 && !batch) || (l3 && !pemesan) || (l4 && !produk)) {
    return <AdminLoading />
  }

  return (
    <PesananClient
      initialPesanan={pesanan ?? []}
      batchList={batch ?? []}
      pemesanList={pemesan ?? []}
      produkList={produk ?? []}
    />
  )
}