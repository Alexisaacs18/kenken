import React from 'react';
import type { BenchmarkStats as Stats } from '../types';

interface BenchmarkStatsProps {
  stats: Stats | null;
}

export default function BenchmarkStats({ stats }: BenchmarkStatsProps) {
  if (!stats) return null;

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-3">Algorithm Performance</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Algorithm:</span>
          <span className="ml-2 font-semibold">{stats.algorithm}</span>
        </div>
        <div>
          <span className="text-gray-600">Time:</span>
          <span className="ml-2 font-semibold">
            {stats.completion_time.toFixed(3)}s
          </span>
        </div>
        <div>
          <span className="text-gray-600">Constraint Checks:</span>
          <span className="ml-2 font-semibold">
            {stats.constraint_checks.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-gray-600">Assignments:</span>
          <span className="ml-2 font-semibold">
            {stats.assignments.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
