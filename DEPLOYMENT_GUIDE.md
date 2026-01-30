# 데스크탑 앱 배포 가이드

## 현재 완료된 설정

### 1. 로컬 데이터베이스 설정 ✅
- **위치**: 사용자 앱 데이터 폴더 (`~/.config/Scenably` 또는 `%APPDATA%/Scenably`)
- **파일**: `database/scenably.db` (SQLite)
- **자동 초기화**: 앱 실행 시 자동으로 Prisma 마이그레이션 실행

### 2. Electron 빌드 설정 ✅
- **electron-builder** 설정 완료
- **멀티 플랫폼** 빌드 지원 (Windows, macOS, Linux)
- **자동 인스톨러** 생성 (Windows NSIS)

## 개발 환경에서 테스트

### 1. 기본 개발 실행
```bash
# Next.js + Electron 동시 실행
npm run electron:dev
```

### 2. 개별 실행 (디버깅용)
```bash
# 터미널 1: Next.js 서버
npm run dev

# 터미널 2: Electron 앱
npm run build:electron
electron dist-electron/main.js
```

## 배포용 앱 빌드

### 1. 모든 플랫폼
```bash
npm run dist
```

### 2. Windows만 빌드 (권장)
```bash
npm run dist:win
```

### 3. macOS만 빌드
```bash
npm run dist:mac
```

### 4. Linux만 빌드
```bash
npm run dist:linux
```

## 빌드 결과물

빌드 완료 후 `release` 폴더에 생성됩니다:

### Windows
- `Scenably Setup 0.1.0.exe` - 설치 프로그램
- 사용자가 다운로드하여 설치

### macOS
- `Scenably-0.1.0.dmg` - 디스크 이미지
- 드래그&드롭으로 Applications 폴더에 설치

### Linux
- `Scenably-0.1.0.AppImage` - 실행 가능한 단일 파일
- 다운로드 후 실행 권한 부여하여 바로 실행

## 배포 방법

### 방법 1: GitHub Releases (권장)
```bash
# 1. GitHub 저장소에 푸시
git push origin main

# 2. 로컬에서 빌드
npm run dist:win    # Windows용
npm run dist:mac    # macOS용 (맥에서만 가능)
npm run dist:linux  # Linux용

# 3. GitHub에서 새 Release 생성
# 4. release/ 폴더의 파일들을 Release에 업로드
```

### 방법 2: 직접 배포
```bash
# 빌드 후 release/ 폴더의 파일들을
# 웹사이트, 클라우드 스토리지 등에 업로드
```

### 방법 3: 자동 배포 (고급)
- GitHub Actions 설정
- 자동 빌드 및 Release 생성
- 코드 서명 (Windows/macOS용)

## 사용자 다운로드 및 설치

### Windows 사용자
1. `Scenably Setup 0.1.0.exe` 다운로드
2. 실행하여 설치 진행
3. 바탕화면 또는 시작 메뉴에서 실행

### macOS 사용자
1. `Scenably-0.1.0.dmg` 다운로드
2. DMG 파일 열기
3. Scenably 앱을 Applications 폴더로 드래그
4. Launchpad 또는 Applications에서 실행

### Linux 사용자
1. `Scenably-0.1.0.AppImage` 다운로드
2. 실행 권한 부여: `chmod +x Scenably-0.1.0.AppImage`
3. 더블클릭으로 실행

## 데이터베이스 위치

앱이 설치되면 사용자별 데이터는 다음 위치에 저장됩니다:

- **Windows**: `%APPDATA%\\Scenably\\database\\scenably.db`
- **macOS**: `~/Library/Application Support/Scenably/database/scenably.db`
- **Linux**: `~/.config/Scenably/database/scenably.db`

## 다음 단계

### 현재 제한사항
- ⚠️ API Routes가 아직 웹 방식으로 동작 (IPC 변환 필요)
- ⚠️ Next.js 서버가 필요한 상태

### 추천 개선사항
1. **API Routes → IPC 변환** (웹 서버 의존성 제거)
2. **앱 아이콘 추가** (`assets/icon.ico`, `assets/icon.png`)
3. **코드 서명** (Windows/macOS 보안 경고 제거)
4. **자동 업데이트** 기능