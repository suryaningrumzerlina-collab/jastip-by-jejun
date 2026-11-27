import { AdminNav } from '@/components/layout/AdminNav'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* Atmospheric Blobs (-z-10) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-20 -left-20 w-64 h-64 rounded-full bg-[#FF6B6B] opacity-10 blur-[80px] -z-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/3 -right-24 w-64 h-64 rounded-full bg-[#4ECDC4] opacity-10 blur-[80px] -z-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-24 left-1/4 w-64 h-64 rounded-full bg-[#FFE66D] opacity-15 blur-[80px] -z-10"
      />

      <AdminNav />

      {/* Konten utama dengan safe-zone bawah 128px untuk Floating Tab Bar */}
      <main className="max-w-2xl mx-auto px-6 pt-2 pb-32">
        {children}
      </main>
    </div>
  )
}