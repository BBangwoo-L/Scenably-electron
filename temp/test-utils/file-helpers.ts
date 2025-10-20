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

// CommonJS export
module.exports = {
  TestFileManager,
  testFileHelpers,

  // 간편한 인스턴스 생성 함수
  createManager(): TestFileManager {
    return new TestFileManager();
  },

  // 글로벌 인스턴스 (필요한 경우)
  globalManager: new TestFileManager()
};