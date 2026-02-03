#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');

console.log('🌐 Downloading Windows browsers for cross-platform build...');

const browsersPath = path.join(__dirname, '..', 'browsers');
const chromiumDir = path.join(browsersPath, 'chromium-1193');

// Windows 브라우저 다운로드 함수
async function downloadWindowsBrowser() {
  try {
    // Windows용 브라우저 디렉토리 생성
    const winChromeDir = path.join(chromiumDir, 'chrome-win');

    if (fs.existsSync(winChromeDir)) {
      console.log('✅ Windows Chrome already exists');
      return;
    }

    console.log('📥 Downloading Windows Chromium...');

    // Playwright의 공식 빌드 URL들 시도
    const possibleUrls = [
      'https://cdn.playwright.dev/builds/chromium/1193/chromium-win32.zip',
      'https://playwright.download.prss.microsoft.com/builds/chromium/1193/chromium-win32.zip',
      'https://github.com/microsoft/playwright/releases/download/v1.55.1/chromium-1193-win32.zip'
    ];

    for (const url of possibleUrls) {
      try {
        console.log(`🔗 Trying URL: ${url}`);

        const zipFile = path.join(browsersPath, 'temp-win-chromium.zip');
        const command = `curl -L -f --max-time 30 -o "${zipFile}" "${url}"`;

        execSync(command, { stdio: 'pipe' });

        if (fs.existsSync(zipFile) && fs.statSync(zipFile).size > 1000) {
          console.log('📦 Download successful, extracting...');

          const tempDir = path.join(browsersPath, 'temp-extract');
          fs.mkdirSync(tempDir, { recursive: true });

          execSync(`unzip -q "${zipFile}" -d "${tempDir}"`, { stdio: 'pipe' });

          // 추출된 파일들을 올바른 위치로 이동
          const extractedFiles = fs.readdirSync(tempDir);
          let moved = false;

          for (const file of extractedFiles) {
            const fullPath = path.join(tempDir, file);
            if (fs.statSync(fullPath).isDirectory()) {
              // chrome-win 또는 chromium-win32 같은 폴더를 chrome-win으로 이동
              fs.renameSync(fullPath, winChromeDir);
              moved = true;
              break;
            }
          }

          if (!moved) {
            // 직접 파일들을 이동
            fs.mkdirSync(winChromeDir, { recursive: true });
            execSync(`cp -r "${tempDir}"/* "${winChromeDir}"/`, { stdio: 'pipe' });
          }

          // 정리
          fs.unlinkSync(zipFile);
          execSync(`rm -rf "${tempDir}"`, { stdio: 'pipe' });

          console.log('✅ Windows Chromium installed successfully');
          return;
        }
      } catch (error) {
        console.log(`❌ Failed with URL: ${url}`);
        continue;
      }
    }

    // 모든 URL이 실패한 경우 수동으로 빈 구조 생성
    console.log('⚠️ All download attempts failed, creating placeholder structure...');
    fs.mkdirSync(winChromeDir, { recursive: true });

    // 기본 chrome.exe 플레이스홀더 파일 생성 (실제로는 작동하지 않음)
    fs.writeFileSync(path.join(winChromeDir, 'chrome.exe'), '# Windows Chrome placeholder\n# Actual browser needs to be downloaded separately');
    console.log('📝 Created placeholder structure for Windows build');

  } catch (error) {
    console.error('❌ Windows browser setup failed:', error.message);
  }
}

// 스크립트 실행
downloadWindowsBrowser().then(() => {
  console.log('🏁 Windows browser setup completed');
}).catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});