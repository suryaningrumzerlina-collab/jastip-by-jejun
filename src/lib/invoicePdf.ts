import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils'
import type { InvoiceWithRelations, PesananWithRelations } from '@/types/database'

export async function generateAndUploadInvoicePdf(
  invoice: InvoiceWithRelations,
  items: PesananWithRelations[]
): Promise<string> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const nama = invoice.pemesan?.nama_jastiper ?? 'Jastiper'

  // Header Brand
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(255, 107, 107) // Coral
  doc.text('Jastip by Jejun', 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(99, 110, 114)
  doc.text(`No. Invoice: ${invoice.nomor_invoice}`, 14, 27)
  if (invoice.jatuh_tempo) {
    doc.text(`Jatuh Tempo: ${invoice.jatuh_tempo}`, 14, 32)
  }

  // Status Pembayaran
  const statusLabel =
    invoice.status_pembayaran === 'lunas'
      ? 'LUNAS'
      : invoice.status_pembayaran === 'dp'
        ? 'DP MASUK'
        : 'BELUM LUNAS'
  doc.setFontSize(11)
  doc.setTextColor(45, 52, 54)
  doc.text(`Status: ${statusLabel}`, 196, 20, { align: 'right' })

  // Info Pemesan
  doc.setFontSize(10)
  doc.text(`Kepada: ${nama}`, 14, 42)
  doc.setFont('helvetica', 'normal')
  doc.text(`WA: +${invoice.pemesan?.no_wa ?? '-'}`, 14, 47)
  if (invoice.pemesan?.alamat) {
    const alamatLines = doc.splitTextToSize(`Alamat: ${invoice.pemesan.alamat}`, 120)
    doc.text(alamatLines, 14, 52)
  }

  // Tabel Item
  autoTable(doc, {
    startY: 64,
    head: [['Barang', 'Varian', 'Qty', 'Harga', 'Subtotal']],
    body: items.map((item) => [
      item.produk?.nama_barang ?? 'Produk',
      item.varian_dipilih ?? '-',
      String(item.qty),
      formatRupiah(item.harga_satuan),
      formatRupiah(item.harga_total),
    ]),
    headStyles: { fillColor: [255, 107, 107], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
  })

  // Ringkasan Total
  const finalY =
    ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 100) + 10
  const sisa =
    invoice.status_pembayaran === 'lunas'
      ? 0
      : Math.max(0, invoice.harga_total - invoice.nominal_dp)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Subtotal Barang: ${formatRupiah(invoice.harga_bundle)}`, 196, finalY, { align: 'right' })
  doc.text(`Fee Jastip: ${formatRupiah(invoice.total_fee ?? 0)}`, 196, finalY + 5, { align: 'right' })
  doc.text(
    `Ongkir (${invoice.jasa_pengiriman || 'Kurir'}): ${formatRupiah(invoice.ongkir)}`,
    196,
    finalY + 11,
    { align: 'right' }
  )

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(`Total Tagihan: ${formatRupiah(invoice.harga_total)}`, 196, finalY + 13, {
    align: 'right',
  })

  if (invoice.nominal_dp > 0) {
    doc.setFontSize(10)
    doc.setTextColor(78, 205, 196)
    doc.text(`DP Masuk: - ${formatRupiah(invoice.nominal_dp)}`, 196, finalY + 19, {
      align: 'right',
    })
  }

  doc.setFontSize(12)
  doc.setTextColor(255, 107, 107)
  doc.text(`Sisa Bayar: ${formatRupiah(sisa)}`, 196, finalY + 26, { align: 'right' })

  // Upload ke Supabase Storage
  const pdfBlob = doc.output('blob')
  const safeNama = nama.replace(/[^a-zA-Z0-9\s-_]/g, '').trim()
  const filePath = `${invoice.nomor_invoice} - ${safeNama}.pdf`

  const supabase = createClient()
  const { error } = await supabase.storage
    .from('invoices')
    .upload(filePath, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) throw error

  const { data: urlData } = supabase.storage.from('invoices').getPublicUrl(filePath)
  return urlData.publicUrl
}