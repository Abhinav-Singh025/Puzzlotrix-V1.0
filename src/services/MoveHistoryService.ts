import { MoveLogEntry, MoveActionType, MoveActionCategory, SessionAuditSummary, PuzzleType } from '../types';

export class MoveHistoryService {
  private static sequenceCounter = 0;
  private static lastActionTimestamp = Date.now();
  private static sessionStartTimestamp = Date.now();

  static resetSession() {
    this.sequenceCounter = 0;
    this.sessionStartTimestamp = Date.now();
    this.lastActionTimestamp = Date.now();
  }

  static createEntry(params: {
    puzzleType: PuzzleType;
    actionType: MoveActionType;
    category: MoveActionCategory;
    title: string;
    details: string;
    sessionTimer: number;
    coordinates?: {
      r?: number;
      c?: number;
      fromR?: number;
      fromC?: number;
      toR?: number;
      toC?: number;
    };
    prevVal?: any;
    newVal?: any;
    status?: 'success' | 'valid' | 'conflict' | 'error' | 'info';
    metadata?: Record<string, any>;
  }): MoveLogEntry {
    const now = Date.now();
    const timeDeltaMs = this.sequenceCounter === 0 ? 0 : Math.max(0, now - this.lastActionTimestamp);
    this.sequenceCounter += 1;
    this.lastActionTimestamp = now;

    return {
      id: `act_${now}_${this.sequenceCounter}_${Math.random().toString(36).substring(2, 7)}`,
      seq: this.sequenceCounter,
      timestamp: now,
      timeDeltaMs,
      sessionTimer: params.sessionTimer,
      puzzleType: params.puzzleType,
      actionType: params.actionType,
      category: params.category,
      title: params.title,
      details: params.details,
      coordinates: params.coordinates,
      prevVal: params.prevVal,
      newVal: params.newVal,
      status: params.status || 'info',
      metadata: params.metadata,
    };
  }

  static computeAuditSummary(entries: MoveLogEntry[], sessionTimer: number): SessionAuditSummary {
    const totalActions = entries.length;
    let playerMoves = 0;
    let solverActions = 0;
    let systemEvents = 0;
    let undoCount = 0;
    let conflictCount = 0;
    let totalThinkTimeMs = 0;
    let thinkTimeSamples = 0;

    for (const entry of entries) {
      if (entry.category === 'player') {
        playerMoves++;
        if (entry.timeDeltaMs > 0 && entry.timeDeltaMs < 120000) { // filter out extreme idle pauses > 2m
          totalThinkTimeMs += entry.timeDeltaMs;
          thinkTimeSamples++;
        }
      } else if (entry.category === 'solver') {
        solverActions++;
      } else {
        systemEvents++;
      }

      if (entry.actionType === 'undo') {
        undoCount++;
      }

      if (entry.status === 'conflict' || entry.status === 'error') {
        conflictCount++;
      }
    }

    const sessionDurationSec = Math.max(1, sessionTimer);
    const durationMinutes = sessionDurationSec / 60;
    const actionsPerMinute = durationMinutes > 0 ? parseFloat((playerMoves / durationMinutes).toFixed(1)) : 0;
    const avgThinkTimeMs = thinkTimeSamples > 0 ? Math.round(totalThinkTimeMs / thinkTimeSamples) : 0;

    const startedAt = entries.length > 0 ? entries[0].timestamp : Date.now();
    const lastActionAt = entries.length > 0 ? entries[entries.length - 1].timestamp : Date.now();

    return {
      totalActions,
      playerMoves,
      solverActions,
      systemEvents,
      undoCount,
      conflictCount,
      actionsPerMinute,
      avgThinkTimeMs,
      sessionDurationSec,
      startedAt,
      lastActionAt,
    };
  }

  static exportToJSON(entries: MoveLogEntry[], context?: Record<string, any>): string {
    const summary = this.computeAuditSummary(entries, context?.timer || 0);
    const payload = {
      app: 'Puzzlotrix Audit & Move History',
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      sessionContext: context || {},
      auditSummary: summary,
      actionLogs: entries.map(e => ({
        seq: e.seq,
        id: e.id,
        isoTimestamp: new Date(e.timestamp).toISOString(),
        timestampMs: e.timestamp,
        timeDeltaMs: e.timeDeltaMs,
        sessionTimerFormatted: this.formatTime(e.sessionTimer),
        puzzleType: e.puzzleType,
        actionType: e.actionType,
        category: e.category,
        title: e.title,
        details: e.details,
        coordinates: e.coordinates || null,
        prevVal: e.prevVal !== undefined ? e.prevVal : null,
        newVal: e.newVal !== undefined ? e.newVal : null,
        status: e.status,
        metadata: e.metadata || null,
      })),
    };
    return JSON.stringify(payload, null, 2);
  }

