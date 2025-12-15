export interface ShareData {
  puzzleNumber: number;
  date: string;
  difficulty: string;
  size: string;
  completionTime: string;
  streak?: number;
  // gridStatus dimensions must match the puzzle size (e.g., 4x4, 6x6)
  // true = incorrect/missing (🟥), false = correct/filled (🟩)
  gridStatus: boolean[][];
}

export function generateShareText(data: ShareData): string {
  const {
    puzzleNumber,
    date,
    difficulty,
    size,
    completionTime,
    streak,
    gridStatus,
  } = data;

  const gridLines = gridStatus
    .map((row) => row.map((cell) => (cell ? '🟥' : '🟩')).join(''))
    .join('\n');

  const header = `🎯 Puzzalo #${puzzleNumber} - ${date}`;
  const meta = `✅ ${size} ${difficulty}`;
  const timeLine = `⏱️ ${completionTime}`;
  const streakLine = typeof streak === 'number' && streak > 0 ? `🔥 ${streak}-day streak` : '';
  const cta = 'Play today\'s puzzle: https://puzzalo.com';

  return [header, gridLines, meta, timeLine, streakLine, '', cta]
    .filter((line) => line !== '')
    .join('\n');
}

/**
 * Attempt to use the Web Share API. If it's not available, throw so the caller
 * can handle a custom fallback UI (e.g., copy/share modal).
 */
export async function handleShare(shareData: ShareData): Promise<void> {
  const text = generateShareText(shareData);

  if (typeof navigator !== 'undefined' && (navigator as any).share) {
    await (navigator as any).share({
      title: 'Puzzalo Games',
      text,
      url: 'https://puzzalo.com',
    });
    return;
  }

  // If Web Share API is not available, signal to the caller to use a fallback
  throw new Error('web-share-not-supported');
}


