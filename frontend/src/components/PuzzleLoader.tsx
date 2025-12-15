/**
 * PuzzleLoader Component
 * Shows loading state and indicates if puzzle came from cache or was generated
 */

interface PuzzleLoaderProps {
  loading: boolean;
  usageCount: number; // 1-3 = cache, 4+ = generated
  error: string | null;
}

export default function PuzzleLoader({ loading, usageCount, error }: PuzzleLoaderProps) {
  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-[#666666]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
          {usageCount <= 3 ? 'Loading daily puzzle...' : 'Generating puzzle...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-600" style={{ fontFamily: "'Lora', Georgia, serif" }}>
          Error: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-2">
      {usageCount <= 3 ? (
        <p className="text-xs text-green-600" style={{ fontFamily: "'Lora', Georgia, serif" }}>
          ✓ Daily puzzle loaded instantly
        </p>
      ) : (
        <p className="text-xs text-blue-600" style={{ fontFamily: "'Lora', Georgia, serif" }}>
          ⚡ Freshly generated puzzle
        </p>
      )}
    </div>
  );
}

