import React, { useState, useEffect } from 'react';

const WorkHoursTracker = () => {
  // 초기 데이터 - 2026년 1월 기록 (이미지 기반)
  // excludeTime: 제외시간 (분 단위), lunchTime: 점심시간 (분 단위, 기본 90분)
  const initialRecords = {
    // 1W (1주차) - 1월 5일~9일 (월~금)
    '2026-01-05': { startTime: '08:10', endTime: '16:38', lunchTime: 90, excludeTime: 0, memo: '' },
    '2026-01-06': { startTime: '08:08', endTime: '16:44', lunchTime: 90, excludeTime: 0, memo: '' },
    '2026-01-07': { startTime: '08:13', endTime: '16:38', lunchTime: 90, excludeTime: 0, memo: '' },
    '2026-01-08': { startTime: '08:19', endTime: '16:09', lunchTime: 90, excludeTime: 0, memo: '' },
    '2026-01-09': { startTime: '08:16', endTime: '16:40', lunchTime: 90, excludeTime: 3, memo: '' },
    // 2W (2주차) - 1월 12일~16일 (월~금)
    '2026-01-12': { startTime: '09:49', endTime: '19:38', lunchTime: 90, excludeTime: 3, memo: '' },
    '2026-01-13': { startTime: '08:22', endTime: '16:35', lunchTime: 90, excludeTime: 0, memo: '' },
    '2026-01-14': { startTime: '08:07', endTime: '16:32', lunchTime: 90, excludeTime: 0, memo: '' },
    '2026-01-15': { startTime: '08:00', endTime: '17:00', lunchTime: 90, excludeTime: 0, memo: '연차' },
    '2026-01-16': { startTime: '08:00', endTime: '17:30', lunchTime: 90, excludeTime: 0, memo: '매뉴얼' },
    // 3W (3주차) - 1월 19일~23일 (월~금)
    '2026-01-19': { startTime: '08:00', endTime: '17:00', lunchTime: 90, excludeTime: 0, memo: '연차' },
    '2026-01-20': { startTime: '08:00', endTime: '17:00', lunchTime: 90, excludeTime: 0, memo: '' },
    '2026-01-21': { startTime: '08:00', endTime: '16:36', lunchTime: 90, excludeTime: 0, memo: '' },
    '2026-01-22': { startTime: '08:00', endTime: '17:30', lunchTime: 90, excludeTime: 0, memo: '매뉴얼 한남' },
    '2026-01-23': { startTime: '08:21', endTime: '16:25', lunchTime: 90, excludeTime: 0, memo: '' },
    // 4W (4주차) - 1월 26일~30일 (월~금)
    '2026-01-26': { startTime: '08:20', endTime: '20:00', lunchTime: 90, excludeTime: 0, memo: '' },
    '2026-01-29': { startTime: '08:00', endTime: '17:30', lunchTime: 90, excludeTime: 0, memo: '매뉴얼' },
    '2026-01-30': { startTime: '08:00', endTime: '17:30', lunchTime: 90, excludeTime: 0, memo: '매뉴얼' },
    // 5W - 2월 (1월 계산에 포함)
    '2026-02-02': { startTime: '08:00', endTime: '17:00', lunchTime: 90, excludeTime: 0, memo: '' },
    '2026-02-03': { startTime: '08:00', endTime: '17:00', lunchTime: 90, excludeTime: 0, memo: '' },
  };

  const initialTargets = {
    '2026-01': 150
  };

  const [currentMonth, setCurrentMonth] = useState('2026-01');
  
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
  
  const LUNCH_BREAK = 90; // 점심시간 기본값 90분 (1시간 30분)
  
  // 오늘 날짜
  const today = new Date().toISOString().split('T')[0];

  // 2026년 대한민국 공휴일
  const holidays2026 = {
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
  };

  // 공휴일 확인
  const isHoliday = (dateStr) => holidays2026[dateStr] || null;

  // 데이터 저장
  useEffect(() => {
    localStorage.setItem('workHoursTargets', JSON.stringify(monthlyTargets));
  }, [monthlyTargets]);

  useEffect(() => {
    localStorage.setItem('workHoursRecords', JSON.stringify(records));
  }, [records]);

  // 현재 월의 목표 시간
  const currentTarget = monthlyTargets[currentMonth] || 150;

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

  // 연차 퀵입력 (8시간)
  const setAnnualLeave = (date) => {
    setRecords(prev => ({
      ...prev,
      [date]: {
        startTime: '08:00',
        endTime: '17:30',
        lunchTime: 90,
        excludeTime: 0,
        memo: '연차'
      }
    }));
  };

  // 반차 퀵입력 (4시간)
  const setHalfLeave = (date, type = 'am') => {
    setRecords(prev => ({
      ...prev,
      [date]: {
        startTime: type === 'am' ? '13:00' : '08:00',
        endTime: type === 'am' ? '17:30' : '12:30',
        lunchTime: type === 'am' ? 0 : 0,
        excludeTime: 0,
        memo: type === 'am' ? '오전반차' : '오후반차'
      }
    }));
  };

  // 기본 근무 퀵입력
  const setDefaultWork = (date) => {
    setRecords(prev => ({
      ...prev,
      [date]: {
        startTime: '08:00',
        endTime: '17:30',
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
            <div style={{ fontSize: '12px', color: '#1971c2', marginBottom: '4px' }}>월 목표시간</div>
            {editingTarget ? (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <input
                  type="number"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  style={{ width: '60px', textAlign: 'center', padding: '4px' }}
                />
                <button onClick={saveTarget} style={{ padding: '4px 8px', cursor: 'pointer' }}>저장</button>
              </div>
            ) : (
              <div 
                onClick={() => { setEditingTarget(true); setTargetInput(String(currentTarget)); }}
                style={{ fontSize: '24px', fontWeight: 'bold', color: '#1971c2', cursor: 'pointer' }}
              >
                {currentTarget}시간
              </div>
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
                        <input
                          type="time"
                          value={record.startTime || ''}
                          onChange={(e) => updateRecord(date, 'startTime', e.target.value)}
                          style={{
                            padding: '4px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            width: '80px',
                            fontSize: '13px'
                          }}
                        />
                      </td>
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        <input
                          type="time"
                          value={record.endTime || ''}
                          onChange={(e) => updateRecord(date, 'endTime', e.target.value)}
                          style={{
                            padding: '4px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            width: '80px',
                            fontSize: '13px'
                          }}
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
                              title="기본근무 (08:00-17:30)"
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
                              title="연차 (8시간)"
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
        점심시간 1시간 30분 자동 제외 | 데이터는 브라우저에 자동 저장됩니다
      </div>
    </div>
  );
};

export default WorkHoursTracker;
