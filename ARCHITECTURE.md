# Scenably - 앱 아키텍처 문서

## 🏗 전체 시스템 아키텍처

Scenably는 Electron 기반의 데스크톱 애플리케이션으로, React 렌더러와 Node.js 메인 프로세스가 협력하여 Playwright 기반의 E2E 테스트 시나리오를 생성하고 관리합니다.

```
┌─────────────────────────────────────────────────────────┐
│                    Scenably Desktop App                 │
├─────────────────────────────────────────────────────────┤
│  Electron Main Process (Node.js)                       │
│  ├── Window Management & App Lifecycle                 │
│  ├── IPC Handlers (Database, Playwright, Schedule)     │
│  ├── Playwright Recording Engine                       │
│  ├── Playwright Debug Engine                           │
│  ├── Windows Task Scheduler Bridge                     │
│  └── Local SQLite Database                             │
├─────────────────────────────────────────────────────────┤
│  Electron Renderer Process (Chromium)                  │
│  ├── React 19 + TypeScript UI                          │
│  ├── Vite HMR Development Server                       │
│  ├── Zustand State Management                          │
│  └── Tailwind CSS + Radix UI Components                │
├─────────────────────────────────────────────────────────┤
│  External Processes                                     │
│  ├── Playwright Browser Instances                      │
│  ├── Generated Test Execution                          │
│  └── Claude AI API (Optional)                          │
└─────────────────────────────────────────────────────────┘
```

## 📁 디렉터리 구조 상세

```
Scenably/
├── electron/                           # Electron 메인 프로세스
│   ├── main.ts                         # 앱 진입점, 윈도우 관리, IPC 설정
│   ├── preload.ts                      # 보안 컨텍스트 브릿지 (렌더러↔메인)
│   ├── ipc-handlers-sqlite.ts          # 시나리오/실행/스케줄 IPC 핸들러
│   ├── database-sqlite.ts              # SQLite 스키마 및 CRUD
│   ├── scheduler-windows.ts            # schtasks 기반 스케줄러 연동
│   ├── playwright-electron-recorder.ts # Playwright 레코딩 엔진
│   ├── playwright-electron-debug.ts    # Playwright 디버그 모드 엔진
│   ├── playwright-electron-executor.ts # 백그라운드 실행 엔진
│   └── tsconfig.json                   # Electron용 TypeScript 설정
│
├── src/                                # React 렌더러 프로세스
│   ├── app/                            # 라우팅 기반 페이지 구조
│   │   ├── page.tsx                    # 메인 대시보드 (시나리오 목록 & 퀵스타트)
│   │   ├── layout.tsx                  # 루트 레이아웃 (네비게이션, 테마)
│   │   ├── scenario/
│   │   │   ├── new/page.tsx            # 새 시나리오 생성 페이지
│   │   │   └── edit/page.tsx           # 기존 시나리오 편집 페이지
│   │   ├── schedules/
│   │   │   ├── page.tsx                # 스케줄 목록/필터/토글 페이지
│   │   │   ├── new/page.tsx            # 스케줄 등록/편집 페이지
│   │   │   └── id/page.tsx             # 스케줄 상세/이력 페이지
│   │   └── test-optimizer/page.tsx     # Playwright 코드 최적화 도구
│   ├── features/                       # 기능별 컴포넌트 그룹
│   │   ├── layout/components/          # 앱 헤더, 네비게이션 등
│   │   ├── recording/components/       # 레코딩 컨트롤 UI
│   │   └── scenarios/                  # 시나리오 + 스케줄 서비스/컴포넌트
│   ├── shared/                         # 공유 컴포넌트
│   │   ├── components/                 # 재사용 가능한 공통 컴포넌트
│   │   └── ui/                         # shadcn/ui 기본 UI 컴포넌트
│   ├── lib/                            # 유틸리티 함수들
│   ├── stores/                         # Zustand 상태 관리 (추후 구현)
│   ├── types/                          # TypeScript 타입 정의
│   └── main.tsx                        # React 앱 진입점
│
├── scripts/                            # 빌드 & 배포 스크립트
│   ├── download-all-browsers.js        # 모든 플랫폼 브라우저 다운로드
│   ├── ensure-windows-browsers.js      # Windows 브라우저 확인 & 설치
│   ├── create-windows-chrome-wrapper.js # Windows 호환성 래퍼 생성
│   └── copy-browsers.js                # 브라우저 파일 복사
│
├── browsers/                           # Playwright 브라우저 바이너리
│   ├── chromium-1193/                  # Chromium 브라우저
│   ├── chromium_headless_shell-1193/   # Headless Shell (크로스 플랫폼)
│   └── (기타 브라우저들...)
│
├── tests/                              # 생성된 테스트 파일 저장소
│   ├── scenarios/                      # 저장된 시나리오 파일들
│   └── debug/                          # 디버그 세션 임시 파일
│
└── dist-electron/                      # 빌드된 Electron 파일
    ├── main.js                         # 컴파일된 메인 프로세스
    └── preload.js                      # 컴파일된 preload 스크립트
```

