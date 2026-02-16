import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';

const TimeInput = ({ value, onChange }) => {
  const [displayValue, setDisplayValue] = useState(value || '');

  useEffect(() => {
    setDisplayValue(value || '');
  }, [value]);

  const formatTimeStr = (raw) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + ':' + digits.slice(2, 4);
  };

  const isValidTime = (str) => {
    const match = str.match(/^(\d{2}):(\d{2})$/);
    if (!match) return false;
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    if (raw.length > 5) return;
    setDisplayValue(formatTimeStr(raw));
  };

  const commit = () => {
    const formatted = displayValue;
    if (formatted === '') {
      onChange('');
    } else if (isValidTime(formatted)) {
      onChange(formatted);
    } else {
      setDisplayValue(value || '');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      commit();
      e.target.blur();
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={5}
      placeholder="HH:MM"
      value={displayValue}
      onChange={handleChange}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      style={{
        padding: '4px',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        width: '65px',
        fontSize: '13px',
        textAlign: 'center'
      }}
    />
  );
};

const WorkHoursTracker = () => {
  const initialRecords = {};
  const initialTargets = {};

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [monthlyTargets, setMonthlyTargets] = useState(() => {
    const saved = localStorage.getItem('workHoursTargets');
    return saved ? { ...initialTargets, ...JSON.parse(saved) } : initialTargets;
  });
  
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('workHoursRecords');
    return saved ? { ...initialRecords, ...JSON.parse(saved) } : initialRecords;
  });
  
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState('150');
  
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrParsedRecords, setOcrParsedRecords] = useState(null);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrImagePreview, setOcrImagePreview] = useState(null);

  const LUNCH_BREAK = 90; // 점심시간 기본값 90분 (1시간 30분)
  
  // 오늘 날짜
  const today = new Date().toISOString().split('T')[0];

  // 대한민국 공휴일 (연도별 하드코딩)
  const holidays = {
    // 2025년
    '2025-01-01': '신정',
    '2025-01-27': '임시공휴일(설날)',
    '2025-01-28': '설날 연휴',
    '2025-01-29': '설날',
    '2025-01-30': '설날 연휴',
    '2025-03-01': '삼일절',
    '2025-03-03': '대체공휴일(삼일절)',
    '2025-05-05': '어린이날·부처님오신날',
    '2025-05-06': '대체공휴일(부처님오신날)',
    '2025-06-06': '현충일',
    '2025-08-15': '광복절',
    '2025-10-03': '개천절',
    '2025-10-05': '추석 연휴',
    '2025-10-06': '추석',
    '2025-10-07': '추석 연휴',
    '2025-10-08': '대체공휴일(추석)',
    '2025-10-09': '한글날',
    '2025-12-25': '크리스마스',
    // 2026년
    '2026-01-01': '신정',
    '2026-02-16': '설날 연휴',
    '2026-02-17': '설날',
    '2026-02-18': '설날 연휴',
    '2026-03-01': '삼일절',
    '2026-03-02': '대체공휴일(삼일절)',
    '2026-05-05': '어린이날',
    '2026-05-24': '부처님오신날',
    '2026-05-25': '대체공휴일(부처님오신날)',
    '2026-06-06': '현충일',
    '2026-08-15': '광복절',
    '2026-08-17': '대체공휴일(광복절)',
    '2026-09-24': '추석 연휴',
    '2026-09-25': '추석',
    '2026-09-26': '추석 연휴',
    '2026-10-03': '개천절',
    '2026-10-05': '대체공휴일(개천절)',
    '2026-10-09': '한글날',
    '2026-12-25': '크리스마스',
    // 2027년
    '2027-01-01': '신정',
    '2027-02-06': '설날 연휴',
    '2027-02-07': '설날',
    '2027-02-08': '설날 연휴',
    '2027-02-09': '대체공휴일(설날)',
    '2027-03-01': '삼일절',
    '2027-05-05': '어린이날',
    '2027-05-13': '부처님오신날',
    '2027-06-06': '현충일',
    '2027-08-15': '광복절',
    '2027-08-16': '대체공휴일(광복절)',
    '2027-09-14': '추석 연휴',
    '2027-09-15': '추석',
    '2027-09-16': '추석 연휴',
    '2027-10-03': '개천절',
    '2027-10-04': '대체공휴일(개천절)',
    '2027-10-09': '한글날',
    '2027-10-11': '대체공휴일(한글날)',
    '2027-12-25': '크리스마스',
    '2027-12-27': '대체공휴일(크리스마스)',
  };

  // 공휴일 확인
  const isHoliday = (dateStr) => holidays[dateStr] || null;

  // 데이터 저장
  useEffect(() => {
    localStorage.setItem('workHoursTargets', JSON.stringify(monthlyTargets));
  }, [monthlyTargets]);

  useEffect(() => {
    localStorage.setItem('workHoursRecords', JSON.stringify(records));
  }, [records]);

  // 시간 문자열을 분으로 변환
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // 분을 시:분 형식으로 변환
  const minutesToTimeStr = (minutes) => {
    const h = Math.floor(Math.abs(minutes) / 60);
    const m = Math.abs(minutes) % 60;
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  // 실근무시간 계산 (점심시간 + 제외시간 반영)
  const calculateWorkHours = (startTime, endTime, lunchTime = LUNCH_BREAK, excludeTime = 0) => {
    if (!startTime || !endTime) return 0;
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const totalMinutes = endMinutes - startMinutes - lunchTime - excludeTime;
    return Math.max(0, totalMinutes);
  };

  // 월의 날짜 목록 생성
  const getDaysInMonth = (monthStr) => {
    const [year, month] = monthStr.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        day,
        dayOfWeek,
        dayName: ['일', '월', '화', '수', '목', '금', '토'][dayOfWeek],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        weekNumber: Math.ceil((day + new Date(year, month - 1, 1).getDay()) / 7)
      });
    }
    return days;
  };

  // 월 근무일수 계산
  const calculateWorkingDays = (monthStr) => {
    const days = getDaysInMonth(monthStr);
    return days.filter(({ date, isWeekend }) => !isWeekend && !isHoliday(date)).length;
  };

  // 현재 월의 목표 시간
  const DAILY_WORK_HOURS = 7.5;
  const calculatedTarget = calculateWorkingDays(currentMonth) * DAILY_WORK_HOURS;
  const hasCustomTarget = monthlyTargets[currentMonth] !== undefined;
  const currentTarget = hasCustomTarget ? monthlyTargets[currentMonth] : calculatedTarget;

  // 기록 업데이트
  const updateRecord = (date, field, value) => {
    setRecords(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [field]: value
      }
    }));
  };

  // 연차 퀵입력 (7시간 30분)
  const setAnnualLeave = (date) => {
    setRecords(prev => ({
      ...prev,
      [date]: {
        startTime: '08:00',
        endTime: '17:00',
        lunchTime: 90,
        excludeTime: 0,
        memo: '연차'
      }
    }));
  };

  // 반차 퀵입력 (기존 출퇴근 시간이 있으면 유지, 없으면 기본값 설정)
  const setHalfLeave = (date, type = 'am') => {
    setRecords(prev => {
      const existing = prev[date] || {};
      const defaultStart = type === 'am' ? '13:00' : '08:00';
      const defaultEnd = type === 'am' ? '17:30' : '12:30';
      return {
        ...prev,
        [date]: {
          ...existing,
          startTime: existing.startTime || defaultStart,
          endTime: existing.endTime || defaultEnd,
          lunchTime: 0,
          excludeTime: existing.excludeTime ?? 0,
          memo: type === 'am' ? '오전반차' : '오후반차'
        }
      };
    });
  };

  // 기본 근무 퀵입력
  const setDefaultWork = (date) => {
    setRecords(prev => ({
      ...prev,
      [date]: {
        startTime: '08:00',
        endTime: '17:00',
        lunchTime: 90,
        excludeTime: 0,
        memo: ''
      }
    }));
  };

  // 행 초기화 (데이터 삭제)
  const clearRecord = (date) => {
    setRecords(prev => {
      const newRecords = { ...prev };
      delete newRecords[date];
      return newRecords;
    });
  };

  // 입력 유효성 검사
  const validateRecord = (record) => {
    if (!record?.startTime || !record?.endTime) return null;
    
    const startMinutes = timeToMinutes(record.startTime);
    const endMinutes = timeToMinutes(record.endTime);
    const workMinutes = endMinutes - startMinutes;
    
    const errors = [];
    
    if (endMinutes <= startMinutes) {
      errors.push('퇴근시간이 출근시간보다 빠릅니다');
    }
    
    if (workMinutes > 720) {
      errors.push('12시간 초과 근무');
    }
    
    const lunchTime = record.lunchTime ?? 90;
    const excludeTime = record.excludeTime ?? 0;
    if (workMinutes - lunchTime - excludeTime < 0) {
      errors.push('제외시간이 총 근무시간보다 큽니다');
    }
    
    return errors.length > 0 ? errors : null;
  };

  // JSON 내보내기
  const exportData = () => {
    const data = {
      records,
      monthlyTargets,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `근태기록_${currentMonth}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON 가져오기
  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.records) setRecords(prev => ({ ...prev, ...data.records }));
          if (data.monthlyTargets) setMonthlyTargets(prev => ({ ...prev, ...data.monthlyTargets }));
          alert('데이터를 성공적으로 가져왔습니다.');
        } catch (err) {
          alert('파일 형식이 올바르지 않습니다.');
        }
      };
      reader.readAsText(file);
    }
  };

  // OCR 텍스트에서 근무 기록 파싱
  // 이미지 전처리 (OCR 정확도 향상: 스케일업 + 그레이스케일 + 대비강화)
  // 주의: blur/이진화는 점(.)과 콜론(:)을 파괴하므로 사용하지 않음
  const preprocessImage = (imageUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 2배 확대로 해상도 향상
        const scale = 2;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 그레이스케일 + 대비 강화 (Tesseract 내부 이진화에 맡김)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // 대비 1.5배 강화 (중간점 128 기준)
          gray = Math.max(0, Math.min(255, 128 + (gray - 128) * 1.5));
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imageUrl;
    });
  };

  const parseOcrText = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const parsedRecords = {};
    const [currentYear] = currentMonth.split('-');

    // OCR에서 자주 발생하는 숫자→비숫자 오인식 매핑
    const ocrDigitMap = {
      '(': '0', ')': '0', '{': '0', '[': '0', 'D': '0', 'O': '0', 'o': '0',
      'l': '1', 'I': '1', 'i': '1', '|': '1', '!': '1',
      'Z': '2', 'z': '2',
      '<': '4',
      'S': '5', 's': '5', 'c': '5',
      'b': '6',
      '>': '7',
      'B': '8',
      '¢': '9', 'g': '9', 'q': '9'
    };

    // 시간 추출 헬퍼: 라인에서 HH:MM 및 HHMM 패턴 찾기
    const extractTimes = (text) => {
      const times = [];
      // 1차: HH:MM (콜론 있는 시간)
      const timeRegex = /(\d{1,2}):(\d{2})/g;
      let match;
      while ((match = timeRegex.exec(text)) !== null) {
        const h = parseInt(match[1]);
        const m = parseInt(match[2]);
        if (h >= 5 && h <= 22 && m >= 0 && m <= 59) {
          times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }
      }
      // 2차: HHMM/HMM (OCR이 콜론 누락 시)
      if (times.length < 2) {
        const colonless = text.replace(/\d{1,2}:\d{2}/g, ' ');
        const numTokens = colonless.match(/\d{3,4}/g) || [];
        for (const num of numTokens) {
          let h, m;
          if (num.length === 4) {
            h = parseInt(num.substring(0, 2));
            m = parseInt(num.substring(2));
          } else {
            h = parseInt(num.substring(0, 1));
            m = parseInt(num.substring(1));
          }
          if (h >= 5 && h <= 22 && m >= 0 && m <= 59) {
            const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            if (!times.includes(timeStr)) {
              times.push(timeStr);
            }
          }
        }
      }
      return times;
    };

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      let dateStr = null;

      // 1) YYYY.MM.DD (구분자 있는 전체 날짜)
      const fullDateMatch = line.match(/(\d{4})[-.\/](\d{1,2})[-.\/]\s*(\d{1,2})/);
      // 2) YYYYMMDD (연결된 날짜)
      const concatDateMatch = !fullDateMatch
        ? line.match(/(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/) : null;
      // 3) 연도 일부 누락: X.MM.DD (OCR이 2026을 6으로 읽을 때 등)
      const partialYearMatch = (!fullDateMatch && !concatDateMatch)
        ? line.match(/\d{1,3}[-.\/](0[1-9]|1[0-2])[-.\/]\s*(\d{1,2})/) : null;
      // 4) MM.DD
      const shortDateMatch = (!fullDateMatch && !concatDateMatch && !partialYearMatch)
        ? line.match(/(?:^|[^\d:])(\d{1,2})[-.\/](\d{1,2})(?=[^\d:]|$)/) : null;

      if (fullDateMatch) {
        const matchStr = fullDateMatch[0];
        const [, year, month] = fullDateMatch;
        let day = fullDateMatch[3];

        // OCR 숫자 복구: 날짜 마지막 숫자 뒤 비숫자 문자가 원래 숫자일 수 있음
        // 예: 2026.02.1( → day=1, nextChar=(→0 → day=10
        if (day.length === 1) {
          const matchEnd = line.indexOf(matchStr) + matchStr.length;
          const nextChar = line[matchEnd];
          if (nextChar && ocrDigitMap[nextChar]) {
            day = day + ocrDigitMap[nextChar];
          }
        }
        const d = parseInt(day);
        if (d >= 1 && d <= 31) {
          dateStr = `${year}-${month.padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
      } else if (concatDateMatch) {
        const [, year, month, day] = concatDateMatch;
        dateStr = `${year}-${month}-${day}`;
      } else if (partialYearMatch) {
        const [, month, day] = partialYearMatch;
        const d = parseInt(day);
        if (d >= 1 && d <= 31) {
          dateStr = `${currentYear}-${month}-${String(d).padStart(2, '0')}`;
        }
      } else if (shortDateMatch) {
        const [, month, day] = shortDateMatch;
        const m = parseInt(month);
        const d = parseInt(day);
        if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
          dateStr = `${currentYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
      }

      if (!dateStr) continue;

      // 중복 날짜: 이미 완전한 레코드가 있으면 건너뛰기
      if (parsedRecords[dateStr]?.startTime && parsedRecords[dateStr]?.endTime) continue;

      // 휴일 건너뛰기 (OCR 오인식 포함: 류일, 후일 등)
      if (/휴일|류일/.test(line)) continue;

      // 시간 추출 - 날짜 이후 부분에서
      const dateMatchObj = fullDateMatch || concatDateMatch || partialYearMatch;
      const dateMatchEnd = dateMatchObj
        ? line.indexOf(dateMatchObj[0]) + dateMatchObj[0].length
        : (shortDateMatch ? line.indexOf(shortDateMatch[0]) + shortDateMatch[0].length : 0);
      const afterDate = line.slice(dateMatchEnd);

      let times = extractTimes(afterDate);

      // 인접 라인 검색: 시간이 다른 줄에 있을 때 (테이블 OCR 특성)
      if (times.length === 0) {
        for (const offset of [-1, 1]) {
          const adjIdx = lineIdx + offset;
          if (adjIdx < 0 || adjIdx >= lines.length) continue;
          const adjLine = lines[adjIdx];
          // 인접 라인에 날짜가 있으면 건너뛰기 (다른 행의 데이터)
          if (/\d{4}[-.\/]\d{1,2}[-.\/]/.test(adjLine)) continue;
          if (/(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/.test(adjLine)) continue;
          const adjTimes = extractTimes(adjLine);
          if (adjTimes.length > 0) {
            times = adjTimes;
            break;
          }
        }
      }

      // 출근 < 퇴근 순서 보장 (HHMM 폴백이 뒤에 추가될 수 있음)
      // sort 대신 swap: sort는 중복 시간(예: 8:09가 F열, I열에 모두 있음)을 앞으로 밀어냄
      if (times.length >= 2 && times[0] > times[1]) {
        [times[0], times[1]] = [times[1], times[0]];
      }

      // 키워드 감지 (OCR 오인식 변형 포함)
      const isAnnualLeave = /연[차사]/.test(line);
      const isHalfLeave = /[반란][차사]/.test(line);
      const isRemoteWork = /타지\s*출근|재택/.test(line);

      if (isAnnualLeave && times.length < 2) {
        parsedRecords[dateStr] = {
          startTime: '08:00',
          endTime: '17:00',
          lunchTime: 90,
          excludeTime: 0,
          memo: '연차'
        };
      } else if (isHalfLeave) {
        if (times.length >= 2) {
          const endH = parseInt(times[1].split(':')[0]);
          const memo = endH <= 14 ? '오전반차' : '오후반차';
          parsedRecords[dateStr] = {
            startTime: times[0],
            endTime: times[1],
            lunchTime: 0,
            excludeTime: 0,
            memo
          };
        } else {
          parsedRecords[dateStr] = {
            startTime: '13:00',
            endTime: '17:30',
            lunchTime: 0,
            excludeTime: 0,
            memo: '오전반차'
          };
        }
      } else if (isRemoteWork && times.length < 2) {
        parsedRecords[dateStr] = {
          startTime: '08:00',
          endTime: '17:00',
          lunchTime: 90,
          excludeTime: 0,
          memo: '타지출근'
        };
      } else if (times.length >= 2) {
        parsedRecords[dateStr] = {
          startTime: times[0],
          endTime: times[1],
          lunchTime: 90,
          excludeTime: 0,
          memo: ''
        };
      } else if (times.length === 1) {
        parsedRecords[dateStr] = {
          startTime: times[0],
          endTime: '',
          lunchTime: 90,
          excludeTime: 0,
          memo: ''
        };
      }
    }

    return parsedRecords;
  };

  // 이미지 업로드 및 OCR 처리
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      event.target.value = '';
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setOcrImagePreview(imageUrl);
    setShowOcrModal(true);
    setOcrProcessing(true);
    setOcrProgress(0);
    setOcrResult(null);
    setOcrParsedRecords(null);

    try {
      // 이미지 전처리 (그레이스케일 + 이진화로 텍스트 선명화)
      const processedImageUrl = await preprocessImage(imageUrl);

      const worker = await Tesseract.createWorker('kor+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });

      const { data: { text } } = await worker.recognize(processedImageUrl);
      await worker.terminate();

      setOcrResult(text);

      const parsed = parseOcrText(text);
      if (Object.keys(parsed).length > 0) {
        setOcrParsedRecords(parsed);
      }
    } catch (err) {
      alert('이미지 인식에 실패했습니다: ' + err.message);
      setShowOcrModal(false);
    } finally {
      setOcrProcessing(false);
    }

    event.target.value = '';
  };

  // OCR 결과 적용
  const applyOcrRecords = () => {
    if (ocrParsedRecords) {
      setRecords(prev => ({ ...prev, ...ocrParsedRecords }));
      alert(`${Object.keys(ocrParsedRecords).length}건의 근무 기록이 적용되었습니다.`);
    }
    closeOcrModal();
  };

  // OCR 모달 닫기
  const closeOcrModal = () => {
    setShowOcrModal(false);
    setOcrResult(null);
    setOcrParsedRecords(null);
    setOcrProcessing(false);
    if (ocrImagePreview) {
      URL.revokeObjectURL(ocrImagePreview);
      setOcrImagePreview(null);
    }
  };

  // 월간 통계 계산
  const calculateMonthlyStats = () => {
    const days = getDaysInMonth(currentMonth);
    let totalMinutes = 0;
    const weeklyMinutes = {};
    let remainingWorkDays = 0;

    days.forEach(({ date, weekNumber, isWeekend }) => {
      const record = records[date];
      const holiday = isHoliday(date);
      
      if (record?.startTime && record?.endTime) {
        const lunchTime = record.lunchTime ?? LUNCH_BREAK;
        const excludeTime = record.excludeTime ?? 0;
        const minutes = calculateWorkHours(record.startTime, record.endTime, lunchTime, excludeTime);
        totalMinutes += minutes;
        weeklyMinutes[weekNumber] = (weeklyMinutes[weekNumber] || 0) + minutes;
      }
      
      if (date >= today && !isWeekend && !holiday && !record?.startTime) {
        remainingWorkDays++;
      }
    });

    const targetMinutes = currentTarget * 60;
    const remainingMinutes = targetMinutes - totalMinutes;
    const avgMinutesPerDay = remainingWorkDays > 0 ? Math.ceil(remainingMinutes / remainingWorkDays) : 0;

    return {
      totalMinutes,
      totalHours: minutesToTimeStr(totalMinutes),
      weeklyMinutes,
      targetMinutes,
      remainingMinutes,
      remainingHours: minutesToTimeStr(remainingMinutes),
      isDeficit: remainingMinutes > 0,
      remainingWorkDays,
      avgMinutesPerDay,
      avgHoursPerDay: minutesToTimeStr(avgMinutesPerDay)
    };
  };

  const stats = calculateMonthlyStats();
  const days = getDaysInMonth(currentMonth);

  // 월 변경
  const changeMonth = (delta) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1 + delta, 1);
    setCurrentMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
  };

  // 목표 시간 저장
  const saveTarget = () => {
    const target = parseFloat(targetInput);
    if (!isNaN(target) && target > 0) {
      setMonthlyTargets(prev => ({
        ...prev,
        [currentMonth]: target
      }));
    }
    setEditingTarget(false);
  };

  // 목표 시간 자동 계산으로 초기화
  const resetTarget = () => {
    setMonthlyTargets(prev => {
      const next = { ...prev };
      delete next[currentMonth];
      return next;
    });
    setEditingTarget(false);
  };

  // 주차별 그룹핑
  const weekGroups = days.reduce((acc, day) => {
    if (!acc[day.weekNumber]) acc[day.weekNumber] = [];
    acc[day.weekNumber].push(day);
    return acc;
  }, {});

  return (
    <div style={{ 
      maxWidth: '1100px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* 헤더 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button 
            onClick={() => changeMonth(-1)}
            style={{
              padding: '8px 16px',
              border: 'none',
              backgroundColor: '#e9ecef',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ◀ 이전
          </button>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>
            {currentMonth.replace('-', '년 ')}월 근태관리
          </h1>
          <button 
            onClick={() => changeMonth(1)}
            style={{
              padding: '8px 16px',
              border: 'none',
              backgroundColor: '#e9ecef',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            다음 ▶
          </button>
        </div>

        {/* 내보내기/가져오기 버튼 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'flex-end' }}>
          <button
            onClick={exportData}
            style={{
              padding: '6px 12px',
              border: '1px solid #dee2e6',
              backgroundColor: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#495057'
            }}
          >
            📤 내보내기
          </button>
          <label style={{
            padding: '6px 12px',
            border: '1px solid #dee2e6',
            backgroundColor: 'white',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#495057'
          }}>
            📥 가져오기
            <input
              type="file"
              accept=".json"
              onChange={importData}
              style={{ display: 'none' }}
            />
          </label>
          <label style={{
            padding: '6px 12px',
            border: '1px solid #4dabf7',
            backgroundColor: '#e7f5ff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#1971c2'
          }}>
            📷 이미지 인식
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* 월간 요약 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            backgroundColor: '#e7f5ff',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#1971c2', marginBottom: '4px' }}>
              월 목표시간 {hasCustomTarget ? '(수정됨)' : `(자동 ${calculateWorkingDays(currentMonth)}일 × ${DAILY_WORK_HOURS}h)`}
            </div>
            {editingTarget ? (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                <input
                  type="number"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  style={{ width: '60px', textAlign: 'center', padding: '4px' }}
                />
                <button onClick={saveTarget} style={{ padding: '4px 8px', cursor: 'pointer' }}>저장</button>
                <button onClick={() => setEditingTarget(false)} style={{ padding: '4px 8px', cursor: 'pointer', color: '#868e96' }}>취소</button>
              </div>
            ) : (
              <>
                <div
                  onClick={() => { setEditingTarget(true); setTargetInput(String(currentTarget)); }}
                  style={{ fontSize: '24px', fontWeight: 'bold', color: '#1971c2', cursor: 'pointer' }}
                >
                  {currentTarget}시간
                </div>
                {hasCustomTarget && (
                  <button
                    onClick={resetTarget}
                    style={{
                      marginTop: '4px',
                      padding: '2px 8px',
                      border: '1px solid #a5d8ff',
                      backgroundColor: '#e7f5ff',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      color: '#1971c2'
                    }}
                  >
                    자동 계산으로 초기화 ({calculatedTarget}h)
                  </button>
                )}
              </>
            )}
          </div>

          <div style={{
            backgroundColor: '#d3f9d8',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#2f9e44', marginBottom: '4px' }}>누적 근무시간</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2f9e44' }}>
              {stats.totalHours}
            </div>
          </div>

          <div style={{
            backgroundColor: stats.isDeficit ? '#fff3bf' : '#d3f9d8',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: stats.isDeficit ? '#e67700' : '#2f9e44', marginBottom: '4px' }}>
              {stats.isDeficit ? '부족시간' : '초과시간'}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: stats.isDeficit ? '#e67700' : '#2f9e44' }}>
              {stats.isDeficit ? stats.remainingHours : minutesToTimeStr(Math.abs(stats.remainingMinutes))}
            </div>
          </div>

          <div style={{
            backgroundColor: '#f3f0ff',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#7048e8', marginBottom: '4px' }}>남은 근무일</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7048e8' }}>
              {stats.remainingWorkDays}일
            </div>
          </div>

          {stats.isDeficit && stats.remainingWorkDays > 0 && (
            <div style={{
              backgroundColor: '#fff0f6',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#c2255c', marginBottom: '4px' }}>일평균 필요</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c2255c' }}>
                {stats.avgHoursPerDay}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 주차별 기록 */}
      {Object.entries(weekGroups).map(([weekNum, weekDays]) => (
        <div key={weekNum} style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid #e9ecef'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#495057' }}>{weekNum}주차</h3>
            <span style={{ 
              fontSize: '14px', 
              color: '#868e96',
              backgroundColor: '#f1f3f5',
              padding: '4px 12px',
              borderRadius: '12px'
            }}>
              {minutesToTimeStr(stats.weeklyMinutes[weekNum] || 0)}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '8px', textAlign: 'left', width: '70px' }}>날짜</th>
                  <th style={{ padding: '8px', textAlign: 'center', width: '85px' }}>출근시간</th>
                  <th style={{ padding: '8px', textAlign: 'center', width: '85px' }}>퇴근시간</th>
                  <th style={{ padding: '8px', textAlign: 'center', width: '70px' }}>점심시간</th>
                  <th style={{ padding: '8px', textAlign: 'center', width: '70px' }}>제외시간</th>
                  <th style={{ padding: '8px', textAlign: 'center', width: '70px' }}>실근무시간</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>메모</th>
                </tr>
              </thead>
              <tbody>
                {weekDays.map(({ date, day, dayName, isWeekend }) => {
                  const record = records[date] || {};
                  const lunchTime = record.lunchTime ?? LUNCH_BREAK;
                  const excludeTime = record.excludeTime ?? 0;
                  const workMinutes = calculateWorkHours(record.startTime, record.endTime, lunchTime, excludeTime);
                  const isToday = date === today;
                  const holiday = isHoliday(date);
                  const validationErrors = validateRecord(record);
                  const hasError = validationErrors && validationErrors.length > 0;
                  
                  return (
                    <tr key={date} style={{ 
                      backgroundColor: hasError ? '#fff5f5' : isToday ? '#fff9db' : holiday ? '#e7f5ff' : isWeekend ? '#fff5f5' : 'white',
                      borderBottom: '1px solid #e9ecef',
                      borderLeft: hasError ? '3px solid #e03131' : isToday ? '3px solid #fab005' : 'none'
                    }}>
                      <td style={{ 
                        padding: '8px',
                        color: holiday ? '#1971c2' : isWeekend ? (dayName === '일' ? '#e03131' : '#1971c2') : '#333',
                        fontWeight: isToday ? '700' : '500'
                      }}>
                        {day}일 ({dayName})
                        {isToday && <span style={{ fontSize: '10px', marginLeft: '4px', color: '#fab005' }}>오늘</span>}
                        {holiday && <div style={{ fontSize: '10px', color: '#1971c2' }}>{holiday}</div>}
                        {hasError && (
                          <div style={{ fontSize: '9px', color: '#e03131', marginTop: '2px' }}>
                            ⚠️ {validationErrors[0]}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        <TimeInput
                          value={record.startTime || ''}
                          onChange={(val) => updateRecord(date, 'startTime', val)}
                        />
                      </td>
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        <TimeInput
                          value={record.endTime || ''}
                          onChange={(val) => updateRecord(date, 'endTime', val)}
                        />
                      </td>
                      <td style={{ padding: '4px', textAlign: 'center', color: '#868e96', fontSize: '12px' }}>
                        1:30:00
                      </td>
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          value={excludeTime || 0}
                          onChange={(e) => updateRecord(date, 'excludeTime', parseInt(e.target.value) || 0)}
                          style={{
                            padding: '4px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            width: '50px',
                            fontSize: '12px',
                            textAlign: 'center'
                          }}
                        />
                        <span style={{ fontSize: '11px', color: '#868e96', marginLeft: '2px' }}>분</span>
                      </td>
                      <td style={{ 
                        padding: '8px', 
                        textAlign: 'center',
                        fontWeight: workMinutes > 0 ? '600' : '400',
                        color: workMinutes > 0 ? '#2f9e44' : '#adb5bd',
                        fontSize: '13px'
                      }}>
                        {workMinutes > 0 ? minutesToTimeStr(workMinutes) : '-'}
                      </td>
                      <td style={{ padding: '4px' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={record.memo || ''}
                            onChange={(e) => updateRecord(date, 'memo', e.target.value)}
                            placeholder="메모"
                            style={{
                              padding: '4px 6px',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              width: '70px',
                              fontSize: '12px',
                              color: record.memo ? '#e03131' : '#333'
                            }}
                          />
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <button
                              onClick={() => setDefaultWork(date)}
                              title="기본근무 (08:00-17:00)"
                              style={{
                                padding: '2px 6px',
                                border: '1px solid #dee2e6',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '10px',
                                color: '#495057'
                              }}
                            >
                              기본
                            </button>
                            <button
                              onClick={() => setAnnualLeave(date)}
                              title="연차 (7시간 30분)"
                              style={{
                                padding: '2px 6px',
                                border: '1px solid #ffa8a8',
                                backgroundColor: '#fff5f5',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '10px',
                                color: '#e03131'
                              }}
                            >
                              연차
                            </button>
                            <button
                              onClick={() => setHalfLeave(date, 'am')}
                              title="오전반차"
                              style={{
                                padding: '2px 6px',
                                border: '1px solid #ffc078',
                                backgroundColor: '#fff4e6',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '10px',
                                color: '#e67700'
                              }}
                            >
                              오전
                            </button>
                            <button
                              onClick={() => setHalfLeave(date, 'pm')}
                              title="오후반차"
                              style={{
                                padding: '2px 6px',
                                border: '1px solid #ffc078',
                                backgroundColor: '#fff4e6',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '10px',
                                color: '#e67700'
                              }}
                            >
                              오후
                            </button>
                            {(record.startTime || record.endTime || record.memo) && (
                              <button
                                onClick={() => clearRecord(date)}
                                title="초기화"
                                style={{
                                  padding: '2px 6px',
                                  border: '1px solid #868e96',
                                  backgroundColor: '#f1f3f5',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  color: '#495057'
                                }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* 푸터 */}
      <div style={{
        textAlign: 'center',
        padding: '20px',
        color: '#868e96',
        fontSize: '12px'
      }}>
        1일 기준 근무시간 7시간 30분 | 점심시간 1시간 30분 자동 제외 | 데이터는 브라우저에 자동 저장됩니다
      </div>

      {/* OCR 모달 */}
      {showOcrModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>이미지 텍스트 인식</h2>
              <button
                onClick={closeOcrModal}
                style={{
                  border: 'none',
                  backgroundColor: '#f1f3f5',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#495057'
                }}
              >
                ✕
              </button>
            </div>

            {ocrImagePreview && (
              <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                <img
                  src={ocrImagePreview}
                  alt="업로드된 이미지"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}
                />
              </div>
            )}

            {ocrProcessing && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: '#495057', marginBottom: '8px' }}>
                  텍스트 인식 중... {ocrProgress}%
                </div>
                <div style={{
                  height: '8px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${ocrProgress}%`,
                    backgroundColor: '#4dabf7',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}

            {ocrResult && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                    인식된 텍스트
                  </div>
                  <pre style={{
                    backgroundColor: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    maxHeight: '150px',
                    overflow: 'auto',
                    border: '1px solid #dee2e6',
                    color: '#333'
                  }}>
                    {ocrResult}
                  </pre>
                </div>

                {ocrParsedRecords && Object.keys(ocrParsedRecords).length > 0 ? (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                      추출된 근무 기록 ({Object.keys(ocrParsedRecords).length}건)
                    </div>
                    <div style={{
                      backgroundColor: '#d3f9d8',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}>
                      {Object.entries(ocrParsedRecords).map(([date, rec]) => (
                        <div key={date} style={{ marginBottom: '4px', color: '#2f9e44' }}>
                          {date}: {rec.memo ? `[${rec.memo}] ` : ''}{rec.startTime}{rec.endTime ? ` ~ ${rec.endTime}` : rec.startTime ? ' (출근)' : ''}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={applyOcrRecords}
                      style={{
                        marginTop: '12px',
                        padding: '10px 24px',
                        border: 'none',
                        backgroundColor: '#2f9e44',
                        color: 'white',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        width: '100%'
                      }}
                    >
                      근무 기록에 적용
                    </button>
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: '#fff3bf',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#e67700'
                  }}>
                    근무 기록을 자동으로 추출하지 못했습니다. 이미지에 날짜(MM/DD)와 시간(HH:MM) 패턴이 포함되어 있는지 확인해주세요.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkHoursTracker;
