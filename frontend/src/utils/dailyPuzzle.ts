/**
 * Puzzle of the Day utilities
 * Maps day of week to difficulty and generates date-based seeds
 */

export interface DailyPuzzleInfo {
  dayOfWeek: string;
  difficulty: string;
  size: number;
  date: string; // YYYY-MM-DD format
  seed: string; // Date string used as seed
}

/**
 * Get today's puzzle information
 */
export function getTodayPuzzleInfo(): DailyPuzzleInfo {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Map day of week to difficulty
  const dayMapping: { [key: number]: { difficulty: string; size: number } } = {
    1: { difficulty: 'Beginner', size: 3 },   // Monday
    2: { difficulty: 'Easy', size: 4 },       // Tuesday
    3: { difficulty: 'Medium', size: 5 },     // Wednesday
    4: { difficulty: 'Intermediate', size: 6 }, // Thursday
    5: { difficulty: 'Challenging', size: 7 }, // Friday
    6: { difficulty: 'Hard', size: 8 },       // Saturday
    0: { difficulty: 'Expert', size: 9 },    // Sunday
  };
  
  const { difficulty, size } = dayMapping[dayOfWeek];
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return {
    dayOfWeek: dayNames[dayOfWeek],
    difficulty,
    size,
    date: dateString,
    seed: dateString,
  };
}

/**
 * Get tomorrow's puzzle info (for "come back tomorrow" message)
 */
export function getTomorrowPuzzleInfo(): DailyPuzzleInfo {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  
  const dayOfWeek = tomorrow.getDay();
  
  const dayMapping: { [key: number]: { difficulty: string; size: number } } = {
    1: { difficulty: 'Beginner', size: 3 },
    2: { difficulty: 'Easy', size: 4 },
    3: { difficulty: 'Medium', size: 5 },
    4: { difficulty: 'Intermediate', size: 6 },
    5: { difficulty: 'Challenging', size: 7 },
    6: { difficulty: 'Hard', size: 8 },
    0: { difficulty: 'Expert', size: 9 },
  };
  
  const { difficulty, size } = dayMapping[dayOfWeek];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return {
    dayOfWeek: dayNames[dayOfWeek],
    difficulty,
    size,
    date: dateString,
    seed: dateString,
  };
}

/**
 * Format date for display (e.g., "December 15, 2024")
 */
export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Check if puzzle is completed today (using localStorage)
 */
export function isPuzzleCompletedToday(): boolean {
  const today = getTodayPuzzleInfo();
  const completedDate = localStorage.getItem('kenken_completed_date');
  return completedDate === today.date;
}

/**
 * Mark today's puzzle as completed
 */
export function markPuzzleCompletedToday(): void {
  const today = getTodayPuzzleInfo();
  localStorage.setItem('kenken_completed_date', today.date);
}
