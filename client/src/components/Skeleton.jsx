export default function Skeleton({ index = 0 }) {
  return (
    <div
      className="relative bg-[#0b0d12] light:bg-white border border-[#1e2128] light:border-gray-200 rounded-lg overflow-hidden"
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-dim/50" />
      <div className="pl-4 pr-4 py-3.5 space-y-2.5">
        <div
          className="h-3.5 rounded"
          style={{
            width: `${50 + Math.random() * 40}%`,
            background: "linear-gradient(90deg, #1a1d24 0%, #22252d 50%, #1a1d24 100%)",
            backgroundSize: "400px 100%",
            animation: "shimmer 2s infinite",
          }}
        />
        <div className="flex gap-3">
          <div className="h-2.5 rounded w-14" style={{ background: "#1a1d24" }} />
          <div className="h-2.5 rounded w-16" style={{ background: "#1a1d24" }} />
          <div className="h-2.5 rounded w-10" style={{ background: "#1a1d24" }} />
        </div>
      </div>
    </div>
  );
}
