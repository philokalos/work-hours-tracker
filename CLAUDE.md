# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm start            # Development server at http://localhost:3000
npm run build        # Production build
npm run deploy       # Deploy to GitHub Pages (runs build first)
```

## Architecture

Single-component React 18 app (CRA-based) for personal work hours tracking.

### Core Component: `WorkHoursTracker.jsx`

All logic resides in a single 750-line component that handles:

- **State Management**: Uses `useState` with localStorage persistence for records and monthly targets
- **Time Calculations**: `timeToMinutes()` / `minutesToTimeStr()` convert between time formats
- **Work Hours Formula**: `endTime - startTime - lunchTime (90min) - excludeTime`
- **Monthly Statistics**: Calculates totals, remaining hours, and daily averages in `calculateMonthlyStats()`

### Data Structure

```javascript
// Records keyed by ISO date string
records = {
  '2026-01-05': {
    startTime: '08:10',     // HH:MM format
    endTime: '16:38',
    lunchTime: 90,          // Minutes (default 90)
    excludeTime: 0,         // Additional exclusion in minutes
    memo: ''                // 연차, 반차, etc.
  }
}

// Monthly targets in hours
monthlyTargets = { '2026-01': 150 }
```

### Key Features

- **Quick Input Buttons**: `setAnnualLeave()` (연차/8h), `setHalfLeave()` (반차/4h), `setDefaultWork()` (기본근무)
- **Holiday Data**: 2026 Korean holidays hardcoded in `holidays2026` object
- **Validation**: `validateRecord()` checks for logical errors (end < start, >12h work)
- **Import/Export**: JSON-based data backup via `exportData()` / `importData()`

## Korean-Specific Context

- UI is entirely in Korean
- Lunch break default: 1시간 30분 (90 minutes)
- Holiday names include 대체공휴일 (substitute holidays)
- Memo values: 연차 (annual leave), 오전반차/오후반차 (half-day leave)
