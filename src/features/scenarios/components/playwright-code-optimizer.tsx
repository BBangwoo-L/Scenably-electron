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
import { ArrowLeft, Save } from 'lucide-react';

interface PlaywrightAction {
  id: string;
  line: number;
  type: 'click' | 'fill' | 'other';
  originalCode: string;
  selector: string;
  description: string;
  isOptional: boolean;
  conditionType: 'try-catch' | 'if-exists' | 'wait-for' | 'loop';
  timeout: number;
  maxAttempts: number;
}

interface PlaywrightCodeOptimizerProps {
  initialCode?: string;
  onCodeChange?: (optimizedCode: string) => void;
  scenarioId?: string | null;
  onSaveAndReturn?: (optimizedCode: string) => Promise<void>;
}

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
    let optimizedLines: string[] = [];

    // 헬퍼 함수들 추가
    const helperFunctions = `
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
    console.log(\`요소 \${selector}를 찾을 수 없습니다.\`);
    return false;
  }
}

// 조건적 입력 헬퍼 함수
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
    console.log(\`요소 \${selector}를 찾을 수 없습니다.\`);
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
}
`;

    // 함수 정의 부분에 헬퍼 함수 추가
    let helperAdded = false;

    lines.forEach((line, index) => {
      const action = actions.find(a => a.line === index + 1);

      if (!helperAdded && line.includes('test(') && line.includes('async')) {
        optimizedLines.push(line);
        optimizedLines.push(helperFunctions);
        helperAdded = true;
        return;
      }

      if (action && action.isOptional) {
        // 조건적 처리로 변환
        switch (action.conditionType) {
          case 'try-catch':
            optimizedLines.push(`  try {`);
            optimizedLines.push(`    ${line}`);
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
        optimizedLines.push(line);
      }
    });

    const result = optimizedLines.join('\n');
    setOptimizedCode(result);
    onCodeChange?.(result);
  }, [originalCode, actions, onCodeChange]);

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
                <Label htmlFor="original-code">원본 Playwright 코드</Label>
                <Textarea
                  id="original-code"
                  placeholder="Playwright 테스트 코드를 여기에 붙여넣으세요..."
                  value={originalCode}
                  onChange={(e) => setOriginalCode(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
              <Button
                onClick={() => parsePlaywrightCode(originalCode)}
                disabled={!originalCode.trim()}
              >
                코드 분석하기
              </Button>
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
                    {actions.map((action) => (
                      <AccordionItem key={action.id} value={action.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <Badge variant={action.type === 'click' ? 'default' : 'secondary'}>
                              {action.type}
                            </Badge>
                            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                              줄 {action.line}
                            </span>
                            <span>{action.description}</span>
                            {action.isOptional && (
                              <Badge variant="outline">조건적</Badge>
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
                            </div>

                            {action.isOptional && (
                              <>
                                <div>
                                  <Label>처리 방식</Label>
                                  <Select
                                    value={action.conditionType}
                                    onValueChange={(value: any) =>
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
                      <Button
                        onClick={handleSaveAndReturn}
                        disabled={isSaving}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? '저장 중...' : '저장하고 돌아가기'}
                      </Button>
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