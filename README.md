# Scenably - E2E 테스트 시나리오 빌더

**Scenably**는 Playwright를 기반으로 한 데스크톱 E2E 테스트 자동화 도구입니다. 웹사이트의 End-to-End 테스트 시나리오를 직관적으로 생성하고 관리할 수 있는 Electron 데스크톱 애플리케이션입니다.

## 🚀 주요 기능

- **🎬 Playwright 코드 생성**: 실제 브라우저에서 사용자 인터랙션을 레코딩하여 자동으로 테스트 코드 생성
- **🖥️ 데스크톱 애플리케이션**: 오프라인 환경에서도 동작하며 내부망에서 안전하게 사용 가능
- **💾 로컬 데이터베이스**: SQLite를 사용한 빠르고 안전한 시나리오 관리
- **🐛 디버그 모드**: Playwright UI 모드를 통한 단계별 테스트 디버깅
- **🤖 AI 기반 편집**: Claude AI를 활용한 테스트 시나리오 코드 개선 (추후 구현 예정)
- **📱 크로스 플랫폼**: Windows, macOS, Linux 지원

## 🛠 기술 스택

### 코어 기술
- **Electron 40** - 데스크톱 애플리케이션 프레임워크
- **React 19** + **TypeScript** - 사용자 인터페이스
- **Vite** - 빠른 개발 및 빌드 도구
- **Tailwind CSS 4** - 스타일링
- **Playwright 1.55.1** - E2E 테스트 자동화 엔진

### 상태 관리 및 UI
- **Zustand** - 전역 상태 관리
- **React Hook Form** - 폼 상태 관리
- **Radix UI** - 접근성을 고려한 UI 컴포넌트
- **Sonner** - Toast 알림 시스템

### 데이터베이스
- **SQLite** + **better-sqlite3** - 로컬 데이터베이스
- **electron-log** - 로그 시스템

## 📁 프로젝트 구조

```
Scenably/
├── electron/                     # Electron 메인 프로세스
│   ├── main.ts                   # 앱 진입점 및 윈도우 관리
│   ├── preload.ts                # 보안 컨텍스트 브릿지
│   ├── playwright-electron-recorder.ts  # Playwright 레코딩 엔진
│   └── playwright-electron-debug.ts     # Playwright 디버그 모드
├── src/                          # React 렌더러 프로세스
│   ├── components/               # UI 컴포넌트
│   ├── lib/                      # 유틸리티 및 훅
│   └── stores/                   # Zustand 상태 관리
├── scripts/                      # 빌드 및 배포 스크립트
├── browsers/                     # Playwright 브라우저 (로컬)
└── tests/                        # 생성된 테스트 파일
```

### 주요 모듈

#### Electron 메인 프로세스
- **main.ts**: 앱 라이프사이클 관리, 윈도우 생성, IPC 핸들러
- **playwright-electron-recorder.ts**: 브라우저 레코딩 및 코드 생성
- **playwright-electron-debug.ts**: 디버그 모드 실행

#### 브라우저 관리
- 크로스 플랫폼 브라우저 자동 다운로드 및 설정
- Windows/macOS 호환성을 위한 headless_shell 사용
- 오프라인 환경을 위한 로컬 브라우저 패키징

## ⚙️ 설치 및 개발

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/scenably.git
cd scenably
```

### 2. 의존성 설치
```bash
npm install
```

이 과정에서 `postinstall` 스크립트가 자동으로 실행되어 Playwright 브라우저를 다운로드합니다.

**중요**: 브라우저 파일들은 Git에 포함되지 않으므로, 프로젝트를 처음 설치할 때마다 브라우저 다운로드가 필요합니다.

### 3. 브라우저 설치 확인
만약 브라우저 설치가 실패했다면 수동으로 설치하세요:
```bash
# Chromium만 설치 (권장 - 용량 최적화)
npm run install-browsers

# 또는 직접 명령어 실행
PLAYWRIGHT_BROWSERS_PATH=./browsers npx playwright install chromium
```

**참고**: Firefox, Safari 등 다른 브라우저는 설치하지 않습니다. Chromium만 사용하여 앱 크기를 최적화합니다.

### 4. 환경 변수 설정 (선택사항)
**주의**: AI 기능은 현재 구현되지 않았습니다. 추후 Claude API 연동 예정입니다.
```env
# 추후 구현 예정
CLAUDE_API_KEY=your-claude-api-key-here
```

### 5. 개발 서버 시작
```bash
npm run electron:dev
```

## 🔧 개발 명령어

```bash
# 🚀 개발 모드 실행 (권장)
npm run electron:dev

# 📱 렌더러만 실행 (브라우저에서 UI 확인용)
npm run dev:renderer

# 🏗️ 배포용 빌드
npm run dist              # 모든 플랫폼 (macOS에서만 가능)
npm run dist:win          # Windows 실행파일
npm run dist:mac          # macOS 앱 (macOS에서만)
npm run dist:linux        # Linux AppImage

