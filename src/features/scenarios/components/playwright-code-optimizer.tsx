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
import { Save, Upload } from 'lucide-react';

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
  // 파일 업로드 전용 필드
  isFileUpload?: boolean;
  fileType?: 'image' | 'pdf' | 'text' | 'custom';
  fileName?: string;
  fileSize?: 'small' | 'medium' | 'large';
  originalFilePath?: string;
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

    // 파일 업로드 액션이 있는지 확인
    const hasFileUploads = actions.some(action => action.isFileUpload);
    const fileUploadActions = actions.filter(action => action.isFileUpload);

    // 헬퍼 함수들 추가 (파일 업로드가 있으면 TestFileManager 관련 코드도 추가)
    let helperFunctions = `
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

// 정밀한 버튼 클릭 헬퍼 함수 (위치 기반)
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

        // 방법 4: 다른 선택자로 찾기
        console.log('🔍 다른 선택자로 동일한 버튼 찾기 시도...');
        try {
          const alternativeSelectors = [
            'button:has-text("' + buttonText + '")',
            '[role="button"]:has-text("' + buttonText + '")',
            'input[type="button"][value="' + buttonText + '"]',
            'input[type="submit"][value="' + buttonText + '"]',
            '*:has-text("' + buttonText + '"):last'
          ];

          for (const selector of alternativeSelectors) {
            try {
              const altElement = page.locator(selector);
              const count = await altElement.count();
              if (count > 0) {
                const firstAlt = altElement.first();
                const altEnabled = await firstAlt.isEnabled();
                if (altEnabled) {
                  console.log('✅ 대안 선택자로 활성 버튼 발견:', selector);
                  await firstAlt.click({ timeout: timeout });
                  console.log('✅ 대안 선택자 클릭 성공!');
                  return true;
                }
              }
            } catch (altError) {
              continue;
            }
          }
        } catch (altSelectorError) {
          console.log('❌ 대안 선택자 시도 실패:', altSelectorError.message);
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

    // 파일 업로드가 있으면 TestFileManager 관련 함수 추가
    if (hasFileUploads) {
      helperFunctions += `

