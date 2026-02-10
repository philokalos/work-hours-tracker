# CLAUDE.md - Work Hours Tracker

근태관리 시간 계산기 | React 18 (CRA) + localStorage + GitHub Pages

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
    startTime: '08:10', // HH:MM format
    endTime: '16:38',
    lunchTime: 90, // Minutes (default 90)
    excludeTime: 0, // Additional exclusion in minutes
    memo: '', // 연차, 반차, etc.
  },
};

// Monthly targets in hours
monthlyTargets = { '2026-01': 150 };
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

## Anti-Patterns

| Wrong                  | Correct                               |
| ---------------------- | ------------------------------------- |
| localStorage 직접 접근 | `useState` + useEffect 동기화         |
| 시간 문자열 비교       | `timeToMinutes()` 변환 후 비교        |
| 공휴일 동적 로딩       | `holidays2026` 하드코딩 (연도별 관리) |
| 컴포넌트 분리 과도     | 단일 컴포넌트 유지 (현재 구조)        |

---

## Verified Vibe Coding Protocol

이 프로젝트는 VVCS(Verified Vibe Coding System)를 따릅니다.

### 필수 워크플로우

**1. 새 기능 개발**

```
/speckit.specify "기능 설명"
  ↓
/speckit.plan
  ↓
/speckit.implement
  ↓
npm start로 확인
  ↓
/commit-push-pr
```

**2. 버그 수정**

```
"think hard" 포함하여 문제 분석
  ↓
수정 계획 확인
  ↓
수정 구현
  ↓
npm start로 확인
```

### Think Mode 가이드

| 작업 복잡도    | Think Mode     | 예시                             |
| -------------- | -------------- | -------------------------------- |
| 단순 수정      | (기본)         | UI 텍스트/스타일 변경            |
| 다중 로직 변경 | `think hard`   | 계산 로직 수정, 데이터 구조 변경 |
| 아키텍처 변경  | `think harder` | 컴포넌트 분리, 상태 관리 변경    |

### Definition of Done (Work Hours Tracker)

**필수 체크리스트**:

- [ ] `npm start`로 정상 동작 확인
- [ ] `npm run build` 에러 없음
- [ ] localStorage 데이터 호환성 유지
- [ ] 시간 계산 정확성 검증

### 자동 검증

VVCS Hooks가 자동으로:

- Plan-First 워크플로우 권장
- Think 모드 사용 권장
- 코드 품질 실시간 검증

### 일간 모니터링

```bash
python3 ~/.claude/scripts/analyze-conversations.py
```

**목표 지표**:

- Fix 커밋 비율: < 15%
- Think 사용률: > 5%
- Plan-First 비율: > 50%
