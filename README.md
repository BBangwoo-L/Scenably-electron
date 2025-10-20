# 웹사이트 E2E 테스트 관리 서비스

**Website E2E Test Management Service** - 웹 브라우저 자동화와 Claude AI를 결합한 웹 애플리케이션으로, 웹사이트의 End-to-End 테스트 시나리오를 쉽게 생성하고 관리할 수 있습니다.

## 🚀 주요 기능

1. **🌐 URL 입력 및 탐색** - 테스트할 웹사이트 URL을 입력하여 자동으로 테스트 환경 구성
2. **🎭 Playwright 통합** - 실제 브라우저에서 인터랙티브한 E2E 시나리오 생성
3. **💾 시나리오 저장소** - 테스트 시나리오를 데이터베이스에 저장하고 체계적으로 관리
4. **🤖 AI 기반 편집** - Claude API를 활용하여 테스트 시나리오 코드를 지능적으로 수정
5. **▶️ 시나리오 실행** - 저장된 시나리오를 실행하고 결과를 확인

## 🛠 기술 스택

### 코어 프레임워크
- **Next.js 15** - App Router 아키텍처 (`src/app/` 디렉토리 구조)
- **React 19** - TypeScript와 함께 사용
- **Tailwind CSS 4** - 스타일링 (`tw-animate-css` 애니메이션 포함)
- **Turbopack** - 빠른 개발 및 빌드
- **Playwright** - E2E 테스트 자동화
- **Claude API** - AI 기반 시나리오 수정

### UI 컴포넌트
- **shadcn/ui** - "new-york" 스타일로 구성된 컴포넌트 라이브러리
- **Radix UI** - 접근성을 고려한 프리미티브 컴포넌트
- **Lucide React** - 아이콘 라이브러리

### 상태 관리 및 폼
- **Zustand** - 전역 상태 관리
- **React Hook Form** - **Zod** 유효성 검사 및 **@hookform/resolvers**와 함께 사용
- **next-themes** - 테마 관리

### 데이터 레이어
- **Prisma** - 데이터베이스 ORM (SQLite 사용)
- 테스트 시나리오, 실행 결과, 사용자 데이터 저장
- API 라우트를 통한 시나리오 CRUD 작업 및 Playwright 실행
- Claude API 통합을 통한 지능적인 시나리오 수정

## 📁 프로젝트 구조

### 주요 애플리케이션 영역
- **시나리오 빌더** (`src/components/scenario/`) - 테스트 시나리오 생성 및 편집 UI
- **Playwright 통합** (`src/lib/playwright/`) - Playwright 자동화 및 실행 로직
- **AI 서비스** (`src/lib/ai/`) - Claude API 통합 시나리오 수정
- **데이터베이스 모델** (`src/lib/db/`) - 시나리오 및 테스트 결과 데이터 모델

### 주요 파일
- `src/app/layout.tsx` - Geist 폰트가 적용된 루트 레이아웃
- `src/app/page.tsx` - 시나리오 관리 메인 대시보드
- `src/lib/utils.ts` - className 병합을 위한 `cn()` 포함 유틸리티 함수
- `components.json` - 경로 별칭이 포함된 shadcn/ui 구성

### 경로 별칭 (components.json에 구성됨)
- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/hooks` → `src/hooks`
- `@/ui` → `src/components/ui`

## ⚙️ 환경 설정

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.example`을 `.env`로 복사하고 다음 항목을 구성하세요:
```env
DATABASE_URL="file:./dev.db"  # SQLite 데이터베이스 경로
CLAUDE_API_KEY="your-claude-api-key"  # AI 기능을 위한 Claude API 키
```

### 3. 데이터베이스 초기화
```bash
npm run db:push      # 스키마 변경사항을 데이터베이스에 적용
npm run db:generate  # Prisma 클라이언트 생성
```

### 4. 개발 서버 시작
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인하세요.

## 🔧 개발 명령어