# 🔧 기타 명령어
npm run build:electron    # Electron 메인 프로세스만 빌드
npm run build:renderer    # React 앱만 빌드
npm run install-browsers  # 브라우저 수동 설치
npm run lint              # 코드 품질 검사
npm run test:e2e          # E2E 테스트 실행
```

## 📖 사용 방법

### 1. 🎬 브라우저 레코딩 (권장)
1. **시나리오 생성**: "새 시나리오" 버튼으로 시나리오 생성
2. **URL 입력**: 테스트할 웹사이트 URL 입력
3. **레코딩 시작**: "코드 생성" 버튼 클릭
4. **브라우저 조작**: 자동으로 열리는 브라우저에서 원하는 액션 수행
5. **코드 생성**: 레코딩 완료 후 자동으로 Playwright 코드 생성
6. **시나리오 저장**: 생성된 코드를 검토하고 저장

### 2. ✏️ 수동 코드 작성
1. **빈 시나리오 생성**: 새 시나리오 생성
2. **직접 코딩**: Playwright 테스트 코드를 직접 작성
3. **AI 개선**: Claude AI를 통해 코드 개선 (추후 구현 예정)

### 3. 🐛 디버그 및 실행
- **실행**: "시나리오 실행" 버튼으로 테스트 실행
- **디버그**: "디버그" 버튼으로 Playwright UI 모드에서 단계별 디버깅
- **결과 확인**: 실행 결과 및 스크린샷 확인

## 🏗 배포

### 데스크톱 앱 빌드 생성
```bash
# Windows용 실행 파일 생성 (크로스 플랫폼 지원)
npm run dist:win
# → release/Scenably Setup 0.1.0.exe (약 300MB)

# macOS용 앱 생성 (macOS에서만 가능)
npm run dist:mac
# → release/Scenably-0.1.0.dmg

# Linux용 AppImage 생성
npm run dist:linux
# → release/Scenably-0.1.0.AppImage

# 모든 플랫폼 빌드 (macOS에서만 가능)
npm run dist
```

### 빌드 특징
- **앱 아이콘**: `assets/icon.png`와 `assets/icon.ico` 사용
- **브라우저 포함**: Chromium만 포함하여 용량 최적화 (~300MB)
- **오프라인 실행**: 인터넷 없이도 완전 동작
- **크로스 플랫폼**: Windows/macOS/Linux 지원

### 사용자 설치
- **Windows**: `.exe` 파일 실행하여 설치
- **macOS**: `.dmg` 파일 열어서 Applications 폴더로 드래그
- **Linux**: `.AppImage` 파일에 실행 권한 부여 후 실행

## 🗃️ 데이터베이스

앱은 사용자별 데이터 디렉토리에 SQLite 데이터베이스를 생성합니다:

- **Windows**: `%APPDATA%\Scenably\database\scenably.db`
- **macOS**: `~/Library/Application Support/Scenably/database/scenably.db`
- **Linux**: `~/.config/Scenably/database/scenably.db`

## 🔧 고급 설정

### 브라우저 설정
앱은 다음 우선순위로 브라우저를 찾아 사용합니다:
1. 앱 내장 Playwright 브라우저 (`browsers/` 디렉토리)
2. 시스템에 설치된 Chrome/Chromium
3. Headless Chrome Shell (크로스 플랫폼 호환용)

### 로그 파일
실행 로그는 다음 위치에 저장됩니다:
- **Windows**: `%APPDATA%\Scenably\logs\`
- **macOS**: `~/Library/Logs/Scenably/`
- **Linux**: `~/.config/Scenably/logs/`

## 🐛 문제 해결

### 일반적인 문제

**1. 브라우저 실행 실패**
```bash
# 브라우저 재설치
npm run install-browsers
```

**2. 데이터베이스 오류**
- 앱 데이터 폴더의 `database/` 디렉토리 삭제 후 앱 재시작

**3. 모듈 오류 (개발 환경)**
```bash
# 네이티브 모듈 재빌드
npm run electron:rebuild
# 또는
npx electron-rebuild
```

**4. 레코딩 세션 멈춤**
- 앱에서 "강제 리셋" 버튼 사용
- 또는 브라우저 프로세스 수동 종료

**5. Footer 요소가 안보임**
- 디스플레이 배율을 줄여야함.


### 개발자 모드
개발 중 문제가 있을 때 Electron DevTools를 열어 디버깅할 수 있습니다:
- **Windows/Linux**: `Ctrl + Shift + I`
- **macOS**: `Cmd + Option + I`

## 🤝 기여하기

1. 프로젝트 포크
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🔗 관련 링크

- [Playwright 공식 문서](https://playwright.dev/)
- [Electron 공식 문서](https://www.electronjs.org/)
- [Claude AI API](https://docs.anthropic.com/)

---

**Scenably**로 웹 애플리케이션의 품질을 향상시키고 테스트 자동화를 경험해보세요! 🚀