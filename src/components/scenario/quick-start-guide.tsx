"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Globe, Video, Code2, Zap, Play, Wand2 } from "lucide-react";

export function QuickStartGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          테스트 시나리오 생성 방법
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Globe className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-sm">1. 웹사이트 URL 입력</h3>
              <p className="text-xs text-muted-foreground mt-1">
                테스트할 웹사이트 URL을 입력하세요 (예: https://example.com)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Code2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-sm">2. 템플릿 생성</h3>
              <p className="text-xs text-muted-foreground mt-1">
                "템플릿" 모드를 사용하여 일반적인 테스트 패턴이 포함된 인터랙티브 코드 템플릿을 받으세요
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Video className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-sm">3. 상호작용 레코딩</h3>
              <p className="text-xs text-muted-foreground mt-1">
                또는 "레코딩" 모드를 사용하여 브라우저를 열고 실제 상호작용을 캡처하세요
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Wand2 className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-sm">4. AI 개선</h3>
              <p className="text-xs text-muted-foreground mt-1">
                "AI로 수정하기"를 사용하여 자연어 요청으로 테스트를 개선하세요
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <Play className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-sm">5. 저장 및 실행</h3>
              <p className="text-xs text-muted-foreground mt-1">
                시나리오를 저장하고 테스트를 실행하여 웹사이트 기능을 검증하세요
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-sm text-blue-900 mb-2">💡 프로 팁:</h4>
          <ul className="space-y-1 text-xs text-blue-800">
            <li>• 빠른 설정을 위해 템플릿 모드부터 시작하세요</li>
            <li>• 복잡한 사용자 상호작용에는 레코딩 모드를 사용하세요</li>
            <li>• AI에게 접근성 검사, 성능 테스트, 폼 검증 추가를 요청해보세요</li>
            <li>• 같은 시나리오를 여러 번 실행하여 다른 브라우저에서 테스트하세요</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}