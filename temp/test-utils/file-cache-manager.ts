const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

interface CachedFile {
  originalName: string;
  savedPath: string;
  fileType: string;
  size: number;
  hash: string;
  uploadedAt: number;
}

interface FileMapping {
  [key: string]: CachedFile;
}

class FileCacheManager {
  private cacheDir: string;
  private mappingFile: string;
  private mapping: FileMapping = {};

  constructor() {
    this.cacheDir = path.join(process.cwd(), 'temp', 'uploaded-files');
    this.mappingFile = path.join(this.cacheDir, 'file-mapping.json');
    this.initializeCache();
  }

  private async initializeCache() {
    try {
      // 캐시 디렉토리 생성
      await fs.mkdir(this.cacheDir, { recursive: true });

      // 기존 매핑 파일 로드
      try {
        const mappingData = await fs.readFile(this.mappingFile, 'utf-8');
        this.mapping = JSON.parse(mappingData);
        console.log('📁 기존 파일 캐시 로드됨:', Object.keys(this.mapping).length, '개 파일');
      } catch (error) {
        // 매핑 파일이 없으면 새로 생성
        this.mapping = {};
        await this.saveMapping();
        console.log('📁 새로운 파일 캐시 시스템 초기화');
      }
    } catch (error) {
      console.error('파일 캐시 초기화 실패:', error);
    }
  }

  private async saveMapping() {
    try {
      await fs.writeFile(this.mappingFile, JSON.stringify(this.mapping, null, 2));
    } catch (error) {
      console.error('파일 매핑 저장 실패:', error);
    }
  }

  private generateFileHash(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  private getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase() || '.bin';
  }

  private determineFileType(filename: string): string {
    const ext = this.getFileExtension(filename);

    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
      return 'image';
    } else if (ext === '.pdf') {
      return 'pdf';
    } else if (['.txt', '.csv', '.log', '.md'].includes(ext)) {
      return 'text';
    } else if (['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext)) {
      return 'document';
    } else {
      return 'other';
    }
  }

  /**
   * 파일을 캐시에 저장
   */
  async cacheFile(filePath: string, originalName?: string): Promise<string> {
    try {
      console.log('📦 파일 캐싱 시작:', filePath);

      // 파일 읽기
      const buffer = await fs.readFile(filePath);
      const hash = this.generateFileHash(buffer);
      const name = originalName || path.basename(filePath);
      const ext = this.getFileExtension(name);
      const fileType = this.determineFileType(name);

      // 이미 캐시된 파일인지 확인 (해시 기반)
      const existingFile = Object.values(this.mapping).find(file => file.hash === hash);
      if (existingFile) {
        console.log('✅ 이미 캐시된 파일 재사용:', existingFile.savedPath);
        return existingFile.savedPath;
      }

      // 새 파일명 생성 (타임스탬프 + 해시 + 확장자)
      const timestamp = Date.now();
      const savedFileName = `${timestamp}_${hash.substring(0, 8)}${ext}`;
      const savedPath = path.join(this.cacheDir, savedFileName);

      // 파일 복사
      await fs.writeFile(savedPath, buffer);

      // 매핑 정보 저장
      const cacheKey = `${name}_${hash.substring(0, 8)}`;
      this.mapping[cacheKey] = {
        originalName: name,
        savedPath: savedPath,
        fileType: fileType,
        size: buffer.length,
        hash: hash,
        uploadedAt: timestamp
      };

      await this.saveMapping();

      console.log('✅ 파일 캐싱 완료:', savedPath);
      console.log('📊 파일 정보:', {
        name: name,
        type: fileType,
        size: `${Math.round(buffer.length / 1024)}KB`,
        hash: hash.substring(0, 8)
      });

      return savedPath;

    } catch (error) {
      console.error('❌ 파일 캐싱 실패:', error);
      throw error;
    }
  }

  /**
   * 파일명으로 캐시된 파일 찾기
   */
  findCachedFile(filename: string, fileType?: string): string | null {
    const entries = Object.entries(this.mapping);

    // 정확한 파일명 매치 우선
    let match = entries.find(([key, file]) =>
      file.originalName === filename && (!fileType || file.fileType === fileType)
    );

    // 파일명 유사도 매치
    if (!match) {
      const baseName = path.basename(filename, path.extname(filename));
      match = entries.find(([key, file]) => {
        const cachedBaseName = path.basename(file.originalName, path.extname(file.originalName));
        return cachedBaseName.includes(baseName) && (!fileType || file.fileType === fileType);
      });
    }

    // 파일 타입만 매치 (가장 최근 파일)
    if (!match && fileType) {
      const typeMatches = entries.filter(([key, file]) => file.fileType === fileType);
      if (typeMatches.length > 0) {
        // 가장 최근에 업로드된 파일 선택
        match = typeMatches.sort((a, b) => b[1].uploadedAt - a[1].uploadedAt)[0];
      }
    }

    if (match) {
      console.log('🔍 캐시된 파일 발견:', match[1].savedPath);
      return match[1].savedPath;
    }

    console.log('❌ 캐시된 파일을 찾을 수 없음:', filename);
    return null;
  }

  /**
   * 파일 타입별 가장 최근 파일 가져오기
   */
  getLatestFileByType(fileType: string): string | null {
    const typeFiles = Object.values(this.mapping).filter(file => file.fileType === fileType);

    if (typeFiles.length === 0) {
      return null;
    }

    const latest = typeFiles.sort((a, b) => b.uploadedAt - a.uploadedAt)[0];
    return latest.savedPath;
  }

  /**
   * 캐시 정보 조회
   */
  getCacheInfo(): { totalFiles: number, totalSize: string, fileTypes: Record<string, number> } {
    const files = Object.values(this.mapping);
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const fileTypes = files.reduce((types, file) => {
      types[file.fileType] = (types[file.fileType] || 0) + 1;
      return types;
    }, {} as Record<string, number>);

    return {
      totalFiles: files.length,
      totalSize: `${Math.round(totalSize / 1024)}KB`,
      fileTypes
    };
  }

  /**
   * 오래된 캐시 파일 정리 (30일 이상)
   */
  async cleanupOldFiles(maxAgeDays: number = 30): Promise<number> {
    const cutoffTime = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
    const oldFiles = Object.entries(this.mapping).filter(([key, file]) => file.uploadedAt < cutoffTime);

    let cleanedCount = 0;
    for (const [key, file] of oldFiles) {
      try {
        await fs.unlink(file.savedPath);
        delete this.mapping[key];
        cleanedCount++;
      } catch (error) {
        console.warn('파일 삭제 실패:', file.savedPath, error.message);
      }
    }

    if (cleanedCount > 0) {
      await this.saveMapping();
      console.log(`🧹 ${cleanedCount}개의 오래된 캐시 파일 정리 완료`);
    }

    return cleanedCount;
  }

  /**
   * 전체 캐시 초기화
   */
  async clearCache(): Promise<void> {
    try {
      const files = Object.values(this.mapping);
      for (const file of files) {
        try {
          await fs.unlink(file.savedPath);
        } catch (error) {
          // 파일이 이미 없어도 무시
        }
      }

      this.mapping = {};
      await this.saveMapping();
      console.log('🗑️ 파일 캐시 전체 초기화 완료');
    } catch (error) {
      console.error('캐시 초기화 실패:', error);
    }
  }
}

// 전역 인스턴스
let globalCacheManager: FileCacheManager | null = null;

function getCacheManager(): FileCacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new FileCacheManager();
  }
  return globalCacheManager;
}

// CommonJS export
module.exports = {
  FileCacheManager,
  getCacheManager
};