'use client'

import { useMemo } from 'react'
import { InvoiceClient } from '@/components/invoice/InvoiceClient'
import { useActiveBatch } from '@/components/providers/ActiveBatchProvider'
import { useInvoices, usePemesan, usePesanan } from '@/hooks/useJastipData'
import AdminLoading from '../loading'

export default function InvoicePage() {
  const { activeBatchId } = useActiveBatch()
  const { data: invoices, isLoading: l1 } = useInvoices()
  const { data: pesanan, isLoading: l2 } = usePesanan()
  const { data: pemesan, isLoading: l3 } = usePemesan()

  const filteredInvoices = useMemo(
    () =>
      (invoices ?? []).filter(
        (inv) => activeBatchId === 'semua' || inv.id_batch === activeBatchId
      ),
    [invoices, activeBatchId]
  )

  const unbilled = useMemo(
    () =>
      (pesanan ?? []).filter(
        (p) =>
          p.status_jastip === 'terkonfirmasi' &&
          p.id_pengiriman === null &&
          (activeBatchId === 'semua' || p.id_batch === activeBatchId)
      ),
    [pesanan, activeBatchId]
  )

  if ((l1 && !invoices) || (l2 && !pesanan) || (l3 && !pemesan)) {
    return <AdminLoading />
  }

  return (
    <InvoiceClient
      key={activeBatchId}
      initialInvoices={filteredInvoices}
      initialUnbilled={unbilled}
      pemesanList={pemesan ?? []}
    />
  )
}