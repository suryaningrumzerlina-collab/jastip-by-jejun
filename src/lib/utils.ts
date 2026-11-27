export function formatRupiah(angka: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka)
}

export function formatTanggalSingkat(isoDate: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate))
}

export function buildWaLink(noWa: string, pesan: string): string {
  const cleanNumber = noWa.replace(/\D/g, '')
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(pesan)}`
}