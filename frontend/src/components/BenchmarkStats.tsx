import type { BenchmarkStats as Stats } from '../types';

interface BenchmarkStatsProps {
  stats: Stats | null;
}

export default function BenchmarkStats({ stats }: BenchmarkStatsProps) {
  if (!stats) return null;

  return (
    <div className="bg-white p-5 rounded-sm shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#E0E0E0]">
      <h3 className="text-base font-semibold mb-4 text-[#1A1A1A] border-b border-[#E0E0E0] pb-2" style={{ fontFamily: "'Lora', Georgia, serif" }}>
        Algorithm Performance
      </h3>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-[#666666]" style={{ fontFamily: "'Lora', Georgia, serif" }}>Algorithm:</span>
          <span className="ml-2 font-medium text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>{stats.algorithm}</span>
        </div>
        <div>
          <span className="text-[#666666]" style={{ fontFamily: "'Lora', Georgia, serif" }}>Time:</span>
          <span className="ml-2 font-medium text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            {stats.completion_time.toFixed(3)}s
          </span>
        </div>
        <div>
          <span className="text-[#666666]" style={{ fontFamily: "'Lora', Georgia, serif" }}>Checks:</span>
          <span className="ml-2 font-medium text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            {stats.constraint_checks.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-[#666666]" style={{ fontFamily: "'Lora', Georgia, serif" }}>Assignments:</span>
          <span className="ml-2 font-medium text-[#1A1A1A]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            {stats.assignments.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
