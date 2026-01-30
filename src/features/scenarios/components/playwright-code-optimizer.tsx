'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { Label } from '@/shared/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/ui/accordion';
import { Save, Upload, HelpCircle } from 'lucide-react';
import { useToastStore } from '@/stores/toast-store';

interface PlaywrightAction {
  id: string;
  line: number;
  type: 'click' | 'fill' | 'fileupload' | 'other';
  originalCode: string;
  selector: string;
  description: string;
  isOptional: boolean;
  conditionType: 'try-catch' | 'if-exists' | 'wait-for' | 'loop';
  timeout: number;
  maxAttempts: number;
  // 정밀한 클릭 사용 여부 (사용자가 선택)
  usePreciseClick?: boolean;
  // 안정적 클릭 사용 여부 (조건부 렌더링 문제 해결)
  useStableClick?: boolean;
  // 파일 업로드 전용 필드
  isFileUpload?: boolean;
  fileType?: 'image' | 'pdf' | 'text' | 'custom';
  fileName?: string;
  fileSize?: 'small' | 'medium' | 'large';
  originalFilePath?: string;
  // 파일 캐싱 옵션
  enableFileCache?: boolean;
  cacheFilePath?: string;
}

interface PlaywrightCodeOptimizerProps {
  initialCode?: string;
  onCodeChange?: (optimizedCode: string) => void;
  scenarioId?: string | null;
  onSaveAndReturn?: (optimizedCode: string) => Promise<void>;
}

// Helper 함수들은 생성된 코드에서만 사용 (브라우저 환경에서는 Node.js 모듈 import 불가)

