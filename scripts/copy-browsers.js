#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// 플랫폼별 Playwright 브라우저 경로
function getPlaywrightBrowsersPath() {
  const platform = process.platform;

  if (platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');
  } else if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright');
  } else {
    return path.join(os.homedir(), '.cache', 'ms-playwright');
  }
}

// 디렉토리 복사 함수
async function copyDirectory(source, destination) {
  try {
    // 대상 디렉토리 생성
    await fs.promises.mkdir(destination, { recursive: true });

    const entries = await fs.promises.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const destinationPath = path.join(destination, entry.name);

      if (entry.isDirectory()) {
        await copyDirectory(sourcePath, destinationPath);
      } else {
        await fs.promises.copyFile(sourcePath, destinationPath);
      }
    }
  } catch (error) {
    console.error(`Error copying ${source} to ${destination}:`, error.message);
  }
}

async function main() {
  console.log('🔄 Copying Playwright browsers for packaging...');

  const browsersPath = getPlaywrightBrowsersPath();
  const projectBrowsersPath = path.join(__dirname, '..', 'browsers');

  console.log(`📂 Source: ${browsersPath}`);
  console.log(`📂 Destination: ${projectBrowsersPath}`);

  // 기존 browsers 폴더 삭제
  if (fs.existsSync(projectBrowsersPath)) {
    await fs.promises.rm(projectBrowsersPath, { recursive: true, force: true });
    console.log('🗑️ Removed existing browsers folder');
  }

  // 브라우저가 존재하는지 확인
  if (!fs.existsSync(browsersPath)) {
    console.log('❌ Playwright browsers not found. Installing...');
    const { spawn } = require('child_process');

    return new Promise((resolve, reject) => {
      const installProcess = spawn('npx', ['playwright', 'install', 'chromium'], {
        stdio: 'inherit',
        shell: true
      });

      installProcess.on('close', async (code) => {
        if (code === 0) {
          console.log('✅ Browser installation complete. Copying...');
          await copyDirectory(browsersPath, projectBrowsersPath);
          console.log('✅ Browsers copied successfully');
          resolve();
        } else {
          console.error('❌ Browser installation failed');
          reject(new Error('Browser installation failed'));
        }
      });
    });
  } else {
    // 브라우저가 이미 존재하면 바로 복사
    await copyDirectory(browsersPath, projectBrowsersPath);
    console.log('✅ Browsers copied successfully');
  }
}

main().catch(console.error);