## 🔄 프로세스간 통신 (IPC) 아키텍처

### IPC 채널 구조

```typescript
// 메인 프로세스 → 렌더러 프로세스 (Preload를 통해)
interface ElectronAPI {
  // 데이터베이스 작업
  getScenarios: () => Promise<Scenario[]>
  createScenario: (data: ScenarioData) => Promise<Scenario>
  updateScenario: (id: string, data: Partial<ScenarioData>) => Promise<Scenario>
  deleteScenario: (id: string) => Promise<void>

  // Playwright 작업
  startRecording: (url: string, options?: RecordingOptions) => Promise<RecordingSession>
  stopRecording: (sessionId: string) => Promise<GeneratedCode>
  executeScenario: (code: string, options?: ExecutionOptions) => Promise<ExecutionResult>
  debugScenario: (code: string, options?: DebugOptions) => Promise<void>

  // 스케줄 작업
  getScheduleByScenarioId: (scenarioId: string) => Promise<ScenarioSchedule | null>
  saveSchedule: (data: ScenarioSchedule) => Promise<ScenarioSchedule>
  toggleSchedule: (scenarioId: string, enabled: boolean) => Promise<ScenarioSchedule>
  deleteSchedule: (scenarioId: string) => Promise<{ deleted: boolean }>
  listSchedules: () => Promise<ScenarioScheduleWithScenario[]>
  listScheduleRuns: (scheduleId: string) => Promise<ScheduleRun[]>

  // AI 통합 (추후 구현 예정)
  enhanceWithAI: (code: string, prompt: string) => Promise<string>
}
```

### 데이터 흐름

```
렌더러 프로세스 (React)
    ↓ IPC 호출
Preload 스크립트 (보안 브릿지)
    ↓ IPC 포워딩
메인 프로세스 (Node.js)
    ↓ 데이터베이스/파일시스템/Playwright 작업
결과 반환
    ↑ IPC 응답
렌더러 프로세스 (UI 업데이트)
```

## 🎭 Playwright 통합 아키텍처

### 레코딩 엔진 (`playwright-electron-recorder.ts`)

```typescript
class PlaywrightElectronRecorder {
  // 브라우저 실행 및 코드 생성
  private static async launchBrowserForRecording(url: string)

  // 크로스 플랫폼 브라우저 경로 감지
  private static getAvailableChromiumExecutablePath(): string | null

  // 코드 생성 및 정리
  private static cleanupGeneratedCode(code: string): string
}
```

**브라우저 감지 우선순위:**
1. 앱 번들된 Playwright 브라우저 (`browsers/chromium-*`)
2. Headless Shell (`browsers/chromium_headless_shell-*`)
3. 시스템 Chrome (`C:\Program Files\Google\Chrome\...`)
4. 시스템 Chromium (Linux/macOS)

