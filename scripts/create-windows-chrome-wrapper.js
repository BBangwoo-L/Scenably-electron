#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

console.log('🔧 Creating Windows Chrome wrapper...');

const browsersPath = path.join(__dirname, '..', 'browsers');
const chromiumDir = path.join(browsersPath, 'chromium-1193');
const winChromeDir = path.join(chromiumDir, 'chrome-win');

// Windows Chrome 래퍼 스크립트 생성
const chromeExePath = path.join(winChromeDir, 'chrome.exe');

// 실제 headless_shell 경로
const headlessShellPath = path.join(browsersPath, 'chromium_headless_shell-1193', 'chrome-mac', 'headless_shell');

if (fs.existsSync(headlessShellPath)) {
  console.log('✅ Found headless_shell at:', headlessShellPath);

  // Windows .bat 스크립트 생성
  const batContent = `@echo off
REM Windows Chrome wrapper for cross-platform builds
REM This script redirects to headless_shell for compatibility

set HEADLESS_SHELL="${headlessShellPath.replace(/\//g, '\\')}"

if exist "%HEADLESS_SHELL%" (
    echo [Chrome Wrapper] Using headless_shell for compatibility
    "%HEADLESS_SHELL%" %*
) else (
    echo [Chrome Wrapper] Headless shell not found: %HEADLESS_SHELL%
    echo [Chrome Wrapper] Please run 'npm install' to download browsers
    exit /b 1
)
`;

  // Windows용 .bat 파일 생성
  fs.writeFileSync(chromeExePath.replace('.exe', '.bat'), batContent);

  // Unix 실행 스크립트도 생성 (크로스 플랫폼)
  const unixContent = `#!/bin/bash
# Chrome wrapper for cross-platform compatibility

HEADLESS_SHELL="${headlessShellPath}"

if [ -f "$HEADLESS_SHELL" ]; then
    echo "[Chrome Wrapper] Using headless_shell for compatibility"
    exec "$HEADLESS_SHELL" "$@"
else
    echo "[Chrome Wrapper] Headless shell not found: $HEADLESS_SHELL"
    echo "[Chrome Wrapper] Please run 'npm install' to download browsers"
    exit 1
fi
`;

  fs.writeFileSync(chromeExePath.replace('.exe', '.sh'), unixContent);
  fs.chmodSync(chromeExePath.replace('.exe', '.sh'), 0o755);

  // 기존 chrome.exe를 백업하고 심볼릭 링크 생성
  if (fs.existsSync(chromeExePath)) {
    fs.renameSync(chromeExePath, chromeExePath + '.backup');
  }

  // macOS에서는 headless_shell을 chrome.exe로 복사
  fs.copyFileSync(headlessShellPath, chromeExePath);
  fs.chmodSync(chromeExePath, 0o755);

  console.log('✅ Created Windows Chrome wrapper');
  console.log('📄 BAT script:', chromeExePath.replace('.exe', '.bat'));
  console.log('📄 Shell script:', chromeExePath.replace('.exe', '.sh'));
  console.log('🔗 Chrome executable:', chromeExePath);

} else {
  console.log('❌ Headless shell not found at:', headlessShellPath);
  console.log('💡 Run "npm run install-browsers" first');
}