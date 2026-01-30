const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// 간단한 PNG 이미지의 Base64 데이터 (1x1 투명 픽셀)
const TRANSPARENT_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

// PDF 헤더 시그니처를 포함한 간단한 PDF 파일
const SIMPLE_PDF_BASE64 = 'JVBERi0xLjQKJcfsj6IKOSAwIG9iago8PgovVHlwZSAvQ2F0YWxvZwovUGFnZXMgNiAwIFIKPj4KZW5kb2JqCjUgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCA2IDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQo+PgplbmRvYmoKNiAwIG9iago8PAovVHlwZSAvUGFnZXMKL0NvdW50IDEKL0tpZHMgWzUgMCBSXQo+PgplbmRvYmoKeHJlZgowIDcKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNzQgMDAwMDAgbiAKMDAwMDAwMDEyMCAwMDAwMCBuIAowMDAwMDAwMTc3IDAwMDAwIG4gCjAwMDAwMDAyMzYgMDAwMDAgbiAKMDAwMDAwMDMxNCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDcKL1Jvb3QgOSAwIFIKPj4Kc3RhcnR4cmVmCjM3MQolJUVPRg==';

interface TestFileOptions {
  filename?: string;
  extension?: string;
  size?: 'small' | 'medium' | 'large';
  content?: string;
}

class TestFileManager {
  private createdFiles: string[] = [];

  /**
   * 테스트용 이미지 파일 생성
   */
  async createTestImage(options: TestFileOptions = {}): Promise<string> {
    const {
      filename = 'test-image',
      extension = 'png',
      size = 'small'
    } = options;

    let base64Content = TRANSPARENT_PNG_BASE64;

    // 크기에 따른 이미지 데이터 조정 (실제로는 동일한 이미지이지만 개념적으로)
    if (size === 'medium') {
      // 중간 크기의 경우 동일한 이미지 데이터 사용
      base64Content = TRANSPARENT_PNG_BASE64;
    } else if (size === 'large') {
      // 큰 크기의 경우 동일한 이미지 데이터 사용
      base64Content = TRANSPARENT_PNG_BASE64;
    }

    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, `${filename}-${Date.now()}.${extension}`);

    const buffer = Buffer.from(base64Content, 'base64');
    await fs.writeFile(filePath, buffer);

    this.createdFiles.push(filePath);
    return filePath;
  }

  /**
   * 테스트용 PDF 파일 생성
   */
  async createTestPDF(options: TestFileOptions = {}): Promise<string> {
    const { filename = 'test-document' } = options;

    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, `${filename}-${Date.now()}.pdf`);

    const buffer = Buffer.from(SIMPLE_PDF_BASE64, 'base64');
    await fs.writeFile(filePath, buffer);

    this.createdFiles.push(filePath);
    return filePath;
  }

  /**
   * 테스트용 텍스트 파일 생성
   */
  async createTestTextFile(options: TestFileOptions = {}): Promise<string> {
    const {
      filename = 'test-document',
      extension = 'txt',
      content = 'This is a test file for automated testing.'
    } = options;

    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, `${filename}-${Date.now()}.${extension}`);

    await fs.writeFile(filePath, content, 'utf8');

    this.createdFiles.push(filePath);
    return filePath;
  }

  /**
   * 특정 크기의 테스트 파일 생성 (바이트 단위)
   */
  async createTestFileWithSize(sizeInBytes: number, options: TestFileOptions = {}): Promise<string> {
    const {
      filename = 'test-file',
      extension = 'bin'
    } = options;

    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, `${filename}-${Date.now()}.${extension}`);

    const buffer = Buffer.alloc(sizeInBytes, 0);
    await fs.writeFile(filePath, buffer);

    this.createdFiles.push(filePath);
    return filePath;
  }

  /**
   * 잘못된 형식의 테스트 파일 생성 (네거티브 테스트용)
   */
  async createInvalidFile(options: TestFileOptions = {}): Promise<string> {
    const {
      filename = 'invalid-file',
      extension = 'png'  // PNG 확장자이지만 실제로는 텍스트 내용
    } = options;

    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, `${filename}-${Date.now()}.${extension}`);

    await fs.writeFile(filePath, 'This is not a valid image file', 'utf8');

    this.createdFiles.push(filePath);
    return filePath;
  }

  /**
   * 생성된 모든 테스트 파일 정리
   */
  async cleanup(): Promise<void> {
    const cleanupPromises = this.createdFiles.map(async (filePath) => {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // 파일이 이미 삭제되었거나 존재하지 않는 경우 무시
        console.warn(`Failed to cleanup test file: ${filePath}`, error);
      }
    });

    await Promise.all(cleanupPromises);
    this.createdFiles = [];
  }

  /**
   * 파일 존재 여부 확인
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 생성된 파일 목록 반환
   */
  getCreatedFiles(): string[] {
    return [...this.createdFiles];
  }
}

