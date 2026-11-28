import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buildWaLink, formatRupiah } from '@/lib/utils'
import { InvoicePrintActions } from '@/components/invoice/InvoicePrintActions'
import type { InvoiceWithRelations, PesananWithRelations } from '@/types/database'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('invoice_pengiriman')
    .select('nomor_invoice, pemesan:id_pemesan ( nama_jastiper )')
    .eq('id', id)
    .maybeSingle()

  if (!data) return { title: 'Invoice — Jastip by Jejun' }

  const pemesan = Array.isArray(data.pemesan) ? data.pemesan[0] : data.pemesan
  const nama = pemesan?.nama_jastiper ?? 'Jastiper'
  // Format nama file: INV-202611-001 - Ani Wijaya.pdf
  return {
    title: `${data.nomor_invoice} - ${nama}`,
  }
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [invRes, itemsRes] = await Promise.all([
    supabase
      .from('invoice_pengiriman')
      .select(`
        *,
        pemesan:id_pemesan ( id, nama_jastiper, no_wa, alamat )
      `)
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('pesanan')
      .select(`
        *,
        produk:id_produk ( id, nama_barang, brand )
      `)
      .eq('id_pengiriman', id)
      .order('order_time', { ascending: true }),
  ])

  if (!invRes.data) notFound()

  const invoice = invRes.data as unknown as InvoiceWithRelations
  const items = (itemsRes.data ?? []) as unknown as PesananWithRelations[]

  const sisaTagihan =
    invoice.status_pembayaran === 'lunas'
      ? 0
      : Math.max(0, invoice.harga_total - invoice.nominal_dp)

  const waMessage = [
    `Halo Kak ${invoice.pemesan?.nama_jastiper ?? ''}, berikut detail invoice Jastip by Jejun:`,
    `No: ${invoice.nomor_invoice}`,
    `Total: ${formatRupiah(invoice.harga_total)}`,
    invoice.status_pembayaran === 'lunas'
      ? `Status: LUNAS`
      : `Sisa Tagihan: ${formatRupiah(sisaTagihan)}`,
    invoice.resi ? `Resi (${invoice.jasa_pengiriman ?? 'Kurir'}): ${invoice.resi}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const waUrl = invoice.pemesan?.no_wa
    ? buildWaLink(invoice.pemesan.no_wa, waMessage)
    : null

  return (
    <div>
      <InvoicePrintActions invoice={invoice} items={items} />

      {/* Kertas Invoice Siap Cetak */}
      <article className="bg-white rounded-[2rem] print:rounded-none p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] print:shadow-none border border-[#EBDCC7]/60 print:border-0 space-y-6">
        {/* Header Brand & Nomor Invoice */}
        <header className="flex items-start justify-between gap-4 pb-5 border-b-2 border-[#FAF5EB]">
          <div>
            <span className="inline-block bg-[#FF6B6B] text-white font-black text-[10px] uppercase tracking-[0.12em] px-3 py-1 rounded-full mb-2">
              Invoice Resmi
            </span>
            <h1 className="font-black text-2xl text-[#2D3436]">Jastip by Jejun</h1>
            <p className="text-xs font-bold text-[#636E72] mt-0.5">
              Nomor: {invoice.nomor_invoice}
            </p>
          </div>

          <div className="text-right">
            <span
              className={`inline-block font-black text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full ${
                invoice.status_pembayaran === 'lunas'
                  ? 'bg-[#4ECDC4] text-white'
                  : invoice.status_pembayaran === 'dp'
                    ? 'bg-[#FFE66D] text-[#2D3436]'
                    : 'bg-[#FF6B6B] text-white'
              }`}
            >
              {invoice.status_pembayaran === 'lunas'
                ? 'LUNAS'
                : invoice.status_pembayaran === 'dp'
                  ? 'DP MASUK'
                  : 'BELUM LUNAS'}
            </span>
            {invoice.jatuh_tempo && (
              <p className="text-xs font-bold text-[#636E72] mt-2">
                Jatuh Tempo: {invoice.jatuh_tempo}
              </p>
            )}
          </div>
        </header>

        {/* Info Pemesan & Pengiriman */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF5EB]/70 rounded-2xl p-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#636E72]">
              Ditagihkan Kepada
            </p>
            <p className="font-black text-base text-[#2D3436] mt-1">
              {invoice.pemesan?.nama_jastiper ?? '-'}
            </p>
            <p className="text-xs font-bold text-[#636E72]">
              +{invoice.pemesan?.no_wa ?? '-'}
            </p>
            {invoice.pemesan?.alamat && (
              <p className="text-xs font-bold text-[#636E72] mt-1 leading-relaxed">
                {invoice.pemesan.alamat}
              </p>
            )}
          </div>

          <div className="sm:text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#636E72]">
              Pengiriman
            </p>
            <p className="font-black text-sm text-[#2D3436] mt-1">
              {invoice.jasa_pengiriman || 'Belum ditentukan'}
            </p>
            {invoice.resi && (
              <p className="text-xs font-bold text-[#4ECDC4] mt-0.5">
                Resi: {invoice.resi}
              </p>
            )}
          </div>
        </section>

        {/* Tabel Rincian Barang */}
        <section className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EBDCC7] text-[11px] font-black uppercase tracking-[0.1em] text-[#636E72]">
                <th className="py-2.5 pr-3">Barang</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-2 text-right">Harga</th>
                <th className="py-2.5 pl-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FAF5EB] text-sm font-bold text-[#2D3436]">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 pr-3">
                    <p className="font-black">{item.produk?.nama_barang ?? 'Produk'}</p>
                    {item.varian_dipilih && (
                      <p className="text-xs text-[#636E72]">{item.varian_dipilih}</p>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">{item.qty}</td>
                  <td className="py-3 px-2 text-right">{formatRupiah(item.harga_satuan)}</td>
                  <td className="py-3 pl-2 text-right font-black">
                    {formatRupiah(item.harga_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Ringkasan Biaya */}
        <section className="border-t-2 border-[#FAF5EB] pt-4 space-y-2 text-sm font-bold">
          <div className="flex justify-between text-[#636E72]">
            <span>Subtotal Barang</span>
            <span>{formatRupiah(invoice.harga_bundle)}</span>
          </div>
          {invoice.total_fee > 0 && (
          <div className="flex justify-between text-[#4ECDC4]">
            <span>Biaya Jasa (Fee Jastip)</span>
            <span>{formatRupiah(invoice.total_fee)}</span>
          </div>
          )}
          <div className="flex justify-between text-[#636E72]">
            <span>Ongkir ({invoice.jasa_pengiriman || 'Kurir'})</span>
            <span>{formatRupiah(invoice.ongkir)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-[#2D3436] pt-2 border-t border-[#EBDCC7]">
            <span>Total Tagihan</span>
            <span>{formatRupiah(invoice.harga_total)}</span>
          </div>

          {invoice.nominal_dp > 0 && (
            <div className="flex justify-between text-[#4ECDC4]">
              <span>DP Diterima</span>
              <span>- {formatRupiah(invoice.nominal_dp)}</span>
            </div>
          )}

          <div className="flex justify-between items-center bg-[#FAF5EB] rounded-2xl px-4 py-3 mt-2">
            <span className="text-xs font-black uppercase tracking-[0.1em] text-[#2D3436]">
              Sisa Yang Harus Dibayar
            </span>
            <span className="font-black text-xl text-[#FF6B6B]">
              {formatRupiah(sisaTagihan)}
            </span>
          </div>
        </section>

        <footer className="text-center pt-4 text-xs font-bold text-[#636E72]">
          Terima kasih sudah berbelanja di Jastip by Jejun!
        </footer>
      </article>
    </div>
  )
}