// 파일 업로드 헬퍼 함수
async function uploadTestFile(page, selector, fileConfig, options = {}) {
  const { fileType = 'image', fileName = 'test-file', fileSize = 'small' } = fileConfig;
  const timeout = options.timeout || 3000;

  try {
    let filePath;
    let localFileManager = null;

    // uploadTestFile 함수 내부에서 직접 TestFileManager 생성
    try {
      const path = require('path');
      const helperPath = path.join(process.cwd(), 'temp', 'test-utils', 'file-helpers');
      const fileHelpers = require(helperPath);
      localFileManager = new fileHelpers.TestFileManager();
      console.log('📁 uploadTestFile에서 TestFileManager 생성 성공');
    } catch (error) {
      console.warn('📁 uploadTestFile에서 TestFileManager 생성 실패:', error.message);
    }

    if (localFileManager) {
      // TestFileManager로 파일 생성
      switch (fileType) {
        case 'image':
          filePath = await localFileManager.createTestImage({ filename: fileName, size: fileSize });
          break;
        case 'pdf':
          filePath = await localFileManager.createTestPDF({ filename: fileName });
          break;
        case 'text':
          filePath = await localFileManager.createTestTextFile({ filename: fileName });
          break;
        default:
          filePath = await localFileManager.createTestImage({ filename: fileName, size: fileSize });
      }
      console.log('📄 테스트 파일 생성됨:', filePath);
    } else {
      // TestFileManager가 없으면 fallback 경로 사용
      console.warn('TestFileManager를 사용할 수 없습니다. 기본 파일 경로를 사용합니다.');
      const extensions = { image: 'png', pdf: 'pdf', text: 'txt' };
      const ext = extensions[fileType] || 'png';
      filePath = './test-files/' + fileName + '.' + ext;
    }

    // 숨겨진 파일 input 자동 감지 및 업로드
    const fileInputs = await page.locator('input[type="file"]').all();

    // 1. 보이는 파일 input 찾기
    const visibleFileInput = await fileInputs.find(async (input) => {
      const isVisible = await input.isVisible();
      return isVisible;
    });

    // 2. 숨겨진 파일 input 찾기
    const hiddenFileInput = await fileInputs.find(async (input) => {
      const isHidden = !(await input.isVisible());
      return isHidden;
    });

    // 3. 우선순위: 보이는 input → 숨겨진 input → 첫 번째 input
    const targetInput = visibleFileInput || hiddenFileInput || fileInputs[0];

    if (targetInput) {
      // 파일 업로드 시도
      await targetInput.setInputFiles(filePath);

      // 파일 업로드 검증 및 재시도 로직
      let uploadSuccess = false;
      let retryCount = 0;
      const maxRetries = 3;

      while (!uploadSuccess && retryCount < maxRetries) {
        // 파일이 제대로 들어갔는지 확인
        const uploadedFiles = await targetInput.evaluate((input: HTMLInputElement) => {
          return {
            fileCount: input.files?.length || 0,
            fileName: input.files?.[0]?.name || '',
            fileSize: input.files?.[0]?.size || 0
          };
        });

        console.log('업로드 시도 ' + (retryCount + 1) + ': 파일 수=' + uploadedFiles.fileCount + ', 파일명=' + uploadedFiles.fileName);

        if (uploadedFiles.fileCount > 0) {
          console.log('✅ 파일 업로드 성공!');
          uploadSuccess = true;
        } else {
          console.warn('❌ 파일 업로드 실패 (시도 ' + (retryCount + 1) + '/' + maxRetries + ')');
          retryCount++;

          if (retryCount < maxRetries) {
            // 잠시 대기 후 재시도
            await page.waitForTimeout(500);
            console.log('🔄 파일 업로드 재시도 중...');

            // 다른 input 요소들도 시도해보기
            if (retryCount === 1 && hiddenFileInput && targetInput !== hiddenFileInput) {
              console.log('숨겨진 input으로 재시도...');
              await hiddenFileInput.setInputFiles(filePath);
              const retryResult = await hiddenFileInput.evaluate((input: HTMLInputElement) => input.files?.length || 0);
              if (retryResult > 0) {
                console.log('✅ 숨겨진 input으로 업로드 성공!');
                uploadSuccess = true;
              }
            } else if (retryCount === 2 && visibleFileInput && targetInput !== visibleFileInput) {
              console.log('보이는 input으로 재시도...');
              await visibleFileInput.setInputFiles(filePath);
              const retryResult = await visibleFileInput.evaluate((input: HTMLInputElement) => input.files?.length || 0);
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
        return false;
      }

      if (options.waitAfter) await page.waitForTimeout(options.waitAfter);
      return true;
    } else {
      console.warn('파일 input을 찾을 수 없습니다.');
      return false;
    }
  } catch (error) {
    console.log('파일 업로드 실패 ' + selector + ': ' + error.message);
    return false;
  }
}`;
    }

    helperFunctions += `
`;

    // 시나리오 코드 먼저 처리
    let testManagerAdded = false;

    lines.forEach((line, index) => {
      const action = actions.find(a => a.line === index + 1);

      // test() 함수 찾아서 TestFileManager 변수만 추가
      if (!testManagerAdded && line.includes('test(') && line.includes('async')) {
        optimizedLines.push(line);

        // TestFileManager 변수 선언 추가 (파일 업로드가 있는 경우)
        if (hasFileUploads) {
          optimizedLines.push('  let globalFileManager = null;');
          optimizedLines.push('');
          optimizedLines.push('  // 테스트 시작 전 전역 TestFileManager 초기화 (cleanup용)');
          optimizedLines.push('  try {');
          optimizedLines.push('    console.log("현재 작업 디렉토리:", process.cwd());');
          optimizedLines.push('    const path = require("path");');
          optimizedLines.push('    const helperPath = path.join(process.cwd(), "temp", "test-utils", "file-helpers");');
          optimizedLines.push('    console.log("시도할 파일 경로:", helperPath);');
          optimizedLines.push('    const fileHelpers = require(helperPath);');
          optimizedLines.push('    globalFileManager = new fileHelpers.TestFileManager();');
          optimizedLines.push('    console.log("✅ 전역 TestFileManager 로드 성공!");');
          optimizedLines.push('  } catch (importError) {');
          optimizedLines.push('    console.warn("전역 TestFileManager를 찾을 수 없습니다:", importError.message);');
          optimizedLines.push('    globalFileManager = null;');
          optimizedLines.push('  }');
          optimizedLines.push('');
        }

        testManagerAdded = true;
        return;
      }

      // 파일 업로드 액션 특별 처리
      if (action && action.isFileUpload) {
        const selectorMatch = action.originalCode.match(/page\.setInputFiles\(['"]([^'"]+)['"]/);
        const selector = selectorMatch ? selectorMatch[1] : action.selector;

        if (action.isOptional) {
          switch (action.conditionType) {
            case 'try-catch':
              optimizedLines.push(`  try {`);
              optimizedLines.push(`    await uploadTestFile(page, '${selector}', {`);
              optimizedLines.push(`      fileType: '${action.fileType}',`);
              optimizedLines.push(`      fileName: '${action.fileName}',`);
              optimizedLines.push(`      fileSize: '${action.fileSize}'`);
              optimizedLines.push(`    }, { timeout: ${action.timeout} });`);
              optimizedLines.push(`  } catch (error) {`);
              optimizedLines.push(`    console.log('${action.description} - 파일 업로드를 건너뜁니다');`);
              optimizedLines.push(`  }`);
              break;
            default:
              optimizedLines.push(`  await uploadTestFile(page, '${selector}', {`);
              optimizedLines.push(`    fileType: '${action.fileType}',`);
              optimizedLines.push(`    fileName: '${action.fileName}',`);
              optimizedLines.push(`    fileSize: '${action.fileSize}'`);
              optimizedLines.push(`  }, { timeout: ${action.timeout} });`);
          }
        } else {
          // 필수 파일 업로드
          optimizedLines.push(`  // ${action.description} - TestFileManager로 변환됨`);
          optimizedLines.push(`  await uploadTestFile(page, '${selector}', {`);
          optimizedLines.push(`    fileType: '${action.fileType}',`);
          optimizedLines.push(`    fileName: '${action.fileName}',`);
          optimizedLines.push(`    fileSize: '${action.fileSize}'`);
          optimizedLines.push(`  });`);
        }
        return;
      }

      if (action && action.isOptional && !action.isFileUpload) {
        // 일반 조건적 처리로 변환
        switch (action.conditionType) {
          case 'try-catch':
            // 사용자가 정밀 클릭을 선택한 경우에만 사용

            optimizedLines.push(`  try {`);
            if (action.usePreciseClick && action.type === 'click') {
              // 버튼 텍스트 추출 (getByRole 패턴에서)
              const buttonTextMatch = action.originalCode.match(/getByRole\(['"]button['"],\s*\{\s*name:\s*['"]([^'"]+)['"]/);
              const buttonText = buttonTextMatch ? buttonTextMatch[1] : null;
              if (buttonText) {
                optimizedLines.push(`    // 사용자가 선택한 정밀한 "${buttonText}" 버튼 클릭`);
                optimizedLines.push(`    await clickPreciseButton(page, '${buttonText}', { timeout: ${action.timeout} });`);
              } else {
                optimizedLines.push(`    ${line}`);
              }
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
        if (action && action.type === 'click' && !action.isFileUpload && action.usePreciseClick) {
          // 버튼 텍스트 추출 (getByRole 패턴에서)
          const buttonTextMatch = action.originalCode.match(/getByRole\(['"]button['"],\s*\{\s*name:\s*['"]([^'"]+)['"]/);
          const buttonText = buttonTextMatch ? buttonTextMatch[1] : null;

          if (buttonText) {
            optimizedLines.push(`  // 사용자가 선택한 정밀한 "${buttonText}" 버튼 클릭`);
            optimizedLines.push(`  await clickPreciseButton(page, '${buttonText}');`);
          } else {
            optimizedLines.push(line);
          }
        } else {
          optimizedLines.push(line);
        }
      }
    });

    // 테스트 종료 전에 TestFileManager 정리 코드 추가
    if (hasFileUploads) {
      const testEndIndex = optimizedLines.length - 1;
      if (optimizedLines[testEndIndex]?.includes('});')) {
        optimizedLines.splice(testEndIndex, 0, '');
        optimizedLines.splice(testEndIndex, 0, '  // TestFileManager 정리');
        optimizedLines.splice(testEndIndex, 0, '  if (globalFileManager) {');
        optimizedLines.splice(testEndIndex + 1, 0, '    await globalFileManager.cleanup();');
        optimizedLines.splice(testEndIndex + 2, 0, '  }');
      }
    }

    // 헬퍼 함수들을 맨 아래에 추가
    if (hasFileUploads || actions.some(a => a.isOptional)) {
      optimizedLines.push('');
      optimizedLines.push('// ==================== 헬퍼 함수들 ====================');
      optimizedLines.push(helperFunctions);
    }

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
                            </div>

                            {action.type === 'click' && (
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id={`precise-click-${action.id}`}
                                  checked={action.usePreciseClick || false}
                                  onCheckedChange={(checked) =>
                                    updateAction(action.id, { usePreciseClick: checked })
                                  }
                                />
                                <Label htmlFor={`precise-click-${action.id}`}>정밀한 클릭</Label>
                              </div>
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

                                {action.isFileUpload && (
                                  <>
                                    <div>
                                      <Label>파일 타입</Label>
                                      <Select
                                        value={action.fileType || 'image'}
                                        onValueChange={(value: any) =>
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
                                        onValueChange={(value: any) =>
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