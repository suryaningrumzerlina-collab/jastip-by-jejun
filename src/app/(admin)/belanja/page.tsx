'use client'

import { useMemo } from 'react'
import { BelanjaClient } from '@/components/belanja/BelanjaClient'
import { useBatch, usePesanan } from '@/hooks/useJastipData'
import AdminLoading from '../loading'

export default function BelanjaPage() {
  const { data: pesanan, isLoading: l1 } = usePesanan()
  const { data: batch, isLoading: l2 } = useBatch()

  const belumBeli = useMemo(
    () => (pesanan ?? []).filter((p) => p.status_jastip === 'tercatat'),
    [pesanan]
  )

  if ((l1 && !pesanan) || (l2 && !batch)) {
    return <AdminLoading />
  }

  return <BelanjaClient initialPesanan={belumBeli} batchList={batch ?? []} />
}