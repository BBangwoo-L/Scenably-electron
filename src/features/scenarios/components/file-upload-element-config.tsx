'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Upload, FileText, Image, FileIcon, Plus, Trash2, Copy, Code } from 'lucide-react';

interface FileUploadConfig {
  id: string;
  elementSelector: string;
  selectorType: 'id' | 'css' | 'xpath' | 'getByRole' | 'getByTestId';
  fileType: 'image' | 'pdf' | 'text' | 'any' | 'custom';
  customFileExtension?: string;
  fileName: string;
  fileSize: 'small' | 'medium' | 'large' | 'custom';
  customSizeInMB?: number;
  useTestFileManager: boolean;
  validationEnabled: boolean;
  validationTimeout: number;
  errorHandling: 'try-catch' | 'conditional' | 'skip-on-error';
  description: string;
}

interface FileUploadElementConfigProps {
  onConfigChange?: (configs: FileUploadConfig[]) => void;
  onGenerateCode?: (imports: string, code: string) => void;
  initialConfigs?: FileUploadConfig[];
}

export function FileUploadElementConfig({
  onConfigChange,
  onGenerateCode,
  initialConfigs = []
}: FileUploadElementConfigProps) {
  const [configs, setConfigs] = useState<FileUploadConfig[]>(
    initialConfigs.length > 0 ? initialConfigs : [{
      id: 'upload-1',
      elementSelector: '#fileInput',
      selectorType: 'css',
      fileType: 'image',
      fileName: 'test-image',
      fileSize: 'small',
      useTestFileManager: true,
      validationEnabled: true,
      validationTimeout: 3000,
      errorHandling: 'try-catch',
      description: '파일 업로드'
    }]
  );

  const [generatedImports, setGeneratedImports] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  // 새 파일 업로드 설정 추가
  const addNewConfig = () => {
    const newConfig: FileUploadConfig = {
      id: `upload-${Date.now()}`,
      elementSelector: '#fileInput',
      selectorType: 'css',
      fileType: 'image',
      fileName: 'test-file',
      fileSize: 'small',
      useTestFileManager: true,
      validationEnabled: true,
      validationTimeout: 3000,
      errorHandling: 'try-catch',
      description: '파일 업로드'
    };

    const newConfigs = [...configs, newConfig];
    setConfigs(newConfigs);
    onConfigChange?.(newConfigs);
  };

  // 설정 삭제
  const removeConfig = (id: string) => {
    const newConfigs = configs.filter(config => config.id !== id);
    setConfigs(newConfigs);
    onConfigChange?.(newConfigs);
  };

  // 설정 업데이트
  const updateConfig = (id: string, updates: Partial<FileUploadConfig>) => {
    const newConfigs = configs.map(config =>
      config.id === id ? { ...config, ...updates } : config
    );
    setConfigs(newConfigs);
    onConfigChange?.(newConfigs);
  };

  // 설정 복사
  const duplicateConfig = (config: FileUploadConfig) => {
    const newConfig = {
      ...config,
      id: `upload-${Date.now()}`,
      fileName: `${config.fileName}-copy`
    };
    const newConfigs = [...configs, newConfig];
    setConfigs(newConfigs);
    onConfigChange?.(newConfigs);
  };

  // selector 문자열 생성
  const generateSelectorString = (config: FileUploadConfig): string => {
    switch (config.selectorType) {
      case 'id':
        return `'#${config.elementSelector.replace('#', '')}'`;
      case 'css':
        return `'${config.elementSelector}'`;
      case 'xpath':
        return `'${config.elementSelector}'`;
      case 'getByRole':
        return `page.getByRole('button', { name: '${config.elementSelector}' })`;
      case 'getByTestId':
        return `page.getByTestId('${config.elementSelector}')`;
      default:
        return `'${config.elementSelector}'`;
    }
  };

  // import 문 생성
  const generateImports = useCallback((): string => {
    const hasTestFileManager = configs.some(config => config.useTestFileManager);

    const imports = [
      "import { test, expect } from '@playwright/test';"
    ];

    if (hasTestFileManager) {
      imports.push("import { TestFileManager, testFileHelpers } from '*/test-utils/file-helpers';");
    }

    return imports.join('\n');
  }, [configs]);

  // 테스트 코드 생성
  const generateTestCode = useCallback((): string => {
    const hasTestFileManager = configs.some(config => config.useTestFileManager);

    let code = `test.describe('파일 업로드 테스트', () => {\n`;

    if (hasTestFileManager) {
      code += `  let fileManager: TestFileManager;\n\n`;
      code += `  test.beforeEach(async () => {\n`;
      code += `    fileManager = new TestFileManager();\n`;
      code += `  });\n\n`;
      code += `  test.afterEach(async () => {\n`;
      code += `    await fileManager.cleanup();\n`;
      code += `  });\n\n`;
    }

    code += `  test('파일 업로드 테스트', async ({ page }) => {\n`;

    // 파일 생성 코드
    configs.forEach((config, index) => {
      if (config.useTestFileManager) {
        code += `    // ${config.description} - 테스트 파일 생성\n`;

        let fileCreationCode = '';
        let fileTypeMethod = '';
        let options = `{ filename: '${config.fileName}'`;

        switch (config.fileType) {
          case 'image':
            fileTypeMethod = 'createTestImage';
            options += `, extension: 'png', size: '${config.fileSize}'`;
            break;
          case 'pdf':
            fileTypeMethod = 'createTestPDF';
            break;
          case 'text':
            fileTypeMethod = 'createTestTextFile';
            options += `, extension: 'txt'`;
            break;
          case 'custom':
            if (config.customFileExtension) {
              fileTypeMethod = 'createTestTextFile';
              options += `, extension: '${config.customFileExtension}'`;
            } else {
              fileTypeMethod = 'createTestImage';
            }
            break;
          default:
            fileTypeMethod = 'createTestImage';
        }

        if (config.fileSize === 'custom' && config.customSizeInMB) {
          fileCreationCode = `    const filePath${index + 1} = await fileManager.createTestFileWithSize(${config.customSizeInMB} * 1024 * 1024, ${options} });\n`;
        } else {
          options += ' }';
          fileCreationCode = `    const filePath${index + 1} = await fileManager.${fileTypeMethod}(${options});\n`;
        }

        code += fileCreationCode;
      } else {
        code += `    // ${config.description} - 정적 파일 경로 사용\n`;
        code += `    const filePath${index + 1} = './test-files/${config.fileName}.${config.fileType === 'custom' ? config.customFileExtension : config.fileType}';\n`;
      }
    });

    code += '\n    // 페이지로 이동\n';
    code += "    await page.goto('/your-page-url');\n\n";

    // 파일 업로드 코드
    configs.forEach((config, index) => {
      code += `    // ${config.description}\n`;

      const selectorString = generateSelectorString(config);

      if (config.errorHandling === 'try-catch') {
        code += `    try {\n`;
        if (config.validationEnabled) {
          code += `      await page.waitForSelector(${selectorString}, { timeout: ${config.validationTimeout} });\n`;
        }

        if (config.selectorType === 'getByRole' || config.selectorType === 'getByTestId') {
          code += `      await ${selectorString}.setInputFiles(filePath${index + 1});\n`;
        } else {
          code += `      await page.setInputFiles(${selectorString}, filePath${index + 1});\n`;
        }

        if (config.validationEnabled) {
          code += `      // 파일 업로드 검증\n`;
          if (config.selectorType === 'getByRole' || config.selectorType === 'getByTestId') {
            code += `      const uploadedFiles = await ${selectorString}.evaluate((input: HTMLInputElement) => input.files?.length || 0);\n`;
          } else {
            code += `      const uploadedFiles = await page.locator(${selectorString}).evaluate((input: HTMLInputElement) => input.files?.length || 0);\n`;
          }
          code += `      expect(uploadedFiles).toBe(1);\n`;
        }

        code += `    } catch (error) {\n`;
        code += `      console.log('${config.description} 실패:', error);\n`;
        if (config.errorHandling !== 'skip-on-error') {
          code += `      throw error;\n`;
        }
        code += `    }\n\n`;
      } else if (config.errorHandling === 'conditional') {
        if (config.selectorType === 'getByRole' || config.selectorType === 'getByTestId') {
          code += `    if (await ${selectorString}.isVisible()) {\n`;
          code += `      await ${selectorString}.setInputFiles(filePath${index + 1});\n`;
        } else {
          code += `    const fileInput${index + 1} = page.locator(${selectorString});\n`;
          code += `    if (await fileInput${index + 1}.isVisible()) {\n`;
          code += `      await fileInput${index + 1}.setInputFiles(filePath${index + 1});\n`;
        }

        if (config.validationEnabled) {
          code += `      // 파일 업로드 검증\n`;
          if (config.selectorType === 'getByRole' || config.selectorType === 'getByTestId') {
            code += `      const uploadedFiles = await ${selectorString}.evaluate((input: HTMLInputElement) => input.files?.length || 0);\n`;
          } else {
            code += `      const uploadedFiles = await fileInput${index + 1}.evaluate((input: HTMLInputElement) => input.files?.length || 0);\n`;
          }
          code += `      expect(uploadedFiles).toBe(1);\n`;
        }

        code += `    }\n\n`;
      } else {
        // skip-on-error: 단순 실행
        if (config.selectorType === 'getByRole' || config.selectorType === 'getByTestId') {
          code += `    await ${selectorString}.setInputFiles(filePath${index + 1});\n`;
        } else {
          code += `    await page.setInputFiles(${selectorString}, filePath${index + 1});\n`;
        }
        code += '\n';
      }
    });

    code += `  });\n`;
    code += `});\n`;

    return code;
  }, [configs]);

  // 코드 생성 실행
  const handleGenerateCode = () => {
    const imports = generateImports();
    const code = generateTestCode();

    setGeneratedImports(imports);
    setGeneratedCode(code);
    onGenerateCode?.(imports, code);
  };

  // 파일 타입 아이콘
  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'text':
        return <FileIcon className="h-4 w-4" />;
      default:
        return <Upload className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              파일 업로드 요소 설정
            </CardTitle>
            <Button onClick={addNewConfig} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="config" className="space-y-4">
            <TabsList>
              <TabsTrigger value="config">요소 설정</TabsTrigger>
              <TabsTrigger value="code">생성된 코드</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-6">
              {configs.map((config, index) => (
                <Card key={config.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getFileTypeIcon(config.fileType)}
                        <span className="font-medium">파일 업로드 #{index + 1}</span>
                        <Badge variant="outline">{config.fileType}</Badge>
                        {config.useTestFileManager && (
                          <Badge variant="secondary">동적 생성</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => duplicateConfig(config)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeConfig(config.id)}
                          disabled={configs.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>요소 선택자</Label>
                        <Input
                          value={config.elementSelector}
                          onChange={(e) => updateConfig(config.id, { elementSelector: e.target.value })}
                          placeholder="#fileInput"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>선택자 타입</Label>
                        <Select
                          value={config.selectorType}
                          onValueChange={(value: any) => updateConfig(config.id, { selectorType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="id">ID (#id)</SelectItem>
                            <SelectItem value="css">CSS Selector</SelectItem>
                            <SelectItem value="xpath">XPath</SelectItem>
                            <SelectItem value="getByRole">getByRole</SelectItem>
                            <SelectItem value="getByTestId">getByTestId</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>파일 타입</Label>
                        <Select
                          value={config.fileType}
                          onValueChange={(value: any) => updateConfig(config.id, { fileType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image">이미지 (PNG)</SelectItem>
                            <SelectItem value="pdf">PDF 문서</SelectItem>
                            <SelectItem value="text">텍스트 파일</SelectItem>
                            <SelectItem value="custom">사용자 정의</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>파일명</Label>
                        <Input
                          value={config.fileName}
                          onChange={(e) => updateConfig(config.id, { fileName: e.target.value })}
                          placeholder="test-file"
                        />
                      </div>
                    </div>

                    {config.fileType === 'custom' && (
                      <div className="space-y-2">
                        <Label>파일 확장자</Label>
                        <Input
                          value={config.customFileExtension || ''}
                          onChange={(e) => updateConfig(config.id, { customFileExtension: e.target.value })}
                          placeholder="jpg, docx, xlsx 등"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>파일 크기</Label>
                        <Select
                          value={config.fileSize}
                          onValueChange={(value: any) => updateConfig(config.id, { fileSize: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">작음 ({'<'} 1MB)</SelectItem>
                            <SelectItem value="medium">보통 (1-5MB)</SelectItem>
                            <SelectItem value="large">큼 (5-10MB)</SelectItem>
                            <SelectItem value="custom">사용자 정의</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {config.fileSize === 'custom' && (
                        <div className="space-y-2">
                          <Label>크기 (MB)</Label>
                          <Input
                            type="number"
                            value={config.customSizeInMB || ''}
                            onChange={(e) => updateConfig(config.id, { customSizeInMB: parseFloat(e.target.value) })}
                            placeholder="5"
                            min="0.1"
                            max="100"
                            step="0.1"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.useTestFileManager}
                          onCheckedChange={(checked) => updateConfig(config.id, { useTestFileManager: checked })}
                        />
                        <Label>TestFileManager 사용 (동적 파일 생성)</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.validationEnabled}
                          onCheckedChange={(checked) => updateConfig(config.id, { validationEnabled: checked })}
                        />
                        <Label>업로드 검증 활성화</Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>에러 처리 방식</Label>
                        <Select
                          value={config.errorHandling}
                          onValueChange={(value: any) => updateConfig(config.id, { errorHandling: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="try-catch">Try-Catch (안전)</SelectItem>
                            <SelectItem value="conditional">조건적 실행</SelectItem>
                            <SelectItem value="skip-on-error">에러 시 건너뛰기</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {config.validationEnabled && (
                        <div className="space-y-2">
                          <Label>타임아웃 (ms)</Label>
                          <Select
                            value={config.validationTimeout.toString()}
                            onValueChange={(value) => updateConfig(config.id, { validationTimeout: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1000">1초</SelectItem>
                              <SelectItem value="3000">3초</SelectItem>
                              <SelectItem value="5000">5초</SelectItem>
                              <SelectItem value="10000">10초</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>설명</Label>
                      <Input
                        value={config.description}
                        onChange={(e) => updateConfig(config.id, { description: e.target.value })}
                        placeholder="파일 업로드 설명"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-center">
                <Button onClick={handleGenerateCode} className="gap-2">
                  <Code className="h-4 w-4" />
                  테스트 코드 생성 ({configs.length}개 파일 업로드)
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="code" className="space-y-4">
              {generatedImports && generatedCode ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Import 구문</Label>
                    <Textarea
                      value={generatedImports}
                      readOnly
                      className="font-mono text-sm bg-muted mt-2"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">테스트 코드</Label>
                    <Textarea
                      value={generatedCode}
                      readOnly
                      className="font-mono text-sm bg-muted mt-2"
                      rows={20}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigator.clipboard.writeText(generatedImports + '\n\n' + generatedCode)}
                      variant="outline"
                    >
                      전체 코드 복사
                    </Button>
                    <Button
                      onClick={() => navigator.clipboard.writeText(generatedImports)}
                      variant="outline"
                      size="sm"
                    >
                      Import만 복사
                    </Button>
                    <Button
                      onClick={() => navigator.clipboard.writeText(generatedCode)}
                      variant="outline"
                      size="sm"
                    >
                      테스트 코드만 복사
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  먼저 요소를 설정하고 테스트 코드를 생성해주세요.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}