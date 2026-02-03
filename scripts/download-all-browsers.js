#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🌐 Downloading browsers for all platforms...');

// 브라우저 저장 경로 설정
const browsersPath = path.join(__dirname, '..', 'browsers');

// browsers 폴더 생성
if (!fs.existsSync(browsersPath)) {
  fs.mkdirSync(browsersPath, { recursive: true });
}

try {
  // 환경변수 설정하여 로컬 browsers 폴더에 다운로드
  const env = {
    ...process.env,
    PLAYWRIGHT_BROWSERS_PATH: browsersPath
  };

  // 설치된 Playwright 버전 확인
  console.log('🔍 Checking Playwright version...');
  try {
    const playwrightVersion = execSync('npx playwright --version', { encoding: 'utf8', env: env });
    console.log('📋 Playwright version:', playwrightVersion.trim());
  } catch (e) {
    console.log('⚠️ Could not get Playwright version, continuing with installation...');
  }

  console.log('📥 Downloading Chromium for current platform...');
  execSync('npx playwright install chromium', {
    stdio: 'inherit',
    env: env
  });

  // Windows 빌드를 위해 Windows용 Chromium도 다운로드
  if (process.platform !== 'win32') {
    console.log('📥 Downloading Chromium for Windows (cross-platform build)...');
    try {
      // Playwright 버전 1.55.1의 Chromium 1193 Windows 다운로드
      const winUrl = 'https://cdn.playwright.dev/dbazure/download/playwright/builds/chromium/1193/chromium-win32.zip';
      const winDir = path.join(browsersPath, 'chromium-1193-win');
      const zipFile = path.join(browsersPath, 'chromium-win.zip');

      if (!fs.existsSync(winDir)) {
        console.log('🔗 Downloading Windows Chromium manually...');
        execSync(`curl -L -o "${zipFile}" "${winUrl}"`, { stdio: 'inherit' });

        if (fs.existsSync(zipFile)) {
          execSync(`unzip "${zipFile}" -d "${winDir}"`, { stdio: 'inherit' });
          execSync(`rm "${zipFile}"`, { stdio: 'ignore' });

          // 올바른 디렉토리 구조로 이동
          const extractedDir = path.join(winDir, 'chromium-win32');
          if (fs.existsSync(extractedDir)) {
            const targetDir = path.join(browsersPath, 'chromium-1193', 'chrome-win');
            if (!fs.existsSync(targetDir)) {
              execSync(`mv "${extractedDir}" "${targetDir}"`, { stdio: 'inherit' });
            }
          }

          // 임시 디렉토리 정리
          if (fs.existsSync(winDir)) {
            execSync(`rm -rf "${winDir}"`, { stdio: 'ignore' });
          }

          console.log('✅ Windows Chromium downloaded and installed');
        }
      } else {
        console.log('✅ Windows Chromium already exists');
      }
    } catch (error) {
      console.log('⚠️ Windows Chromium download failed, continuing...');
      console.log('   This is optional for cross-platform builds');
    }
  }

  // 설치된 브라우저 버전 확인
  console.log('🔍 Checking installed browser versions...');
  try {
    const browserList = execSync('npx playwright install --dry-run chromium', { encoding: 'utf8', env: env });
    console.log('📋 Browser installation info:', browserList.trim());
  } catch (e) {
    console.log('⚠️ Could not get browser info');
  }

  console.log('🗑️ Cleaning up unnecessary files...');
  // 불필요한 파일들 제거
  const filesToRemove = [
    'chromium_headless_shell-*',
    'ffmpeg-*',
    'firefox-*',
    'webkit-*'
  ];

  filesToRemove.forEach(pattern => {
    try {
      const command = process.platform === 'win32'
        ? `rmdir /s /q "${path.join(browsersPath, pattern)}"`
        : `rm -rf "${path.join(browsersPath, pattern)}"`;

      execSync(command, { stdio: 'ignore' });
    } catch (e) {
      // 파일이 없으면 무시
    }
  });

  // 브라우저 폴더 내용 확인
  const contents = fs.readdirSync(browsersPath);
  console.log('📁 Browser folders:', contents);

  // 브라우저 크기 확인 (Unix 계열에서만)
  if (process.platform !== 'win32') {
    try {
      const size = execSync(`du -sh "${browsersPath}"`, { encoding: 'utf8' });
      console.log('💾 Total size:', size.trim());
    } catch (e) {
      console.log('💾 Size check failed, but browsers are installed');
    }
  }

  console.log('✅ Browser download completed!');

} catch (error) {
  console.error('❌ Browser download failed:', error.message);
  process.exit(1);
}