- `npm run dev` - Turbopack을 사용한 개발 서버 시작 (http://localhost:3000)
- `npm run build` - Turbopack을 사용한 프로덕션 애플리케이션 빌드
- `npm run start` - 프로덕션 서버 시작
- `npm run lint` - 코드 품질 검사를 위한 ESLint 실행
- `npm run db:generate` - Prisma 클라이언트 생성
- `npm run db:push` - 스키마 변경사항을 데이터베이스에 적용
- `npm run db:migrate` - 데이터베이스 마이그레이션 생성 및 적용
- `npm run test:e2e` - Playwright E2E 테스트 실행

## 🔌 API 엔드포인트

### 시나리오 관리
- `GET /api/scenarios` - 최근 실행 결과와 함께 모든 시나리오 목록 조회
- `POST /api/scenarios` - 새로운 시나리오 생성
- `GET /api/scenarios/[id]` - 실행 기록과 함께 특정 시나리오 조회
- `PUT /api/scenarios/[id]` - 시나리오 업데이트
- `DELETE /api/scenarios/[id]` - 시나리오 삭제
- `POST /api/scenarios/[id]/execute` - 시나리오 테스트 실행
- `POST /api/scenarios/[id]/debug` - 디버그 모드로 시나리오 실행

### 레코딩 및 코드 생성
- `POST /api/recording/start` - Playwright 레코딩 세션 시작
- `POST /api/recording/stop` - 레코딩 중지 및 생성된 코드 반환
- `GET /api/recording/stop?sessionId=` - 레코딩 세션 상태 조회

### AI 통합
- `POST /api/ai/modify` - Claude API를 사용한 시나리오 코드 수정

## 📖 사용법

### 방법 1: 🎯 인터랙티브 템플릿 생성 (초보자 추천)
1. **URL 입력**: 테스트할 웹사이트 URL 입력
2. **템플릿 생성**: "템플릿" 탭 → "인터랙티브 템플릿 생성" 클릭
3. **코드 커스터마이징**: 생성된 템플릿을 특정 테스트 케이스에 맞게 편집
4. **AI 향상**: "AI로 수정하기"를 사용하여 추가 개선
5. **저장 및 실행**: 시나리오 저장 후 테스트 실행

**특징:**
- 포괄적인 인터랙티브 템플릿 생성
- 일반적인 테스트 패턴 포함 (폼, 네비게이션, 접근성)
- 커스터마이징을 위한 훌륭한 시작점
- 브라우저 자동화 불필요

### 방법 2: 🎬 직접 브라우저 레코딩 (복잡한 상호작용에 최적)
1. **URL 입력**: 테스트할 웹사이트 URL 입력
2. **레코딩 시작**: "레코딩" 탭 → "레코딩 시작" 클릭
3. **상호작용**: 브라우저가 열리면 → 웹사이트에서 액션 수행
4. **레코딩 중지**: "저장 후 중지" 또는 "취소" 선택 → 코드 자동 생성
5. **저장 및 실행**: 생성된 코드 검토, 시나리오 저장, 테스트 실행

**특징:**
- 실제 사용자 상호작용을 위한 실제 브라우저 열기
- 클릭, 폼 입력, 네비게이션 레코딩
- 정확한 선택자 및 대기 조건 생성
- 복잡한 사용자 워크플로우에 완벽

**레코딩 중 옵션:**
- **저장 후 중지**: 레코딩 내용을 코드로 변환하여 저장
- **취소**: 레코딩을 중단하고 내용을 저장하지 않음
- **강제 리셋**: 세션이 문제가 있을 때 UI 상태 강제 초기화

### 방법 3: ✏️ 수동 코드 작성 (고급 사용자용)
1. **URL 입력**: 테스트할 웹사이트 URL 입력
2. **코드 작성**: Playwright 테스트 코드 직접 작성
3. **AI 향상**: "AI로 수정하기"를 사용하여 개선
4. **저장 및 실행**: 시나리오 저장 후 테스트 실행

**특징:**
- 테스트 코드의 완전한 제어
- 사용자 정의 테스트 로직 및 어설션
- 고급 Playwright 기능 사용
- Playwright 지식 필요

## 🐛 디버그 기능

테스트가 실패한 경우 "디버그" 버튼을 클릭하여:
- Playwright UI 모드에서 단계별 테스트 실행
- 브라우저에서 직접 상호작용하며 문제 해결
- 실시간으로 테스트 단계 확인 및 수정

## 🎨 코드 스타일

- Next.js core-web-vitals 및 TypeScript 규칙이 적용된 ESLint
- 조건부 className 처리를 위해 `clsx` 및 `tailwind-merge` 사용
- Radix UI 프리미티브와 shadcn/ui 패턴을 따르는 컴포넌트 아키텍처

## 🤝 기여하기

1. 프로젝트를 포크하세요
2. 기능 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 열어주세요

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🆘 문제 해결

### 일반적인 문제들

1. **레코딩 브라우저가 닫히지 않는 경우**
   - "강제 리셋" 버튼 사용
   - 수동으로 브라우저 프로세스 종료

2. **AI 수정이 작동하지 않는 경우**
   - `CLAUDE_API_KEY` 환경 변수 확인
   - API 키의 유효성 및 권한 확인

3. **데이터베이스 연결 오류**
   - `DATABASE_URL` 환경 변수 확인
   - `npm run db:push` 명령어로 데이터베이스 재초기화

4. **컴포넌트 리렌더링으로 인한 테스트 실패**
   - 문제: URL path 변경 시 컴포넌트가 리렌더링되어 레코딩된 시나리오 코드가 진행되는 동안 컴포넌트가 다시 그려져 값이 사라지는 현상
   - 해결: 특정 문구나 요소가 렌더링될 때까지 기다리는 방식으로 해결
   ```typescript
   // 예시: 특정 텍스트가 나타날 때까지 기다리기
   await page.getByText('특정 문구').waitFor();
   ```
   - 주의사항: Toast 팝업의 경우 팝업이 닫힐 때까지 기다려야 하는 단점이 있음

더 많은 도움이 필요하시면 GitHub Issues에 문의해주세요.