export function PlaywrightCodeOptimizer({
  initialCode = '',
  onCodeChange,
  scenarioId,
  onSaveAndReturn
}: PlaywrightCodeOptimizerProps) {
  const [originalCode, setOriginalCode] = useState(initialCode);
  const [optimizedCode, setOptimizedCode] = useState('');
  const [actions, setActions] = useState<PlaywrightAction[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToastStore();

  // 도움말 메시지들
  const helpMessages = {
    conditionalProcessing: "요소가 없어도 테스트가 실패하지 않도록 try-catch나 조건문으로 감싸서 처리합니다. 선택적 요소나 간헐적으로 나타나는 요소에 유용합니다.",
    preciseClick: "여러 개의 동일한 버튼이 있을 때 위치, 다이얼로그 여부, z-index 등을 고려하여 가장 적절한 버튼을 찾아 클릭합니다.",
    stableClick: "조건부 렌더링으로 인한 클릭 실패 문제를 해결합니다. 요소가 사라졌다 나타나는 상황에서 재시도 로직과 DOM 안정화 대기를 통해 안정적으로 클릭합니다.",
    trycatch: "요소를 찾지 못하면 에러를 발생시키지 않고 로그만 남기고 다음 단계로 진행합니다.",
    ifExists: "요소가 화면에 보이는 경우에만 액션을 수행합니다.",
    waitFor: "요소가 나타날 때까지 설정된 시간만큼 대기한 후 액션을 수행합니다.",
    loop: "여러 선택자를 순차적으로 시도하여 올바른 요소를 찾아 액션을 수행합니다."
  };

  // 도움말 표시 함수
  const showHelp = (key: keyof typeof helpMessages) => {
    showToast({
      title: "도움말",
      message: helpMessages[key],
      type: "info",
      duration: 5000
    });
  };

  // 초기 코드가 있으면 자동으로 파싱
  useEffect(() => {
    if (initialCode) {
      parsePlaywrightCode(initialCode);
    }
  }, [initialCode]);

  // Playwright 코드 파싱
  const parsePlaywrightCode = useCallback((code: string) => {
    const lines = code.split('\n');
    const parsedActions: PlaywrightAction[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // 클릭 액션 파싱
      if (trimmedLine.includes('.click(')) {
        const selectorMatch = trimmedLine.match(/\.getByRole\(['"]([^'"]+)['"],\s*\{\s*name:\s*['"]([^'"]+)['"]\s*\}|\.locator\(['"]([^'"]+)['"]\)|\.getBy\w+\(['"]([^'"]+)['"]\)/);
        const selector = selectorMatch ? (selectorMatch[2] || selectorMatch[3] || selectorMatch[4] || selectorMatch[1]) : 'Unknown';

        parsedActions.push({
          id: `action-${index}`,
          line: index + 1,
          type: 'click',
          originalCode: trimmedLine,
          selector,
          description: `클릭: ${selector}`,
          isOptional: false,
          conditionType: 'try-catch',
          timeout: 3000,
          maxAttempts: 1
        });
      }

      // 파일 업로드 액션 파싱
      else if (trimmedLine.includes('.setInputFiles(')) {
        const selectorMatch = trimmedLine.match(/\.getByRole\(['"]([^'"]+)['"],\s*\{\s*name:\s*['"]([^'"]+)['"]\s*\}|\.locator\(['"]([^'"]+)['"]\)|\.getBy\w+\(['"]([^'"]+)['"]\)|page\.setInputFiles\(['"]([^'"]+)['"]\)/);
        const filePathMatch = trimmedLine.match(/\.setInputFiles\(['"]?([^,)]+)['"]?\)/);
        const selector = selectorMatch ? (selectorMatch[2] || selectorMatch[3] || selectorMatch[4] || selectorMatch[5] || selectorMatch[1]) : 'Unknown';
        const originalFilePath = filePathMatch ? filePathMatch[1] : '';

        // 파일 경로에서 파일 이름과 확장자 추출
        const fileName = originalFilePath.split('/').pop()?.split('.')[0] || 'test-file';
        const extension = originalFilePath.split('.').pop()?.toLowerCase() || 'png';

        let fileType: 'image' | 'pdf' | 'text' | 'custom' = 'custom';
        if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) {
          fileType = 'image';
        } else if (extension === 'pdf') {
          fileType = 'pdf';
        } else if (['txt', 'csv', 'log'].includes(extension)) {
          fileType = 'text';
        }

        parsedActions.push({
          id: `action-${index}`,
          line: index + 1,
          type: 'fileupload',
          originalCode: trimmedLine,
          selector,
          description: `파일 업로드: ${selector} → ${fileName}.${extension}`,
          isOptional: false,
          conditionType: 'try-catch',
          timeout: 3000,
          maxAttempts: 1,
          isFileUpload: true,
          fileType,
          fileName,
          fileSize: 'small',
          originalFilePath
        });
      }

      // 입력 액션 파싱
      else if (trimmedLine.includes('.fill(')) {
        const selectorMatch = trimmedLine.match(/\.getByRole\(['"]([^'"]+)['"],\s*\{\s*name:\s*['"]([^'"]+)['"]\s*\}|\.locator\(['"]([^'"]+)['"]\)|\.getBy\w+\(['"]([^'"]+)['"]\)/);
        const valueMatch = trimmedLine.match(/\.fill\(['"]([^'"]+)['"]\)/);
        const selector = selectorMatch ? (selectorMatch[2] || selectorMatch[3] || selectorMatch[4] || selectorMatch[1]) : 'Unknown';
        const value = valueMatch ? valueMatch[1] : '';

        parsedActions.push({
          id: `action-${index}`,
          line: index + 1,
          type: 'fill',
          originalCode: trimmedLine,
          selector,
          description: `입력: ${selector} = "${value}"`,
          isOptional: false,
          conditionType: 'try-catch',
          timeout: 3000,
          maxAttempts: 1
        });
      }
    });

    setActions(parsedActions);
  }, []);


  // 클릭 코드 생성 함수 (브라우저에서 사용 가능)
  const generateClickCode = useCallback((selectorType: string, selectorValue: string, name: string | null, config: {
    useStableClick?: boolean;
    usePreciseClick?: boolean;
    maxRetries?: number;
    waitTime?: number;
  }) => {
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
  }, []);

  // 최적화된 코드 생성
  const generateOptimizedCode = useCallback(() => {
    console.log('generateOptimizedCode 함수 실행됨');
    console.log('originalCode:', originalCode);
    console.log('actions:', actions);

    if (!originalCode) {
      alert('원본 코드가 없습니다. 먼저 코드를 입력해주세요.');
      return;
    }

    const lines = originalCode.split('\n');
    const optimizedLines: string[] = [];

    // 파일 업로드 액션이 있는지 확인
    const hasFileUploads = actions.some(action => action.isFileUpload);
    const hasStableClicks = actions.some(action => action.useStableClick);

    // Helper 함수들 import
    let helperFunctions = `
// File helpers import
const path = require('path');
const helperPath = path.join(process.cwd(), 'temp', 'test-utils', 'file-helpers');
const {
  uploadFileToPage,
  stableClick,
  stableClickByRole,
  clickPreciseButton
} = require(helperPath);

// 조건적 클릭 헬퍼 함수
async function clickIfExists(page, selector, options = {}) {
  const timeout = options.timeout || 3000;
  try {
    const element = page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });

    if (await element.isVisible()) {
      await element.click();
      if (options.waitAfter) await page.waitForTimeout(options.waitAfter);
      return true;
    }
    return false;
  } catch (error) {
    console.log('요소 ' + selector + '를 찾을 수 없습니다.');
    return false;
  }
}

// 조건적 입력 헬퍼 함수 - clickPreciseButton은 file-helpers에서 import됨
async function fillIfExists(page, selector, value, options = {}) {
  const timeout = options.timeout || 3000;
  try {
    const element = page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });

    if (await element.isVisible()) {
      await element.fill(value);
      if (options.waitAfter) await page.waitForTimeout(options.waitAfter);
      return true;
    }
    return false;
  } catch (error) {
    console.log('요소 ' + selector + '를 찾을 수 없습니다.');
    return false;
  }
}

// 반복 클릭 헬퍼 함수
async function clickMultipleIfExists(page, selector, maxAttempts = 5, options = {}) {
  let attempts = 0;
  const timeout = options.timeout || 3000;
  const waitBetween = options.waitBetween || 500;

  while (attempts < maxAttempts) {
    try {
      const element = page.locator(selector);
      await element.waitFor({ state: 'visible', timeout });

      if (await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(waitBetween);
        attempts++;
      } else {
        break;
      }
    } catch (error) {
      break;
    }
  }

  return attempts;
}`;

    // 중복 import 방지 - 이미 위에서 helper 함수들을 import했으므로 이 부분 제거

    helperFunctions += `
`;

    // 시나리오 코드 처리 - 중복 방지를 위해 기존 코드 확인
    const hasExistingHelperImport = originalCode.includes('file-helpers') || originalCode.includes('uploadFileToPage');

    lines.forEach((line, index) => {
      const action = actions.find(a => a.line === index + 1);

      // 파일 업로드 액션 특별 처리
      if (action && action.isFileUpload) {
        if (action.isOptional) {
          switch (action.conditionType) {
            case 'try-catch':
              optimizedLines.push(`  try {`);
              optimizedLines.push(`    // ${action.description} - uploadFileToPage로 변환됨`);
              optimizedLines.push(`    await uploadFileToPage(page, '${action.fileType}', {`);
              optimizedLines.push(`      filename: '${action.fileName}',`);
              optimizedLines.push(`      extension: '${action.fileType === 'image' ? 'png' : action.fileType}'`);
              optimizedLines.push(`    });`);
              optimizedLines.push(`  } catch (error) {`);
              optimizedLines.push(`    console.log('${action.description} - 파일 업로드를 건너뜁니다');`);
              optimizedLines.push(`  }`);
              break;
            default:
              optimizedLines.push(`  // ${action.description} - uploadFileToPage로 변환됨`);
              optimizedLines.push(`  await uploadFileToPage(page, '${action.fileType}', {`);
              optimizedLines.push(`    filename: '${action.fileName}',`);
              optimizedLines.push(`    extension: '${action.fileType === 'image' ? 'png' : action.fileType}'`);
              optimizedLines.push(`  });`);
          }
        } else {
          // 필수 파일 업로드
          optimizedLines.push(`  // ${action.description} - uploadFileToPage로 변환됨`);
          optimizedLines.push(`  await uploadFileToPage(page, '${action.fileType}', {`);
          optimizedLines.push(`    filename: '${action.fileName}',`);
          optimizedLines.push(`    extension: '${action.fileType === 'image' ? 'png' : action.fileType}'`);
          optimizedLines.push(`  });`);
        }
        return;
      }

      if (action && action.isOptional && !action.isFileUpload) {
        // 일반 조건적 처리로 변환
        switch (action.conditionType) {
          case 'try-catch':
            optimizedLines.push(`  try {`);
            if ((action.useStableClick || action.usePreciseClick) && action.type === 'click') {
              // 버튼 텍스트 추출 (getByRole 패턴에서)
              const roleMatch = action.originalCode.match(/getByRole\(['"]([^'"]+)['"],\s*\{\s*name:\s*['"]([^'"]+)['"]/);
              const selectorType = roleMatch ? 'getByRole' : 'other';
              const selectorValue = roleMatch ? roleMatch[1] : action.selector;
              const name = roleMatch ? roleMatch[2] : null;

              const config = {
                useStableClick: action.useStableClick,
                usePreciseClick: action.usePreciseClick,
                maxRetries: action.maxAttempts || 3,
                waitTime: action.timeout || 1000
              };

              // generateClickCode 함수 사용 (들여쓰기 추가)
              const clickCode = generateClickCode(selectorType, selectorValue, name, config);
              optimizedLines.push(`    // 사용자가 선택한 최적화된 클릭 방식`);
              optimizedLines.push(`    ${clickCode}`);
            } else {
              optimizedLines.push(`    ${line}`);
            }
            if (action.timeout !== 3000) {
              optimizedLines.push(`    await page.waitForTimeout(${action.timeout});`);
            }
            optimizedLines.push(`  } catch (error) {`);
            optimizedLines.push(`    console.log('${action.description} - 요소를 찾을 수 없어 건너뜁니다');`);
            optimizedLines.push(`  }`);
            break;

          case 'if-exists':
            if (action.type === 'click') {
              const selectorMatch = action.originalCode.match(/page\..*?(?=\.click)/);
              const selector = selectorMatch ? selectorMatch[0] : 'element';
              optimizedLines.push(`  if (await ${selector}.isVisible()) {`);
              optimizedLines.push(`    ${line}`);
              optimizedLines.push(`  }`);
            } else {
              optimizedLines.push(`  // if-exists 처리: ${line}`);
              optimizedLines.push(line);
            }
            break;

          case 'wait-for':
            optimizedLines.push(`  await page.waitForSelector('${action.selector}', { timeout: ${action.timeout} }).catch(() => {});`);
            optimizedLines.push(line);
            break;

          case 'loop':
            if (action.type === 'click') {
              const selectorMatch = action.originalCode.match(/\.getByRole\(['"]([^'"]+)['"],\s*\{\s*name:\s*['"]([^'"]+)['"]\s*\}/);
              if (selectorMatch) {
                // 더 안전한 선택자 제안
                const betterSelectors = [
                  `'[role="${selectorMatch[1]}"][name*="${selectorMatch[2]}"]'`,
                  `'button:has-text("${selectorMatch[2]}")'`,
                  `'[role="dialog"] button:has-text("${selectorMatch[2]}")'`,
                  `'button:has-text("${selectorMatch[2]}"):visible'`
                ];

                optimizedLines.push(`  // 여러 선택자를 시도하여 올바른 요소 찾기`);
                optimizedLines.push(`  const selectors = [${betterSelectors.join(', ')}];`);
                optimizedLines.push(`  for (const selector of selectors) {`);
                optimizedLines.push(`    try {`);
                optimizedLines.push(`      const element = page.locator(selector);`);
                optimizedLines.push(`      if (await element.count() > 0 && await element.first().isVisible()) {`);
                optimizedLines.push(`        await element.first().click();`);
                optimizedLines.push(`        await page.waitForTimeout(500);`);
                optimizedLines.push(`        break;`);
                optimizedLines.push(`      }`);
                optimizedLines.push(`    } catch (error) { continue; }`);
                optimizedLines.push(`  }`);
              } else {
                optimizedLines.push(`  // 반복 처리: ${line}`);
                optimizedLines.push(line);
              }
            } else {
              optimizedLines.push(`  // 반복 처리: ${line}`);
              optimizedLines.push(line);
            }
            break;
        }
      } else {
        // 일반 처리 (조건적이지 않은 경우)
        if (action && action.type === 'click' && !action.isFileUpload && (action.useStableClick || action.usePreciseClick)) {
          // 버튼 텍스트 추출 (getByRole 패턴에서)
          const roleMatch = action.originalCode.match(/getByRole\(['"]([^'"]+)['"],\s*\{\s*name:\s*['"]([^'"]+)['"]/);
          const selectorType = roleMatch ? 'getByRole' : 'other';
          const selectorValue = roleMatch ? roleMatch[1] : action.selector;
          const name = roleMatch ? roleMatch[2] : null;

          const config = {
            useStableClick: action.useStableClick,
            usePreciseClick: action.usePreciseClick,
            maxRetries: action.maxAttempts || 3,
            waitTime: action.timeout || 1000
          };

          // generateClickCode 함수 사용
          const clickCode = generateClickCode(selectorType, selectorValue, name, config);
          optimizedLines.push(`  // 사용자가 선택한 최적화된 클릭 방식`);
          optimizedLines.push(`  ${clickCode}`);
        } else {
          optimizedLines.push(line);
        }
      }
    });

    // uploadFileToPage는 자체적으로 cleanup을 처리하므로 별도 정리 코드 불필요

    // 헬퍼 함수들을 맨 아래에 추가 (중복 방지)
    if ((hasFileUploads || hasStableClicks || actions.some(a => a.isOptional)) && !hasExistingHelperImport) {
      optimizedLines.push('');
      optimizedLines.push('// ==================== 헬퍼 함수들 ====================');
      optimizedLines.push(helperFunctions);
    }

    const result = optimizedLines.join('\n');
    setOptimizedCode(result);
    onCodeChange?.(result);
  }, [originalCode, actions, onCodeChange, generateClickCode]);

  // 액션 설정 업데이트
  const updateAction = (id: string, updates: Partial<PlaywrightAction>) => {
    setActions(prev => prev.map(action =>
      action.id === id ? { ...action, ...updates } : action
    ));
  };

  // 저장하고 돌아가기
  const handleSaveAndReturn = async () => {
    if (!optimizedCode) {
      alert('먼저 최적화된 코드를 생성해주세요');
      return;
    }

    if (!onSaveAndReturn) {
      alert('저장 기능이 설정되지 않았습니다');
      return;
    }

    try {
      setIsSaving(true);
      await onSaveAndReturn(optimizedCode);
    } catch (error) {
      console.error('Save error:', error);
      alert(`저장 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Playwright 코드 최적화 도구</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="input" className="space-y-4">
            <TabsList>
              <TabsTrigger value="input">코드 입력</TabsTrigger>
              <TabsTrigger value="configure">요소 설정</TabsTrigger>
              <TabsTrigger value="preview">최적화된 코드</TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-4">
              <div>
                <Textarea
                  id="original-code"
                  placeholder="Playwright 테스트 코드를 여기에 붙여넣으세요..."
                  value={originalCode}
                  onChange={(e) => setOriginalCode(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => parsePlaywrightCode(originalCode)}
                  disabled={!originalCode.trim()}
                  variant="outline"
                >
                  코드 분석하기
                </Button>
                {onSaveAndReturn && (
                  <Button
                    onClick={() => onSaveAndReturn(originalCode)}
                    disabled={!originalCode.trim() || isSaving}
                  >
                    {isSaving ? "저장 중..." : "저장하기"}
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="configure" className="space-y-4">
              {actions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  먼저 코드를 입력하고 분석해주세요.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">발견된 액션들</h3>
                    <Badge variant="secondary">{actions.length}개</Badge>
                  </div>

                  <Accordion type="multiple" className="space-y-2">
                    {actions.sort((a, b) => a.line - b.line).map((action) => (
                      <AccordionItem key={action.id} value={action.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <Badge variant={
                              action.type === 'click' ? 'default' :
                              action.type === 'fileupload' ? 'destructive' :
                              'secondary'
                            }>
                              {action.type === 'fileupload' ? '파일' : action.type}
                            </Badge>
                            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                              줄 {action.line}
                            </span>
                            <span>{action.description}</span>
                            {action.isOptional && (
                              <Badge variant="outline">조건적</Badge>
                            )}
                            {action.isFileUpload && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                                TestFileManager
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                          <div className="bg-muted p-3 rounded font-mono text-sm">
                            {action.originalCode}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`optional-${action.id}`}
                                checked={action.isOptional}
                                onCheckedChange={(checked) =>
                                  updateAction(action.id, { isOptional: checked })
                                }
                              />
                              <Label htmlFor={`optional-${action.id}`}>조건적 처리</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={() => showHelp('conditionalProcessing')}
                              >
                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>

                            {action.type === 'click' && (
                              <>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`stable-click-${action.id}`}
                                    checked={action.useStableClick || false}
                                    onCheckedChange={(checked) =>
                                      updateAction(action.id, { useStableClick: checked })
                                    }
                                  />
                                  <Label htmlFor={`stable-click-${action.id}`}>안정적 클릭</Label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={() => showHelp('stableClick')}
                                  >
                                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`precise-click-${action.id}`}
                                    checked={action.usePreciseClick || false}
                                    onCheckedChange={(checked) =>
                                      updateAction(action.id, { usePreciseClick: checked })
                                    }
                                  />
                                  <Label htmlFor={`precise-click-${action.id}`}>정밀한 클릭</Label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={() => showHelp('preciseClick')}
                                  >
                                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                </div>
                              </>
                            )}

                            {action.isFileUpload && (
                              <div className="flex items-center space-x-2">
                                <Upload className="h-4 w-4 text-orange-600" />
                                <Label className="text-orange-700 font-medium">파일 업로드 설정</Label>
                              </div>
                            )}

                            {action.isOptional && (
                              <>
                                <div>
                                  <Label>처리 방식</Label>
                                  <Select
                                    value={action.conditionType}
                                    onValueChange={(value: PlaywrightAction['conditionType']) =>
                                      updateAction(action.id, { conditionType: value })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="try-catch">Try-Catch (안전)</SelectItem>
                                      <SelectItem value="if-exists">존재 확인</SelectItem>
                                      <SelectItem value="wait-for">대기 후 실행</SelectItem>
                                      <SelectItem value="loop">반복 실행</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label>타임아웃 (ms)</Label>
                                  <Select
                                    value={action.timeout.toString()}
                                    onValueChange={(value) =>
                                      updateAction(action.id, { timeout: parseInt(value) })
                                    }
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

                                {action.conditionType === 'loop' && (
                                  <div>
                                    <Label>최대 시도 횟수</Label>
                                    <Select
                                      value={action.maxAttempts.toString()}
                                      onValueChange={(value) =>
                                        updateAction(action.id, { maxAttempts: parseInt(value) })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="1">1회</SelectItem>
                                        <SelectItem value="3">3회</SelectItem>
                                        <SelectItem value="5">5회</SelectItem>
                                        <SelectItem value="10">10회</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                {action.isFileUpload && (
                                  <>
                                    <div>
                                      <Label>파일 타입</Label>
                                      <Select
                                        value={action.fileType || 'image'}
                                        onValueChange={(value: PlaywrightAction['fileType']) =>
                                          updateAction(action.id, { fileType: value })
                                        }
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

                                    <div>
                                      <Label>파일명</Label>
                                      <Select
                                        value={action.fileName || 'test-file'}
                                        onValueChange={(value) =>
                                          updateAction(action.id, { fileName: value })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="test-file">test-file</SelectItem>
                                          <SelectItem value="official-id">official-id</SelectItem>
                                          <SelectItem value="document">document</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div>
                                      <Label>파일 크기</Label>
                                      <Select
                                        value={action.fileSize || 'small'}
                                        onValueChange={(value: PlaywrightAction['fileSize']) =>
                                          updateAction(action.id, { fileSize: value })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="small">작음 ({'<'} 1MB)</SelectItem>
                                          <SelectItem value="medium">보통 (1-5MB)</SelectItem>
                                          <SelectItem value="large">큼 (5-10MB)</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="col-span-2">
                                      <Label className="text-sm text-muted-foreground">
                                        원본 파일 경로: {action.originalFilePath}
                                      </Label>
                                    </div>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  <Button
                    onClick={(e) => {
                      console.log('버튼 클릭됨!', e);
                      generateOptimizedCode();
                    }}
                    className="w-full"
                    disabled={actions.length === 0}
                  >
                    최적화된 코드 생성 ({actions.length}개 액션)
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {optimizedCode ? (
                <div>
                  <Label htmlFor="optimized-code">최적화된 코드</Label>
                  <Textarea
                    id="optimized-code"
                    value={optimizedCode}
                    readOnly
                    className="min-h-[400px] font-mono text-sm"
                  />
                  <div className="flex gap-2 mt-2">
                    {scenarioId && onSaveAndReturn && (
                      <>
                        <Button
                          onClick={handleSaveAndReturn}
                          disabled={isSaving}
                          className="gap-2"
                        >
                          <Save className="h-4 w-4" />
                          {isSaving ? '저장 중...' : '최적화된 코드로 저장'}
                        </Button>
                        <Button
                          onClick={() => {
                            if (originalCode && onSaveAndReturn) {
                              console.log('원본 코드로 복원:', originalCode.slice(0, 200));
                              onSaveAndReturn(originalCode);
                            }
                          }}
                          variant="outline"
                          disabled={isSaving}
                        >
                          원본 코드로 복원
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => navigator.clipboard.writeText(optimizedCode)}
                      variant="outline"
                    >
                      클립보드에 복사
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const blob = new Blob([optimizedCode], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'optimized-test.spec.ts';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      파일로 다운로드
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  요소를 설정하고 최적화된 코드를 생성해주세요.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}