### 디버그 엔진 (`playwright-electron-debug.ts`)

```typescript
class ElectronPlaywrightDebugger {
  // --debug 플래그와 함께 Playwright Test 실행 (Inspector UI 표시)
  static async startDebugSession(code: string, sessionId: string)

  // 코드 형태 감지 및 변환 (Codegen → Test 형태)
  private static processCodeForDebug(code: string): string

  // 임시 .spec.ts 파일 + playwright.config 생성 → spawn 실행
  private static runPlaywrightTest(session: DebugSession): Promise<boolean>
}
```

### 백그라운드 실행 엔진 (`playwright-electron-executor.ts`)

시나리오를 headless 모드로 백그라운드 실행하고 결과를 비동기로 수집하는 엔진입니다.

```
사용자 "실행" 클릭
    ↓
IPC: scenarios:execute
    ↓
DB에 RUNNING 상태로 execution 레코드 생성
    ↓
즉시 응답 반환 (executionId + RUNNING 상태)
    ↓ (fire-and-forget)
ElectronPlaywrightExecutor.executeInBackground()
    ├── 임시 디렉토리 생성 (tests/execute/)
    ├── 임시 .spec.ts 파일 생성
    ├── 임시 playwright.config 생성 (headless: true, chromium 경로 포함)
    ├── Playwright binary 탐색 (개발/패키징 모드 자동 분기)
    ├── spawn으로 별도 프로세스 실행 (ELECTRON_RUN_AS_NODE=1)
    ├── stdout/stderr 실시간 캡처
    └── 프로세스 종료 시:
        ├── DB 업데이트 (SUCCESS/FAILURE + 결과 JSON)
        ├── IPC로 렌더러에 알림 (execution:statusChanged)
        └── 임시 파일 정리
```

```typescript
class ElectronPlaywrightExecutor {
  // headless 모드로 테스트를 백그라운드 실행
  static async executeInBackground(executionId: string, scenarioId: string, code: string)

  // 실행 결과를 DB에 저장하고 렌더러에 알림
  private static updateExecutionResult(executionId: string, status: 'SUCCESS' | 'FAILURE', result: any)
}
```

**프론트엔드 결과 수신 방식:**
1. **IPC 이벤트 구독**: `execution:statusChanged` 이벤트를 수신하여 즉시 반영
2. **폴링 폴백**: RUNNING 상태 실행이 있으면 3초 간격으로 시나리오 목록 재조회
3. **결과 상세 보기**: StatusBadge 클릭 시 ExecutionDetailDialog에서 stdout/stderr/에러 확인

**환경변수 설정:**
```typescript
{
  NODE_ENV: 'development',
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',     // 브라우저 자동 다운로드 방지
  PLAYWRIGHT_BROWSERS_PATH: getBrowserPath(), // 번들된 브라우저 경로
  ELECTRON_RUN_AS_NODE: '1',                 // Electron을 Node.js로 실행
}
```

## 🗓️ 스케줄링 아키텍처

스케줄 기능은 SQLite(`schedules`, `schedule_runs`)와 OS 스케줄러를 결합해 동작합니다.

### 스케줄 등록/토글/삭제 흐름

```
Renderer (스케줄 등록/수정 UI)
    ↓
IPC: schedules:save / schedules:toggle / schedules:delete
    ↓
Main: ipc-handlers-sqlite.ts
    ├── DB upsert/update/delete
    └── Windows인 경우 scheduler-windows.ts 호출
         ├── schtasks /Create
         ├── schtasks /Change (/Enable, /Disable)
         └── schtasks /Delete
```

### 스케줄 실행 흐름 (Windows 작업 스케줄러)

`scheduler-windows.ts`는 작업 명령을 `"<electron-exec-path>" --run-schedule=<scheduleId>` 형태로 등록합니다.

