# 근태관리 시간 계산기

개인용 출퇴근 시간 기록 및 월간 근무시간 계산 도구

## 기능

- ✅ 일별 출퇴근 시간 기록
- ✅ 점심시간/제외시간 자동 계산
- ✅ 주간/월간 근무시간 집계
- ✅ 월 목표시간 대비 부족/초과 시간 표시
- ✅ 연차/반차 퀵버튼
- ✅ 공휴일/대체공휴일 자동 표시
- ✅ 데이터 내보내기/가져오기 (JSON)
- ✅ 입력 유효성 검사

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

브라우저에서 `http://localhost:3000` 접속

## GitHub Pages 배포 (선택)

### 1. package.json의 homepage 수정
```json
"homepage": "https://YOUR_USERNAME.github.io/work-hours-tracker"
```

### 2. 배포
```bash
npm run deploy
```

## 데이터 저장

- 데이터는 브라우저 localStorage에 저장됩니다
- 같은 브라우저에서는 새로고침해도 데이터 유지
- 다른 기기로 이동 시 JSON 내보내기/가져오기 사용

## 기술 스택

- React 18
- localStorage (데이터 저장)
- 순수 CSS (외부 라이브러리 없음)
