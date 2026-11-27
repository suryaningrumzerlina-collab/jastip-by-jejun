export default function AdminLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Memuat halaman"
      className="space-y-6 animate-pulse motion-reduce:animate-none"
    >
      {/* Skeleton Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded-full bg-[#F0E6D6]" />
          <div className="h-8 w-44 rounded-full bg-[#F0E6D6]" />
        </div>
        <div className="h-12 w-28 rounded-full bg-[#F0E6D6]" />
      </div>

      {/* Skeleton Search Bar */}
      <div className="h-12 w-full rounded-full bg-white border border-[#EBDCC7]/50" />

      {/* Skeleton List Cards */}
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#EBDCC7]/50 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 rounded-full bg-[#F0E6D6]" />
                <div className="h-5 w-48 rounded-full bg-[#F0E6D6]" />
                <div className="h-3.5 w-32 rounded-full bg-[#F0E6D6]/70" />
              </div>
              <div className="h-6 w-24 rounded-full bg-[#F0E6D6]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}