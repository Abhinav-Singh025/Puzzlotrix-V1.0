export interface LeaderboardEntry {
  puzzleType: string;
  gridSize: number;
  seed: string;
  username: string;
  solveTime: number;
  moves: number;
  timestamp: number;
}

export class Leaderboard {
  private static getKey(puzzleType: string, gridSize: number): string {
    return `leaderboard_${puzzleType}_${gridSize}`;
  }

  static submit(entry: LeaderboardEntry): void {
    const key = this.getKey(entry.puzzleType, entry.gridSize);
    const existing = this.get(entry.puzzleType, entry.gridSize);
    existing.push(entry);
    existing.sort((a, b) => a.solveTime - b.solveTime);
    const top10 = existing.slice(0, 10);
    localStorage.setItem(key, JSON.stringify(top10));
  }

  static get(puzzleType: string, gridSize: number): LeaderboardEntry[] {
    const key = this.getKey(puzzleType, gridSize);
    const data = localStorage.getItem(key);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
}