// 전역 인스턴스로 사용할 수 있는 헬퍼 함수들
const testFileHelpers = {
  async createQuickTestImage(): Promise<string> {
    const manager = new TestFileManager();
    return await manager.createTestImage();
  },

  async createQuickTestPDF(): Promise<string> {
    const manager = new TestFileManager();
    return await manager.createTestPDF();
  },

  async createQuickTestFile(type: 'image' | 'pdf' | 'text' = 'image'): Promise<string> {
    const manager = new TestFileManager();

    switch (type) {
      case 'image':
        return await manager.createTestImage();
      case 'pdf':
        return await manager.createTestPDF();
      case 'text':
        return await manager.createTestTextFile();
      default:
        return await manager.createTestImage();
    }
  }
};

/**
 * 조건부 렌더링으로 인한 DOM 변화에 안정적으로 대응하는 클릭 함수
 * @param page - Playwright page 객체
 * @param selector - 클릭할 요소의 선택자 (getByRole, getByText 등)
 * @param options - 클릭 옵션
 * @returns Promise<boolean> - 클릭 성공 여부
 */
async function stableClick(page, selector, options = {}) {
  const {
    maxRetries = 3,
    waitTime = 1000,
    verifyClick = null // 클릭 후 확인할 조건 (함수)
  } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🖱️ 클릭 시도 ${attempt}/${maxRetries}`);

      // 요소가 나타날 때까지 대기
      await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });

      // DOM이 안정화될 때까지 잠시 대기
      await page.waitForTimeout(200);

      // 클릭 실행
      const element = page.locator(selector);
      await element.click({ force: false, timeout: 3000 });

      console.log(`✅ 클릭 성공! (시도 ${attempt})`);

      // 클릭 후 DOM 변화 대기
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(waitTime);

      // 클릭 효과 검증 (옵션)
      if (verifyClick && typeof verifyClick === 'function') {
        const isVerified = await verifyClick(page);
        if (!isVerified) {
          console.warn(`❌ 클릭은 성공했지만 예상 결과가 나타나지 않음 (시도 ${attempt})`);
          if (attempt < maxRetries) continue;
          return false;
        }
        console.log(`✅ 클릭 효과 검증 완료!`);
      }

      return true;

    } catch (error) {
      console.warn(`❌ 클릭 실패 (시도 ${attempt}/${maxRetries}):`, error.message);

      if (attempt < maxRetries) {
        // 재시도 전 대기
        await page.waitForTimeout(waitTime);

        // DOM이 다시 안정화되기를 기다림
        try {
          await page.waitForLoadState('networkidle', { timeout: 3000 });
        } catch {
          // networkidle 실패해도 계속 진행
        }
      }
    }
  }

  console.error(`❌ 모든 클릭 시도 실패!`);
  return false;
}

/**
 * getByRole을 사용한 안정적인 클릭 (가장 많이 사용되는 패턴)
 */
async function stableClickByRole(page, role, options = {}) {
  const { name, maxRetries = 3, waitTime = 1000, ...clickOptions } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🖱️ 클릭 시도 ${attempt}/${maxRetries}`);

      let element;
      if (name) {
        element = page.getByRole(role, { name: name });
      } else {
        element = page.getByRole(role);
      }

      // 요소가 나타날 때까지 대기
      await element.waitFor({ state: 'visible', timeout: 5000 });

      // DOM이 안정화될 때까지 잠시 대기
      await page.waitForTimeout(200);

      // 클릭 실행
      await element.click({ force: false, timeout: 3000 });

      console.log(`✅ 클릭 성공! (시도 ${attempt})`);

      // 클릭 후 DOM 변화 대기
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(waitTime);

      return true;

    } catch (error) {
      console.warn(`❌ 클릭 실패 (시도 ${attempt}/${maxRetries}):`, error.message);

      if (attempt < maxRetries) {
        // 재시도 전 대기
        await page.waitForTimeout(waitTime);

        // DOM이 다시 안정화되기를 기다림
        try {
          await page.waitForLoadState('networkidle', { timeout: 3000 });
        } catch {
          // networkidle 실패해도 계속 진행
        }
      }
    }
  }

  console.error(`❌ 모든 클릭 시도 실패!`);
  return false;
}