```
Windows Task Scheduler 트리거
    ↓
Electron main.ts --run-schedule=<id> 모드 실행
    ↓
DB에서 schedule/scenario 조회 + enabled 확인
    ↓
executions RUNNING 생성 + schedule_runs RUNNING 생성
    ↓
ElectronPlaywrightExecutor.executeInBackground(...)
    ↓
종료 콜백에서 schedule_runs 상태 업데이트(SUCCESS/FAILURE)
    ↓
앱 자동 종료
```

## 💾 데이터베이스 아키텍처

### SQLite 로컬 데이터베이스

**위치:**
- Windows: `%APPDATA%\Scenably\database\scenably.db`
- macOS: `~/Library/Application Support/Scenably/database/scenably.db`
- Linux: `~/.config/Scenably/database/scenably.db`

**스키마 (주요 테이블):**
```sql
-- 시나리오 정보
CREATE TABLE scenarios (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  targetUrl TEXT NOT NULL,
  code TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 실행 결과
CREATE TABLE executions (
  id TEXT PRIMARY KEY,
  scenarioId TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILURE', 'RUNNING')),
  result TEXT,
  startedAt TEXT NOT NULL DEFAULT (datetime('now')),
  completedAt TEXT,
  FOREIGN KEY (scenarioId) REFERENCES scenarios (id) ON DELETE CASCADE
);

-- 스케줄 정보 (시나리오 1개당 최대 1개)
CREATE TABLE schedules (
  id TEXT PRIMARY KEY,
  scenarioId TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  frequency TEXT NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  time TEXT NOT NULL,          -- HH:MM
  dayOfWeek TEXT,              -- MON,TUE,...
  dayOfMonth INTEGER,          -- 1-31
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (scenarioId) REFERENCES scenarios (id) ON DELETE CASCADE
);

-- 스케줄 실행 이력
CREATE TABLE schedule_runs (
  id TEXT PRIMARY KEY,
  scheduleId TEXT NOT NULL,
  executionId TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILURE')),
  startedAt TEXT NOT NULL DEFAULT (datetime('now')),
  completedAt TEXT,
  FOREIGN KEY (scheduleId) REFERENCES schedules (id) ON DELETE CASCADE,
  FOREIGN KEY (executionId) REFERENCES executions (id) ON DELETE CASCADE
);
```

### 데이터베이스 초기화

```typescript
// electron/main.ts
const db = getDatabase(); // singleton
// 내부에서 userData/database/scenably.db 생성 및 테이블 초기화
```

## 📄 주요 페이지 구조

### 메인 대시보드 (`src/app/page.tsx`)
- **기능**: 시나리오 목록 표시, 퀵스타트 가이드 제공
- **컴포넌트**: ScenarioList, QuickStartGuide
- **주요 기능**:
  - 저장된 모든 시나리오 목록 조회
  - "새 시나리오 생성" 버튼으로 시나리오 생성 페이지 이동
  - 초보자용 사용법 가이드

### 시나리오 생성 페이지 (`src/app/scenario/new/page.tsx`)
- **기능**: 새로운 E2E 테스트 시나리오 생성
- **컴포넌트**: ScenarioBuilder
- **주요 기능**:
  - URL 입력 및 시나리오 정보 설정
  - Playwright 브라우저 레코딩
  - 코드 에디터를 통한 수동 작성
  - Electron 환경 체크 (웹에서 접근 시 경고)

### 시나리오 편집 페이지 (`src/app/scenario/edit/page.tsx`)
- **기능**: 기존 시나리오 수정 및 관리
- **컴포넌트**: ScenarioBuilder (scenarioId prop 포함)
- **주요 기능**:
  - 기존 시나리오 데이터 로드
  - 코드 수정 및 재테스트
  - 실행 결과 확인

### 스케줄 목록 페이지 (`src/app/schedules/page.tsx`)
- **기능**: 등록된 스케줄 조회/필터/활성화/비활성화
- **주요 기능**:
  - 주기/도메인/상태 기반 필터링
  - 스케줄 즉시 새로고침
  - 실행 예정 순서 및 최근 상태 확인

