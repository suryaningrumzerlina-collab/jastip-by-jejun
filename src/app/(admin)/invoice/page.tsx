'use client'

import { useMemo } from 'react'
import { InvoiceClient } from '@/components/invoice/InvoiceClient'
import { useInvoices, usePemesan, usePesanan } from '@/hooks/useJastipData'
import AdminLoading from '../loading'

export default function InvoicePage() {
  const { data: invoices, isLoading: l1 } = useInvoices()
  const { data: pesanan, isLoading: l2 } = usePesanan()
  const { data: pemesan, isLoading: l3 } = usePemesan()

  const unbilled = useMemo(
    () =>
      (pesanan ?? []).filter(
        (p) => p.status_jastip === 'terkonfirmasi' && p.id_pengiriman === null
      ),
    [pesanan]
  )

  if ((l1 && !invoices) || (l2 && !pesanan) || (l3 && !pemesan)) {
    return <AdminLoading />
  }

  return (
    <InvoiceClient
      initialInvoices={invoices ?? []}
      initialUnbilled={unbilled}
      pemesanList={pemesan ?? []}
    />
  )
}