  static exportToCSV(entries: MoveLogEntry[]): string {
    const headers = [
      'Sequence',
      'Timestamp (ISO)',
      'Session Time',
      'Time Delta (ms)',
      'Category',
      'Action Type',
      'Puzzle Type',
      'Title',
      'Details',
      'Coordinates',
      'Previous Value',
      'New Value',
      'Status'
    ];

    const rows = entries.map(e => {
      const coordStr = e.coordinates
        ? (e.coordinates.fromR !== undefined && e.coordinates.fromC !== undefined && e.coordinates.toR !== undefined && e.coordinates.toC !== undefined
            ? `from(${e.coordinates.fromR},${e.coordinates.fromC})->to(${e.coordinates.toR},${e.coordinates.toC})` 
            : `(${e.coordinates.r ?? '-'},${e.coordinates.c ?? '-'})`)
        : '';

      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      return [
        e.seq,
        new Date(e.timestamp).toISOString(),
        this.formatTime(e.sessionTimer),
        e.timeDeltaMs,
        e.category,
        e.actionType,
        e.puzzleType,
        escapeCSV(e.title),
        escapeCSV(e.details),
        escapeCSV(coordStr),
        escapeCSV(e.prevVal ?? ''),
        escapeCSV(e.newVal ?? ''),
        e.status || 'info',
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  static generateAuditMarkdown(entries: MoveLogEntry[], summary: SessionAuditSummary, context?: Record<string, any>): string {
    const dateStr = new Date().toLocaleString();
    let md = `# PUZZLOTRIX SESSION AUDIT REPORT\n`;
    md += `Generated: ${dateStr}\n`;
    md += `Puzzle: ${context?.puzzleType || 'Unknown'} (${context?.gridSize || ''}x${context?.gridSize || ''}, Difficulty: ${context?.difficulty || 'N/A'})\n\n`;

    md += `## 📊 Audit & Session Metrics\n`;
    md += `- **Total Actions Recorded**: ${summary.totalActions}\n`;
    md += `- **Player Moves**: ${summary.playerMoves}\n`;
    md += `- **AI Solver Actions**: ${summary.solverActions}\n`;
    md += `- **System Events**: ${summary.systemEvents}\n`;
    md += `- **Actions Per Minute (APM)**: ${summary.actionsPerMinute}\n`;
    md += `- **Average Decision Interval**: ${(summary.avgThinkTimeMs / 1000).toFixed(2)}s\n`;
    md += `- **Undos Used**: ${summary.undoCount}\n`;
    md += `- **Conflicts / Errors**: ${summary.conflictCount}\n`;
    md += `- **Active Session Duration**: ${this.formatTime(summary.sessionDurationSec)}\n\n`;

    md += `## 📜 Action Timeline (Latest ${Math.min(50, entries.length)} of ${entries.length})\n\n`;
    md += `| # | Time | Category | Action | Target / Coords | Status | Details |\n`;
    md += `|---|------|----------|--------|-----------------|--------|---------|\n`;

    const recent = entries.slice(-50);
    for (const e of recent) {
      const coordStr = e.coordinates
        ? (e.coordinates.fromR !== undefined && e.coordinates.fromC !== undefined && e.coordinates.toR !== undefined && e.coordinates.toC !== undefined
            ? `[${e.coordinates.fromR + 1},${e.coordinates.fromC + 1}]➔[${e.coordinates.toR + 1},${e.coordinates.toC + 1}]` 
            : `[R${(e.coordinates.r ?? 0) + 1}, C${(e.coordinates.c ?? 0) + 1}]`)
        : '-';
      md += `| ${e.seq} | +${(e.timeDeltaMs / 1000).toFixed(1)}s | ${e.category} | ${e.title} | ${coordStr} | ${e.status || 'info'} | ${e.details} |\n`;
    }

    return md;
  }

  static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
