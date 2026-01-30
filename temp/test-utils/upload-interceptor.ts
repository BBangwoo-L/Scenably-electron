const { getCacheManager } = require('./file-cache-manager');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * 페이지에 파일 업로드 감지기를 설정
 */
async function setupFileUploadInterceptor(page) {
  const cacheManager = getCacheManager();
  const uploadedFiles = [];

  console.log('🔍 파일 업로드 감지기 설정 중...');

  // 파일 선택 다이얼로그 감지
  page.on('filechooser', async (fileChooser) => {
    try {
      console.log('📁 파일 선택 다이얼로그 감지됨');

      const files = fileChooser.files();
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            console.log('📦 선택된 파일:', file.name, `(${Math.round(file.size() / 1024)}KB)`);

            // 임시 파일로 저장
            const tempPath = path.join(os.tmpdir(), `temp_upload_${Date.now()}_${file.name}`);
            const buffer = await file.createReadStream();
            await fs.writeFile(tempPath, buffer);

            // 캐시에 저장
            const cachedPath = await cacheManager.cacheFile(tempPath, file.name);

            uploadedFiles.push({
              originalName: file.name,
              cachedPath: cachedPath,
              size: file.size(),
              type: file.type()
            });

            // 임시 파일 삭제
            await fs.unlink(tempPath).catch(() => {});

            console.log('✅ 파일 캐싱 완료:', file.name);

          } catch (error) {
            console.error('❌ 파일 처리 실패:', file.name, error);
          }
        }
      }

      // 원래 파일 선택 진행
      await fileChooser.setFiles(files);

    } catch (error) {
      console.error('파일 선택 처리 중 오류:', error);
    }
  });

  // 드래그 앤 드롭 감지
  await page.addInitScript(() => {
    let uploadDetector = null;

    // 파일 input 변화 감지
    const observeFileInputs = () => {
      const fileInputs = document.querySelectorAll('input[type="file"]');

      fileInputs.forEach(input => {
        if (input.dataset.uploadWatched) return;
        input.dataset.uploadWatched = 'true';

        input.addEventListener('change', async (event) => {
          const files = event.target.files;
          if (files && files.length > 0) {
            console.log('🎯 파일 input 변화 감지:', files.length, '개 파일');

            for (const file of files) {
              // 파일 정보를 전역으로 저장 (레코딩에서 접근 가능)
              window.__uploadedFiles = window.__uploadedFiles || [];
              window.__uploadedFiles.push({
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
              });

              console.log('📋 업로드 파일 정보 저장:', file.name);
            }
          }
        });
      });
    };

    // 초기 실행
    observeFileInputs();

    // DOM 변화 감지하여 새로운 파일 input 모니터링
    const observer = new MutationObserver(() => {
      observeFileInputs();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 드래그 앤 드롭 감지
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      document.addEventListener(eventName, (e) => {
        if (eventName === 'drop' && e.dataTransfer.files.length > 0) {
          console.log('🎯 드래그 앤 드롭 파일 감지:', e.dataTransfer.files.length, '개 파일');

          for (const file of e.dataTransfer.files) {
            window.__uploadedFiles = window.__uploadedFiles || [];
            window.__uploadedFiles.push({
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified
            });
          }
        }
      }, false);
    });
  });

  // 페이지에서 업로드된 파일 정보 가져오기
  page.getUploadedFiles = async () => {
    const pageFiles = await page.evaluate(() => {
      return window.__uploadedFiles || [];
    });

    return {
      pageFiles,
      cachedFiles: uploadedFiles
    };
  };

  console.log('✅ 파일 업로드 감지기 설정 완료');
  return uploadedFiles;
}

/**
 * 파일 업로드를 실제 캐시된 파일로 처리
 */
async function uploadCachedFile(page, originalFileName, fileType = null) {
  const cacheManager = getCacheManager();

  try {
    console.log('🔍 캐시된 파일 검색:', originalFileName, fileType ? `(${fileType})` : '');

    // 캐시에서 파일 찾기
    let cachedPath = cacheManager.findCachedFile(originalFileName, fileType);

    // 파일을 찾지 못했으면 타입별 최신 파일 사용
    if (!cachedPath && fileType) {
      cachedPath = cacheManager.getLatestFileByType(fileType);
      if (cachedPath) {
        console.log('📋 타입별 최신 파일 사용:', fileType);
      }
    }

    if (!cachedPath) {
      console.warn('❌ 적절한 캐시 파일을 찾을 수 없음:', originalFileName);
      return false;
    }

    // 파일 input 찾기 및 업로드
    const fileInputs = await page.locator('input[type="file"]').all();

    let visibleFileInput = null;
    let hiddenFileInput = null;

    for (const input of fileInputs) {
      try {
        const isVisible = await input.isVisible();
        if (isVisible && !visibleFileInput) {
          visibleFileInput = input;
        } else if (!isVisible && !hiddenFileInput) {
          hiddenFileInput = input;
        }

        if (visibleFileInput && hiddenFileInput) {
          break;
        }
      } catch (error) {
        continue;
      }
    }

    const targetInput = visibleFileInput || hiddenFileInput || fileInputs[0];

    if (!targetInput) {
      console.warn('❌ 파일 input을 찾을 수 없습니다');
      return false;
    }

    // 캐시된 파일로 업로드
    await targetInput.setInputFiles(cachedPath);
    console.log('✅ 캐시된 파일 업로드 완료:', cachedPath);

    return true;

  } catch (error) {
    console.error('❌ 캐시된 파일 업로드 실패:', error);
    return false;
  }
}

// CommonJS export
module.exports = {
  setupFileUploadInterceptor,
  uploadCachedFile
};