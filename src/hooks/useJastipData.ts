'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type {
  Batch,
  InvoiceWithRelations,
  Pemesan,
  PesananWithRelations,
  Produk,
} from '@/types/database'

const supabase = createClient()

export function usePesanan() {
  return useSWR<PesananWithRelations[]>('pesanan', async () => {
    const { data, error } = await supabase
      .from('pesanan')
      .select(`
        *,
        pemesan:id_pemesan ( id, nama_jastiper, no_wa ),
        produk:id_produk ( id, nama_barang, brand ),
        batch:id_batch ( id, nama_batch )
      `)
      .order('order_time', { ascending: false })

    if (error) throw error
    return (data ?? []) as unknown as PesananWithRelations[]
  })
}

export function useInvoices() {
  return useSWR<InvoiceWithRelations[]>('invoices', async () => {
    const { data, error } = await supabase
      .from('invoice_pengiriman')
      .select(`
        *,
        pemesan:id_pemesan ( id, nama_jastiper, no_wa, alamat )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as unknown as InvoiceWithRelations[]
  })
}

export function useBatch() {
  return useSWR<Batch[]>('batch', async () => {
    const { data, error } = await supabase
      .from('batch')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Batch[]
  })
}

export function usePemesan() {
  return useSWR<Pemesan[]>('pemesan', async () => {
    const { data, error } = await supabase
      .from('pemesan')
      .select('*')
      .order('nama_jastiper', { ascending: true })

    if (error) throw error
    return (data ?? []) as Pemesan[]
  })
}

export function useProduk() {
  return useSWR<Produk[]>('produk', async () => {
    const { data, error } = await supabase
      .from('produk')
      .select('*')
      .order('nama_barang', { ascending: true })

    if (error) throw error
    return (data ?? []) as Produk[]
  })
}