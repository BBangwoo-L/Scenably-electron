# Electron 데스크탑 앱 변환 가이드

## 1단계: 기본 Electron 설정

### 설치한 패키지
```bash
npm install --save-dev electron electron-builder electron-devtools-installer concurrently wait-on
```

### 생성한 파일들

#### `electron/main.ts` - Electron 메인 프로세스
- BrowserWindow를 생성하여 Next.js 앱을 로드
- 개발 모드에서는 `http://localhost:3000` 접속
- 빌드 모드에서는 정적 파일 로드

#### `electron/preload.ts` - Preload 스크립트
- 렌더러 프로세스와 메인 프로세스 간의 안전한 통신을 위한 설정
- 현재는 기본 구조만 설정

### package.json 수정사항
- `main` 필드 추가: `"dist-electron/main.js"`
- 새로운 스크립트 추가:
  - `electron:dev`: 개발 모드에서 Electron 실행
  - `electron:pack`: 프로덕션 빌드 및 패키징
  - `build:electron`: Electron 파일들 컴파일

## 개발 환경에서 테스트하는 방법

### 1. Next.js 개발 서버 + Electron 실행
```bash
npm run electron:dev
```
이 명령어는:
1. Next.js 개발 서버를 시작합니다 (`npm run dev`)
2. localhost:3000이 준비될 때까지 기다립니다
3. Electron 파일들을 컴파일합니다
4. Electron 앱을 실행합니다

### 2. 개별 실행 (디버깅용)
터미널 2개를 사용하여:

터미널 1:
```bash
npm run dev
```

터미널 2:
```bash
npm run build:electron
electron dist-electron/main.js
```

### 현재 상태
- ✅ 기본 Electron 설정 완료
- ✅ 개발 환경 스크립트 설정
- 🔄 다음 단계: 커밋 후 추가 기능 구현

### 다음 단계 예정
1. 메뉴 바 추가
2. 파일 다이얼로그 기능
3. Windows용 빌드 설정
4. 아이콘 및 앱 메타데이터 설정