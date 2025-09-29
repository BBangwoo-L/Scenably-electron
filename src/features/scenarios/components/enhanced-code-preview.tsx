"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { LoadingButton } from "@/shared/components";
import {
  Code2,
  Edit,
  Eye,
  EyeOff,
  FileText,
  CheckCircle2,
  Play,
  Maximize2
} from "lucide-react";

interface EnhancedCodePreviewProps {
  code: string;
  title?: string;
  maxLines?: number;
  onEdit?: () => void;
  onFullScreen?: () => void;
  showStats?: boolean;
  className?: string;
}

export function EnhancedCodePreview({
  code,
  title = "테스트 코드",
  maxLines = 12,
  onEdit,
  onFullScreen,
  showStats = true,
  className = ""
}: EnhancedCodePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const lines = code.split('\n').filter(line => line.trim() !== '');
  const isLongCode = lines.length > maxLines;
  const displayLines = isExpanded ? lines : lines.slice(0, maxLines);

  const getCodeAnalysis = () => {
    const testCount = (code.match(/test\s*\(/g) || []).length;
    const expectCount = (code.match(/expect\s*\(/g) || []).length;
    const pageActions = (code.match(/page\.[a-zA-Z]+\(/g) || []).length;
    const assertions = (code.match(/\.toBe|\.toEqual|\.toContain|\.toBeTruthy/g) || []).length;

    return { testCount, expectCount, pageActions, assertions };
  };

  const analysis = getCodeAnalysis();
  const hasContent = code.trim().length > 0;

  return (
    <Card className={`group hover:shadow-md transition-all duration-200 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Code2 className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {showStats && hasContent && (
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {analysis.testCount}개 테스트
                  </span>
                  <span className="flex items-center gap-1">
                    <Play className="h-3 w-3" />
                    {analysis.pageActions}개 액션
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {lines.length}줄
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onFullScreen && (
              <LoadingButton
                size="sm"
                variant="outline"
                onClick={onFullScreen}
                icon={<Maximize2 className="h-3 w-3" />}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                전체화면
              </LoadingButton>
            )}
            {onEdit && (
              <LoadingButton
                size="sm"
                variant="default"
                onClick={onEdit}
                icon={<Edit className="h-3 w-3" />}
              >
                편집
              </LoadingButton>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <Code2 className="h-8 w-8 text-gray-400 mb-3" />
            <p className="text-gray-500 font-medium">아직 코드가 없습니다</p>
            <p className="text-sm text-gray-400 mb-4">편집 버튼을 눌러 테스트 코드를 작성해보세요</p>
            {onEdit && (
              <LoadingButton
                onClick={onEdit}
                icon={<Edit className="h-4 w-4" />}
              >
                코드 작성하기
              </LoadingButton>
            )}
          </div>
        ) : (
          <>
            <div className="relative group/code">
              <pre className="bg-gray-50 border rounded-lg p-4 text-sm font-mono overflow-x-auto leading-relaxed">
                <code className="text-gray-800">
                  {displayLines.map((line, index) => (
                    <div key={index} className="flex">
                      <span className="text-gray-400 w-8 text-right mr-4 select-none flex-shrink-0">
                        {isExpanded ? index + 1 : index + 1}
                      </span>
                      <span className="flex-1">{line || ' '}</span>
                    </div>
                  ))}
                  {!isExpanded && isLongCode && (
                    <div className="flex items-center text-gray-400 mt-2">
                      <span className="w-8 text-right mr-4">...</span>
                      <span className="italic">({lines.length - maxLines}줄 더 있음)</span>
                    </div>
                  )}
                </code>
              </pre>
            </div>

            {isLongCode && (
              <div className="flex justify-center">
                <LoadingButton
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsExpanded(!isExpanded)}
                  icon={isExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  {isExpanded ?
                    `접기 (${lines.length - maxLines}줄 숨기기)` :
                    `전체 보기 (${lines.length - maxLines}줄 더 보기)`
                  }
                </LoadingButton>
              </div>
            )}

            {showStats && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{lines.length}줄</span>
                  <span>{code.length}자</span>
                  <span>{code.split(' ').length}단어</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 text-green-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>{analysis.expectCount + analysis.assertions}개 검증</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}