### 스케줄 등록/편집 페이지 (`src/app/schedules/new/page.tsx`)
- **기능**: 시나리오별 반복 실행 규칙 등록
- **주요 기능**:
  - `DAILY`/`WEEKLY`/`MONTHLY` 주기 설정
  - 시간, 요일, 일자 입력
  - 활성화 상태와 함께 저장

### 스케줄 상세 페이지 (`src/app/schedules/id/page.tsx`)
- **기능**: 개별 스케줄 설정 및 실행 이력 조회
- **주요 기능**:
  - 스케줄 토글/편집/삭제
  - `schedule_runs` 이력과 `execution` 로그 연결 조회

### 코드 최적화 페이지 (`src/app/test-optimizer/page.tsx`)
- **기능**: Playwright codegen 생성 코드를 안정적인 테스트로 변환
- **컴포넌트**: PlaywrightCodeOptimizer
- **주요 기능**:
  - Raw 레코딩 코드 → 안정적 테스트 코드 변환
  - 대기 조건 추가, 선택자 최적화
  - 최적화된 코드 저장 및 원래 페이지로 복귀

## 🎨 프론트엔드 아키텍처

### React + Zustand 상태 관리

```typescript
// stores/scenario.ts
interface ScenarioStore {
  scenarios: Scenario[]
  currentScenario: Scenario | null

  // Actions
  loadScenarios: () => Promise<void>
  createScenario: (data: ScenarioData) => Promise<void>
  updateScenario: (id: string, data: Partial<ScenarioData>) => Promise<void>
  deleteScenario: (id: string) => Promise<void>
  setCurrentScenario: (scenario: Scenario | null) => void
}

// stores/recording.ts
interface RecordingStore {
  isRecording: boolean
  recordingSession: RecordingSession | null

  // Actions
  startRecording: (url: string) => Promise<void>
  stopRecording: () => Promise<string>
  resetRecording: () => void
}
```

### 컴포넌트 계층 구조

```
App.tsx
├── Layout/
│   ├── Sidebar.tsx (시나리오 목록)
│   ├── Header.tsx (앱 제목, 설정)
│   └── StatusBar.tsx (상태 표시)
├── Scenario/
│   ├── ScenarioList.tsx (시나리오 목록)
│   ├── ScenarioEditor.tsx (코드 편집기)
│   ├── ScenarioRecorder.tsx (레코딩 컨트롤)
│   └── ScenarioExecutor.tsx (실행 & 디버그)
└── UI/
    ├── Button.tsx, Dialog.tsx... (shadcn/ui 컴포넌트)
    └── Toast.tsx (알림 시스템)
```

## 🔧 빌드 & 배포 아키텍처

### 개발 환경

```bash
npm run electron:dev
# ↓
# 1. Vite로 React 앱 빌드 (Hot Reload)
# 2. TypeScript로 Electron 메인 프로세스 컴파일
# 3. Electron 실행 (개발 모드)
```

### 프로덕션 빌드

```bash
npm run dist:win
# ↓
# 1. React 앱 프로덕션 빌드 (Vite)
# 2. Electron 메인 프로세스 빌드 (TypeScript)
# 3. 브라우저 확인 및 설치 (ensure-windows-browsers.js)
# 4. Windows 호환성 래퍼 생성 (create-windows-chrome-wrapper.js)
# 5. Electron Builder로 배포 패키지 생성
```

### 패키징 전략

```json
// package.json - electron-builder 설정
{
  "build": {
    "files": [
      "dist-electron/**/*",  // 빌드된 Electron 파일
      "assets/**/*",         // 앱 에셋
      "browsers/**/*",       // Playwright 브라우저
      "node_modules/@playwright/**/*",
      "node_modules/playwright/**/*",
      "node_modules/better-sqlite3/**/*"
    ],
    "asarUnpack": [
      "node_modules/@playwright/**",
      "node_modules/playwright/**"
    ]
  }
}
```