/**
 * 페이지에 파일을 자동으로 업로드하는 공통 함수 (실제 캐시된 파일 사용)
 * @param page - Playwright page 객체
 * @param fileType - 업로드할 파일 타입 ('image', 'pdf', 'text')
 * @param options - 파일 옵션 (filename 등)
 * @returns Promise<boolean> - 업로드 성공 여부
 */
async function uploadFileToPage(page, fileType = 'image', options = {}) {
  // 변수들을 함수 최상단에 선언 (finally 블록에서 접근 가능하도록)
  let isTemporaryFile = false;
  let fileManager: TestFileManager | null = null;

  try {
    // 캐시 매니저 및 업로드 인터셉터 로드
    const { getCacheManager } = require('./file-cache-manager');
    const { uploadCachedFile } = require('./upload-interceptor');

    const cacheManager = getCacheManager();
    const { filename } = options;

    console.log('🔍 실제 캐시된 파일로 업로드 시도:', fileType, filename || '(타입별 최신 파일)');

    // 1차: 파일명으로 캐시 검색
    let cachedPath = null;
    if (filename) {
      cachedPath = cacheManager.findCachedFile(filename, fileType);
    }

    // 2차: 파일 타입별 최신 파일 사용
    if (!cachedPath) {
      cachedPath = cacheManager.getLatestFileByType(fileType);
    }

    // 3차: 캐시된 파일이 없으면 TestFileManager로 임시 파일 생성
    let filePath = cachedPath;

    if (!filePath) {
      console.log('⚠️ 캐시된 파일이 없어 임시 파일 생성:', fileType);
      fileManager = new TestFileManager();

      switch (fileType.toLowerCase()) {
        case 'image':
          filePath = await fileManager.createTestImage({
            filename: filename || 'test-image',
            extension: 'png'
          });
          break;
        case 'pdf':
          filePath = await fileManager.createTestPDF({
            filename: filename || 'test-document'
          });
          break;
        case 'text':
          filePath = await fileManager.createTestTextFile({
            filename: filename || 'test-document',
            extension: 'txt'
          });
          break;
        default:
          filePath = await fileManager.createTestImage({
            filename: filename || 'test-image',
            extension: 'png'
          });
      }
      isTemporaryFile = true;
    } else {
      console.log('✅ 캐시된 파일 사용:', filePath);
    }

    // 숨겨진 파일 input 자동 감지 및 업로드
    const fileInputs = await page.locator('input[type="file"]').all();

    let visibleFileInput = null;
    let hiddenFileInput = null;

    // 순차적으로 각 input의 가시성 확인
    for (const input of fileInputs) {
      try {
        const isVisible = await input.isVisible();
        if (isVisible && !visibleFileInput) {
          visibleFileInput = input;
        } else if (!isVisible && !hiddenFileInput) {
          hiddenFileInput = input;
        }

        // 둘 다 찾았으면 중단
        if (visibleFileInput && hiddenFileInput) {
          break;
        }
      } catch (error) {
        console.warn('파일 input 확인 중 오류:', error.message);
        continue;
      }
    }

    const targetInput = visibleFileInput || hiddenFileInput || fileInputs[0];
    if (!targetInput) {
      console.warn('파일 input을 찾을 수 없습니다.');
      return false;
    }

    // 파일 업로드 시도
    await targetInput.setInputFiles(filePath);

    // 파일 업로드 검증 및 재시도 로직
    let uploadSuccess = false;
    let retryCount = 0;
    const maxRetries = 3;

    while (!uploadSuccess && retryCount < maxRetries) {
      // 파일이 제대로 들어갔는지 확인
      const uploadedFiles = await targetInput.evaluate((input) => {
        return {
          fileCount: input.files?.length || 0,
          fileName: input.files?.[0]?.name || '',
          fileSize: input.files?.[0]?.size || 0
        };
      });

      console.log(`업로드 시도 ${retryCount + 1}: 파일 수=${uploadedFiles.fileCount}, 파일명=${uploadedFiles.fileName}`);

      if (uploadedFiles.fileCount > 0) {
        console.log('✅ 파일 업로드 성공!');
        uploadSuccess = true;
      } else {
        console.warn(`❌ 파일 업로드 실패 (시도 ${retryCount + 1}/${maxRetries})`);
        retryCount++;

        if (retryCount < maxRetries) {
          // 잠시 대기 후 재시도
          await page.waitForTimeout(500);
          console.log('🔄 파일 업로드 재시도 중...');

          // 다른 input 요소들도 시도해보기
          if (retryCount === 1 && hiddenFileInput && targetInput !== hiddenFileInput) {
            console.log('숨겨진 input으로 재시도...');
            await hiddenFileInput.setInputFiles(filePath);
            const retryResult = await hiddenFileInput.evaluate((input) => input.files?.length || 0);
            if (retryResult > 0) {
              console.log('✅ 숨겨진 input으로 업로드 성공!');
              uploadSuccess = true;
            }
          } else if (retryCount === 2 && visibleFileInput && targetInput !== visibleFileInput) {
            console.log('보이는 input으로 재시도...');
            await visibleFileInput.setInputFiles(filePath);
            const retryResult = await visibleFileInput.evaluate((input) => input.files?.length || 0);
            if (retryResult > 0) {
              console.log('✅ 보이는 input으로 업로드 성공!');
              uploadSuccess = true;
            }
          } else {
            // 동일한 input으로 재시도
            await targetInput.setInputFiles(filePath);
          }
        }
      }
    }

    if (!uploadSuccess) {
      console.error('❌ 모든 재시도 실패: 파일 업로드를 완료할 수 없습니다.');
    }

    return uploadSuccess;

  } catch (error) {
    console.error('파일 업로드 중 오류 발생:', error);
    return false;
  } finally {
    // 임시 파일인 경우에만 정리
    if (isTemporaryFile && fileManager) {
      await fileManager.cleanup();
    }
  }
}

