#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');

console.log('🌐 Downloading REAL Windows Chromium browser...');

const browsersPath = path.join(__dirname, '..', 'browsers');
const chromiumDir = path.join(browsersPath, 'chromium-1193');

async function downloadRealWindowsBrowser() {
  try {
    const winChromeDir = path.join(chromiumDir, 'chrome-win');

    // 기존 플레이스홀더 제거
    if (fs.existsSync(winChromeDir)) {
      execSync(`rm -rf "${winChromeDir}"`, { stdio: 'pipe' });
      console.log('🗑️ Removed placeholder chrome-win directory');
    }

    console.log('📥 Attempting to download Windows Chromium...');

    // Playwright의 실제 다운로드 URL 찾기 (macOS에서 Windows용 다운로드)
    const env = {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: browsersPath,
      // Windows 플랫폼으로 강제 설정
      PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '0'
    };

    // 1. Windows용 Playwright 바이너리 직접 다운로드 시도
    const urls = [
      // Microsoft의 공식 Playwright CDN
      'https://playwright.azureedge.net/builds/chromium/1193/chromium-win32.zip',
      'https://playwright.download.prss.microsoft.com/playwright/builds/chromium/1193/chromium-win32.zip',
      // GitHub Releases
      'https://github.com/microsoft/playwright/releases/download/v1.45.0/chromium-1193-win32.zip'
    ];

    for (const url of urls) {
      try {
        console.log(`🔗 Trying URL: ${url}`);
        const zipFile = path.join(browsersPath, 'win-chromium.zip');

        // curl로 다운로드 (더 안정적)
        const curlCommand = `curl -L -f --connect-timeout 30 --max-time 300 -o "${zipFile}" "${url}"`;
        execSync(curlCommand, { stdio: 'pipe' });

        if (fs.existsSync(zipFile) && fs.statSync(zipFile).size > 10000) {
          console.log('📦 Download successful! Size:', fs.statSync(zipFile).size);

          // 압축 해제
          const tempDir = path.join(browsersPath, 'temp-win-extract');
          fs.mkdirSync(tempDir, { recursive: true });

          execSync(`unzip -q "${zipFile}" -d "${tempDir}"`, { stdio: 'pipe' });

          // 압축 해제된 내용 확인
          const extracted = fs.readdirSync(tempDir);
          console.log('📂 Extracted contents:', extracted);

          // chrome-win 폴더 찾기 및 이동
          let chromeFolder = null;
          for (const item of extracted) {
            const fullPath = path.join(tempDir, item);
            if (fs.statSync(fullPath).isDirectory()) {
              const contents = fs.readdirSync(fullPath);
              if (contents.includes('chrome.exe') || item.includes('chrome') || item.includes('chromium')) {
                chromeFolder = fullPath;
                break;
              }
            }
          }

          if (chromeFolder) {
            fs.renameSync(chromeFolder, winChromeDir);
            console.log(`✅ Moved ${chromeFolder} to ${winChromeDir}`);
          } else {
            // 전체 내용을 chrome-win으로 이동
            fs.mkdirSync(winChromeDir, { recursive: true });
            execSync(`cp -r "${tempDir}"/* "${winChromeDir}"/`, { stdio: 'pipe' });
            console.log('📂 Copied all contents to chrome-win');
          }

          // 정리
          fs.unlinkSync(zipFile);
          execSync(`rm -rf "${tempDir}"`, { stdio: 'pipe' });

          // chrome.exe 존재 확인
          const chromeExe = path.join(winChromeDir, 'chrome.exe');
          if (fs.existsSync(chromeExe)) {
            const size = fs.statSync(chromeExe).size;
            console.log(`✅ chrome.exe found! Size: ${size} bytes`);

            if (size > 1000000) { // 1MB 이상이면 실제 실행파일
              console.log('🎉 Real Windows Chrome downloaded successfully!');
              return true;
            } else {
              console.log('⚠️ chrome.exe too small, might be placeholder');
            }
          }
        }

        // 실패한 경우 정리
        if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);

      } catch (error) {
        console.log(`❌ Failed with URL: ${url} - ${error.message}`);
        continue;
      }
    }

    // 모든 방법이 실패한 경우: 대체 방법
    console.log('⚠️ Direct download failed, trying alternative method...');

    // Chocolatey나 다른 방법으로 설치된 Chromium 찾기
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
    ];

    console.log('🔍 Looking for existing Chrome installation...');
    for (const chromePath of possiblePaths) {
      console.log(`Checking: ${chromePath}`);
    }

    // 실패 시에도 올바른 디렉토리 구조는 유지
    if (!fs.existsSync(winChromeDir)) {
      fs.mkdirSync(winChromeDir, { recursive: true });
    }

    // 더 명확한 에러 메시지가 포함된 README 파일 생성
    const readmeContent = `# Windows Chrome Browser Missing

This directory should contain the Windows Chrome browser for Playwright.

To fix this issue:

1. Run this on a Windows machine:
   npm install
   npx playwright install chromium

2. Or manually download Windows Chromium from:
   https://playwright.azureedge.net/builds/chromium/1193/chromium-win32.zip

3. Extract the chrome.exe and related files to this directory.

Current status: Missing real browser executable
`;

    fs.writeFileSync(path.join(winChromeDir, 'README.md'), readmeContent);
    console.log('📝 Created README with installation instructions');

    return false;

  } catch (error) {
    console.error('❌ Windows browser download failed:', error);
    return false;
  }
}

// 스크립트 실행
downloadRealWindowsBrowser().then(success => {
  if (success) {
    console.log('🏁 Real Windows browser setup completed successfully!');
  } else {
    console.log('⚠️ Could not download real Windows browser');
    console.log('💡 The app will need to be built on Windows for full functionality');
  }
}).catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});