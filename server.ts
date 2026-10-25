import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LEADERBOARD_FILE = path.join(__dirname, "leaderboard.json");

interface LeaderboardEntry {
  id: number;
  username: string;
  puzzle_type: string;
  grid_size: number;
  time_ms: number;
  moves?: number;
  seed?: number;
  created_at: string;
}

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const data = await fs.readFile(LEADERBOARD_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

async function saveLeaderboard(data: LeaderboardEntry[]) {
  await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/leaderboard", async (req, res) => {
    const { type, size, limit } = req.query;
    const maxLimit = limit ? Math.min(100, parseInt(limit as string)) : 10;
    
    try {
      let leaderboard = await getLeaderboard();
      
      if (type && size) {
        leaderboard = leaderboard
          .filter(e => e.puzzle_type === type && e.grid_size === parseInt(size as string))
          .sort((a, b) => a.time_ms - b.time_ms)
          .slice(0, maxLimit);
      } else {
        leaderboard = leaderboard
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 100);
      }
      
      res.json(leaderboard);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  app.post("/api/leaderboard", async (req, res) => {
    const { username, puzzle_type, grid_size, time_ms, moves, seed } = req.body;
    
    if (!username || !puzzle_type || grid_size === undefined || time_ms === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const leaderboard = await getLeaderboard();
      const parsedTime = Math.max(100, parseInt(String(time_ms)) || 100);
      const parsedSize = parseInt(String(grid_size)) || 4;
      const parsedMoves = moves !== undefined ? parseInt(String(moves)) : 0;
      const parsedSeed = seed !== undefined ? parseInt(String(seed)) : undefined;

      const newEntry: LeaderboardEntry = {
        id: Date.now(),
        username: String(username).trim().slice(0, 30) || "Anonymous",
        puzzle_type: String(puzzle_type),
        grid_size: parsedSize,
        time_ms: parsedTime,
        moves: parsedMoves,
        seed: parsedSeed,
        created_at: new Date().toISOString()
      };
      
      leaderboard.push(newEntry);
      await saveLeaderboard(leaderboard);
      
      res.json({ id: newEntry.id, success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save score" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