/**
 * 요소 설정에서 사용할 수 있는 클릭 옵션 인터페이스
 */
interface ClickElementConfig {
  useStableClick: boolean;
  maxRetries?: number;
  waitTime?: number;
  verifyClick?: boolean;
}

/**
 * 정밀한 버튼 클릭 헬퍼 함수 (위치 기반)
 */
async function clickPreciseButton(page, buttonText, options = {}) {
  const timeout = options.timeout || 3000;
  try {
    console.log('🎯 "' + buttonText + '" 버튼을 정밀하게 찾는 중...');

    // 모든 해당 텍스트를 가진 버튼들 찾기
    const buttons = await page.getByRole('button', { name: buttonText }).all();
    console.log('📍 "' + buttonText + '" 버튼 ' + buttons.length + '개 발견');

    if (buttons.length === 0) {
      console.warn('❌ "' + buttonText + '" 버튼을 찾을 수 없습니다.');
      return false;
    }

    if (buttons.length === 1) {
      console.log('✅ 버튼이 1개뿐이므로 바로 클릭');

      // 클릭 전 상태 검증
      const button = buttons[0];
      const isEnabled = await button.isEnabled();
      const isVisible = await button.isVisible();

      console.log('🔍 버튼 상태 - 활성화:', isEnabled, ', 표시:', isVisible);

      if (!isEnabled) {
        console.warn('⚠️ 버튼이 비활성화 상태입니다. 대안 방법들을 시도합니다...');

        // 방법 1: 잠시 대기 후 활성화 확인
        console.log('🕐 1초 대기 후 버튼 활성화 재확인...');
        await page.waitForTimeout(1000);
        const isEnabledAfterWait = await button.isEnabled();

        if (isEnabledAfterWait) {
          console.log('✅ 대기 후 버튼이 활성화되었습니다!');
          await Promise.race([
            button.click({ timeout: timeout }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('클릭 타임아웃')), timeout)
            )
          ]);
          console.log('✅ 클릭 완료!');
          return true;
        }

        // 방법 2: force 클릭 시도
        console.log('🔨 강제 클릭 시도...');
        try {
          await Promise.race([
            button.click({ force: true, timeout: timeout }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('강제 클릭 타임아웃')), timeout)
            )
          ]);
          console.log('✅ 강제 클릭 성공!');
          return true;
        } catch (forceError) {
          console.log('❌ 강제 클릭 실패:', forceError.message);
        }

        // 방법 3: JavaScript 직접 실행
        console.log('🔧 JavaScript로 직접 클릭 시도...');
        try {
          await button.evaluate((btn) => {
            btn.click();
          });
          console.log('✅ JavaScript 클릭 성공!');
          return true;
        } catch (jsError) {
          console.log('❌ JavaScript 클릭 실패:', jsError.message);
        }

        console.warn('❌ 모든 대안 방법이 실패했습니다.');
        return false;
      }

      if (!isVisible) {
        console.warn('⚠️ 버튼이 화면에 보이지 않습니다.');
        return false;
      }

      // 타임아웃과 함께 클릭 시도
      console.log('👆 클릭 시도 중...');
      await Promise.race([
        button.click({ timeout: timeout }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('클릭 타임아웃')), timeout)
        )
      ]);
      console.log('✅ 클릭 완료!');
      return true;
    }

    // 여러 버튼이 있을 경우 위치 정보로 구분
    let bestButton = null;
    let buttonInfos = [];

    for (let i = 0; i < buttons.length; i++) {
      try {
        const button = buttons[i];
        const isVisible = await button.isVisible();

        if (isVisible) {
          const boundingBox = await button.boundingBox();
          const parentInfo = await button.evaluate((btn) => {
            const parent = btn.closest('[role="dialog"], .modal, .popup, .overlay');
            return {
              hasDialogParent: !!parent,
              parentClass: parent?.className || '',
              zIndex: window.getComputedStyle(btn).zIndex
            };
          });

          buttonInfos.push({
            index: i,
            button: button,
            boundingBox: boundingBox,
            parentInfo: parentInfo,
            isVisible: isVisible
          });

          console.log('📊 버튼 ' + (i + 1) + ': 위치(' + boundingBox?.x + ', ' + boundingBox?.y + '), 크기(' + boundingBox?.width + 'x' + boundingBox?.height + '), 다이얼로그 내부: ' + parentInfo.hasDialogParent + ', z-index: ' + parentInfo.zIndex);
        }
      } catch (error) {
        console.log('버튼 ' + (i + 1) + ' 정보 수집 실패:', error);
      }
    }

    // 가장 적절한 버튼 선택 로직
    if (buttonInfos.length > 0) {
      // 1순위: 다이얼로그/모달 내부에 있는 버튼
      const dialogButtons = buttonInfos.filter(info => info.parentInfo.hasDialogParent);
      if (dialogButtons.length === 1) {
        bestButton = dialogButtons[0].button;
        console.log('✅ 다이얼로그 내부의 유일한 버튼 선택');
      } else if (dialogButtons.length > 1) {
        // 2순위: z-index가 가장 높은 버튼 (최상위 레이어)
        const topButton = dialogButtons.sort((a, b) => {
          const aZ = parseInt(a.parentInfo.zIndex) || 0;
          const bZ = parseInt(b.parentInfo.zIndex) || 0;
          return bZ - aZ;
        })[0];
        bestButton = topButton.button;
        console.log('✅ 가장 상위 레이어의 버튼 선택');
      } else {
        // 3순위: 화면 중앙에 가장 가까운 버튼
        const centerX = await page.viewportSize().then(size => size?.width / 2 || 640);
        const centerY = await page.viewportSize().then(size => size?.height / 2 || 360);

        const closestButton = buttonInfos.sort((a, b) => {
          const aDistance = Math.sqrt(
            Math.pow((a.boundingBox?.x + a.boundingBox?.width / 2) - centerX, 2) +
            Math.pow((a.boundingBox?.y + a.boundingBox?.height / 2) - centerY, 2)
          );
          const bDistance = Math.sqrt(
            Math.pow((b.boundingBox?.x + b.boundingBox?.width / 2) - centerX, 2) +
            Math.pow((b.boundingBox?.y + b.boundingBox?.height / 2) - centerY, 2)
          );
          return aDistance - bDistance;
        })[0];
        bestButton = closestButton.button;
        console.log('✅ 화면 중앙에 가장 가까운 버튼 선택');
      }
    }

    if (bestButton) {
      // 선택된 버튼의 상태 검증
      const isEnabled = await bestButton.isEnabled();
      const isVisible = await bestButton.isVisible();

      console.log('🔍 선택된 버튼 상태 - 활성화:', isEnabled, ', 표시:', isVisible);

      if (!isEnabled) {
        console.warn('⚠️ 선택된 버튼이 비활성화 상태입니다. 대안 방법들을 시도합니다...');

        // 방법 1: 잠시 대기 후 활성화 확인
        console.log('🕐 1초 대기 후 버튼 활성화 재확인...');
        await page.waitForTimeout(1000);
        const isEnabledAfterWait = await bestButton.isEnabled();

        if (isEnabledAfterWait) {
          console.log('✅ 대기 후 버튼이 활성화되었습니다!');
        } else {
          // 방법 2: force 클릭 시도
          console.log('🔨 강제 클릭 시도...');
          try {
            await Promise.race([
              bestButton.click({ force: true, timeout: timeout }),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('강제 클릭 타임아웃')), timeout)
              )
            ]);
            console.log('🎯 "' + buttonText + '" 버튼 강제 클릭 완료');
            if (options.waitAfter) await page.waitForTimeout(options.waitAfter);
            return true;
          } catch (forceError) {
            console.log('❌ 강제 클릭 실패:', forceError.message);

            // 방법 3: JavaScript 직접 실행
            console.log('🔧 JavaScript로 직접 클릭 시도...');
            try {
              await bestButton.evaluate((btn) => {
                btn.click();
              });
              console.log('🎯 "' + buttonText + '" 버튼 JavaScript 클릭 완료');
              if (options.waitAfter) await page.waitForTimeout(options.waitAfter);
              return true;
            } catch (jsError) {
              console.log('❌ JavaScript 클릭 실패:', jsError.message);
              console.warn('❌ 모든 대안 방법이 실패했습니다.');
              return false;
            }
          }
        }
      }

      if (!isVisible) {
        console.warn('⚠️ 선택된 버튼이 화면에 보이지 않습니다.');
        return false;
      }

      // 타임아웃과 함께 클릭 시도
      console.log('👆 선택된 버튼 클릭 시도 중...');
      await Promise.race([
        bestButton.click({ timeout: timeout }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('클릭 타임아웃')), timeout)
        )
      ]);
      console.log('🎯 "' + buttonText + '" 버튼 정밀 클릭 완료');
      if (options.waitAfter) await page.waitForTimeout(options.waitAfter);
      return true;
    } else {
      console.warn('❌ 적절한 "' + buttonText + '" 버튼을 찾지 못했습니다.');
      return false;
    }

  } catch (error) {
    console.log('❌ 정밀한 버튼 클릭 실패: ' + error.message);
    return false;
  }
}

