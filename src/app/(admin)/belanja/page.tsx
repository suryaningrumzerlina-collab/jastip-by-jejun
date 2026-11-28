'use client'

import { useMemo } from 'react'
import { BelanjaClient } from '@/components/belanja/BelanjaClient'
import { useActiveBatch } from '@/components/providers/ActiveBatchProvider'
import { useBatch, usePesanan } from '@/hooks/useJastipData'
import AdminLoading from '../loading'

export default function BelanjaPage() {
  const { activeBatchId } = useActiveBatch()
  const { data: pesanan, isLoading: l1 } = usePesanan()
  const { data: batch, isLoading: l2 } = useBatch()

  const belumBeli = useMemo(
    () =>
      (pesanan ?? []).filter(
        (p) =>
          p.status_jastip === 'tercatat' &&
          (activeBatchId === 'semua' || p.id_batch === activeBatchId)
      ),
    [pesanan, activeBatchId]
  )

  if ((l1 && !pesanan) || (l2 && !batch)) {
    return <AdminLoading />
  }

  return (
    <BelanjaClient
      key={activeBatchId}
      initialPesanan={belumBeli}
      batchList={batch ?? []}
    />
  )
}