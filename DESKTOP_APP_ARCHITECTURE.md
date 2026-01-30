# 데스크탑 앱 아키텍처 분석 및 계획

## 현재 웹 앱 구조
```
Next.js (프론트엔드)
    ↓ API 호출
Next.js API Routes (백엔드)
    ↓ Prisma ORM
SQLite Database (외부 서버 필요)
    ↓ child_process
Playwright 실행 (Node.js)
```

## 데스크탑 앱으로 변환 후 구조
```
Electron (메인 프로세스)
    ↓ BrowserWindow
Next.js 렌더러 (프론트엔드)
    ↓ IPC 통신
Electron 메인 프로세스 (백엔드 역할)
    ↓ Prisma ORM
로컬 SQLite 파일 (앱 데이터 폴더)
    ↓ child_process
Playwright 실행 (로컬 설치)
```

## 주요 변화점

### 1. 데이터베이스 위치 변경
**현재 문제:**
- SQLite가 외부 서버에 있어야 함
- 웹 환경에서는 파일 시스템 접근 제한

**데스크탑 앱 해결책:**
```typescript
// 사용자 앱 데이터 폴더에 DB 저장
const dbPath = path.join(app.getPath('userData'), 'scenably.db');
process.env.DATABASE_URL = `file:${dbPath}`;
```

### 2. API Routes → IPC 통신 변경
**현재:** HTTP API 요청
```typescript
// 웹에서
fetch('/api/scenarios', { method: 'POST', body: ... })
```

**데스크탑 앱:** IPC 통신
```typescript
// 렌더러 프로세스에서
window.electronAPI.createScenario(data)

// 메인 프로세스에서
ipcMain.handle('create-scenario', async (_, data) => {
  return await prisma.scenario.create({ data })
})
```

### 3. Playwright 실행 환경
**현재 상태:** ✅ 이미 로컬 실행 가능
- child_process로 Playwright 스크립트 실행
- 임시 파일 생성하여 테스트 실행
- 이 부분은 데스크탑 앱에서도 동일하게 작동

### 4. 파일 시스템 접근
**데스크탑 앱 장점:**
- 사용자 파일 시스템에 직접 접근 가능
- 시나리오 파일 저장/불러오기 가능
- 스크린샷, 비디오 등 결과물 저장 가능

## 구현 단계별 계획

### 1단계: 데이터베이스 로컬화 ✅ (완료 필요)
- Electron 앱 데이터 폴더에 SQLite 파일 생성
- DATABASE_URL 환경변수 설정
- Prisma 마이그레이션 실행

### 2단계: API Routes → IPC 변환
- 시나리오 CRUD 작업을 IPC 핸들러로 변환
- 프론트엔드의 fetch 요청을 electronAPI 호출로 변환

### 3단계: Playwright 통합 강화
- 실행 결과 파일을 앱 데이터 폴더에 저장
- 스크린샷, 비디오 등 미디어 파일 관리

### 4단계: 네이티브 기능 추가
- 파일 다이얼로그로 시나리오 파일 가져오기/내보내기
- 시스템 알림
- 메뉴바 통합

## 현재 상태 평가
- ✅ Playwright 로컬 실행 구조 (수정 불필요)
- ✅ SQLite 사용 중 (위치만 변경 필요)
- ⚠️ API Routes 의존성 (IPC로 변환 필요)
- ⚠️ 웹 제약사항 (데스크탑에서 해결 가능)

## 다음 우선순위
1. **데이터베이스 로컬화** (가장 중요)
2. **핵심 IPC 통신 구현** (시나리오 CRUD)
3. **Playwright 실행 경로 최적화**
4. **파일 시스템 기능 추가**