## 🌐 크로스 플랫폼 호환성

### 브라우저 호환성 전략

1. **macOS 개발/빌드**:
   - 기본적으로 `chromium-1187` (macOS) 다운로드
   - Windows 빌드 시 `chromium-1193` (Windows) 추가 설치
   - Headless Shell을 Windows Chrome으로 래핑

2. **Windows 빌드**:
   - `ensure-windows-browsers.js`로 Windows 브라우저 확인
   - `create-windows-chrome-wrapper.js`로 호환성 래퍼 생성
   - 실제 Windows에서 빌드 시 네이티브 브라우저 사용

3. **크로스 플랫폼 실행**:
   ```typescript
   // 브라우저 감지 우선순위
   const browserPaths = [
     // 1. 번들된 Playwright 브라우저
     path.join(browserPath, 'chromium-1193', 'chrome-win', 'chrome.exe'),
     // 2. Headless Shell (크로스 플랫폼)
     path.join(browserPath, 'chromium_headless_shell-1193', 'chrome-mac', 'headless_shell'),
     // 3. 시스템 Chrome
     'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
   ];
   ```

### 스케줄링 호환성 전략

1. **Windows**:
   - `schtasks` 기반 OS 작업 스케줄러와 실제 연동
   - 등록/토글/삭제 시 DB + 작업 스케줄러 동기화
   - 트리거 시 `--run-schedule=<id>` 모드로 앱 실행 후 자동 종료

2. **macOS / Linux**:
   - 스케줄 정보 저장/조회/편집은 동일하게 지원
   - OS 작업 스케줄러 연동은 수행하지 않음

### 파일 시스템 경로 처리

```typescript
// 플랫폼별 사용자 데이터 경로
const getUserDataPath = (): string => {
  switch (process.platform) {
    case 'win32': return path.join(os.homedir(), 'AppData', 'Roaming', 'Scenably')
    case 'darwin': return path.join(os.homedir(), 'Library', 'Application Support', 'Scenably')
    case 'linux': return path.join(os.homedir(), '.config', 'Scenably')
    default: return path.join(os.homedir(), '.scenably')
  }
}
```

## 🚀 성능 최적화

### 번들 크기 최적화
- **Chromium만 포함**: Firefox, Safari, Edge 제외로 용량 최소화 (~300MB)
- **ASAR 압축**: electron-builder 자동 압축으로 파일 수 감소
- **선택적 패키징**: asarUnpack으로 필요한 바이너리만 포함
- **앱 아이콘**: `assets/icon.png`/`.ico` 통합

### 메모리 관리
- Playwright 프로세스 자동 정리
- 레코딩 세션 타임아웃 처리 (구현 필요)
- SQLite 연결 풀링

### 최적화
- 데이터베이스 지연 초기화
- 브라우저 지연 로딩
- UI 우선 렌더링

## 🔐 보안 고려사항

### Electron 보안
- Context Isolation 활성화
- Node Integration 비활성화
- Preload 스크립트를 통한 안전한 IPC
- CSP (Content Security Policy) 적용

### 데이터 보안
- 로컬 데이터베이스 (외부 서버 불필요)
- 사용자 데이터 앱 샌드박스 내 저장
- API 키 환경 변수 관리

## 🔄 업데이트 전략

### 자동 업데이트 (향후 계획)
```typescript
// electron-updater를 통한 자동 업데이트
import { autoUpdater } from 'electron-updater'

autoUpdater.checkForUpdatesAndNotify()
```

### 데이터베이스 마이그레이션
```typescript
// 앱 버전 업데이트 시 DB 스키마 마이그레이션
const migrationManager = new DatabaseMigrationManager()
await migrationManager.runMigrations(currentVersion, targetVersion)
```

---