/**
 * 설정에 따른 클릭 코드 생성
 */
function generateClickCode(selectorType, selectorValue, name, config) {
  if (config.useStableClick) {
    if (name) {
      return `await stableClickByRole(page, '${selectorValue}', { name: '${name}', maxRetries: ${config.maxRetries || 3}, waitTime: ${config.waitTime || 1000} });`;
    } else {
      return `await stableClickByRole(page, '${selectorValue}', { maxRetries: ${config.maxRetries || 3}, waitTime: ${config.waitTime || 1000} });`;
    }
  } else if (config.usePreciseClick && name) {
    // 정밀한 클릭 (버튼 텍스트가 있는 경우만)
    return `await clickPreciseButton(page, '${name}', { timeout: ${config.waitTime || 3000} });`;
  } else {
    // 기본 클릭
    if (selectorType === 'getByRole') {
      if (name) {
        return `await page.getByRole('${selectorValue}', { name: '${name}' }).click();`;
      } else {
        return `await page.getByRole('${selectorValue}').click();`;
      }
    } else {
      return `await page.locator('${selectorValue}').click();`;
    }
  }
}

/**
 * 파일 캐시 시스템 헬퍼 함수들
 */
const fileCacheHelpers = {
  async cacheFileFromPath(filePath, originalName) {
    const { getCacheManager } = require('./file-cache-manager');
    const cacheManager = getCacheManager();
    return await cacheManager.cacheFile(filePath, originalName);
  },

  async findCachedFile(filename, fileType) {
    const { getCacheManager } = require('./file-cache-manager');
    const cacheManager = getCacheManager();
    return cacheManager.findCachedFile(filename, fileType);
  },

  async getLatestFileByType(fileType) {
    const { getCacheManager } = require('./file-cache-manager');
    const cacheManager = getCacheManager();
    return cacheManager.getLatestFileByType(fileType);
  },

  async getCacheInfo() {
    const { getCacheManager } = require('./file-cache-manager');
    const cacheManager = getCacheManager();
    return cacheManager.getCacheInfo();
  },

  async cleanupOldFiles(maxAgeDays = 30) {
    const { getCacheManager } = require('./file-cache-manager');
    const cacheManager = getCacheManager();
    return await cacheManager.cleanupOldFiles(maxAgeDays);
  }
};

// CommonJS export
module.exports = {
  TestFileManager,
  testFileHelpers,
  uploadFileToPage,
  stableClick,
  stableClickByRole,
  clickPreciseButton,
  generateClickCode,
  fileCacheHelpers,

  // 간편한 인스턴스 생성 함수
  createManager(): TestFileManager {
    return new TestFileManager();
  },

  // 글로벌 인스턴스 (필요한 경우)
  globalManager: new TestFileManager(),

  // 새로운 캐시 매니저 접근
  getCacheManager() {
    const { getCacheManager } = require('./file-cache-manager');
    return getCacheManager();
  }
};