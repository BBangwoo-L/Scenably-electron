"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Textarea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/shared/ui";
import { LoadingButton } from "@/shared/components";
import {
  Save,
  X,
  Eye,
  Code2,
  FileText,
  Maximize,
  CheckCircle2,
  AlertCircle,
  Copy,
  RotateCcw
} from "lucide-react";
import { useConfirmModalStore } from "@/stores/confirm-modal-store";

interface FullscreenCodeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  onSave: (code: string) => void;
  title?: string;
  placeholder?: string;
}

export function FullscreenCodeEditor({
  isOpen,
  onClose,
  code,
  onSave,
  title = "코드 편집",
  placeholder = "E2E 테스트 코드를 여기에 입력하세요..."
}: FullscreenCodeEditorProps) {
  const [editedCode, setEditedCode] = useState(code);
  const [activeTab, setActiveTab] = useState("edit");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { openConfirmModal } = useConfirmModalStore();

  useEffect(() => {
    if (isOpen) {
      setEditedCode(code);
      setHasChanges(false);
      // 모달이 열릴 때 포커스 설정
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, code]);

  useEffect(() => {
    setHasChanges(editedCode !== code);
  }, [editedCode, code]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      onSave(editedCode);
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (hasChanges) {
      const confirmed = await openConfirmModal({ message: "변경사항이 저장되지 않습니다. 정말 취소하시겠습니까?", isAlert: false });
      if (confirmed) {
        setEditedCode(code);
        setHasChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleReset = async () => {
    const confirmed = await openConfirmModal({ message: "원본 코드로 되돌리시겠습니까? 현재 변경사항은 모두 사라집니다.", isAlert: false });
    if (confirmed) {
      setEditedCode(code);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedCode);
      // 여기에 토스트 알림을 추가할 수 있습니다
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const getCodeStats = () => {
    const lines = editedCode.split('\n').length;
    const chars = editedCode.length;
    const words = editedCode.trim() ? editedCode.trim().split(/\s+/).length : 0;
    const tests = (editedCode.match(/test\s*\(/g) || []).length;
    const expects = (editedCode.match(/expect\s*\(/g) || []).length;
    const pageActions = (editedCode.match(/page\.[a-zA-Z]+\(/g) || []).length;

    return { lines, chars, words, tests, expects, pageActions };
  };

  const stats = getCodeStats();
  const isValidCode = editedCode.trim().length > 0 && stats.tests > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="w-[95vw] h-[90vh] max-w-none overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Maximize className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {stats.lines}줄 • {stats.chars}자
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {stats.tests}개 테스트
                  </span>
                  <span className="flex items-center gap-1">
                    <Code2 className="h-3 w-3" />
                    {stats.pageActions}개 액션
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasChanges && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm">
                  <AlertCircle className="h-3 w-3" />
                  변경사항 있음
                </div>
              )}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isValidCode
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-500 bg-gray-50'
              }`}>
                <CheckCircle2 className="h-3 w-3" />
                {isValidCode ? '유효한 코드' : '코드 검증 필요'}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex items-center justify-between border-b">
              <TabsList className="grid grid-cols-2 w-80">
                <TabsTrigger value="edit" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  편집
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  미리보기
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2 mr-4">
                <LoadingButton
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  icon={<Copy className="h-3 w-3" />}
                >
                  복사
                </LoadingButton>
                <LoadingButton
                  size="sm"
                  variant="ghost"
                  onClick={handleReset}
                  disabled={!hasChanges}
                  icon={<RotateCcw className="h-3 w-3" />}
                >
                  초기화
                </LoadingButton>
              </div>
            </div>

            <TabsContent value="edit" className="flex-1 overflow-hidden mt-0 p-6">
              <div className="h-full flex flex-col gap-3">
                <Label htmlFor="code-editor" className="text-sm font-medium">
                  테스트 스크립트 편집
                </Label>
                <Textarea
                  ref={textareaRef}
                  id="code-editor"
                  value={editedCode}
                  onChange={(e) => setEditedCode(e.target.value)}
                  className="flex-1 resize-none font-mono text-sm leading-relaxed border-2 border-gray-200 focus:border-blue-500 transition-colors"
                  placeholder={placeholder}
                  style={{ minHeight: '100%' }}
                />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-hidden mt-0 p-6">
              <div className="h-full flex flex-col gap-3">
                <Label className="text-sm font-medium">코드 미리보기</Label>
                <div className="flex-1 overflow-auto border-2 border-gray-200 rounded-lg">
                  {editedCode.trim() ? (
                    <pre className="p-6 text-sm font-mono leading-relaxed bg-gray-50">
                      <code className="text-gray-800">
                        {editedCode.split('\n').map((line, index) => (
                          <div key={index} className="flex">
                            <span className="text-gray-400 w-12 text-right mr-4 select-none flex-shrink-0">
                              {index + 1}
                            </span>
                            <span className="flex-1">{line || ' '}</span>
                          </div>
                        ))}
                      </code>
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <Code2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">코드를 입력해주세요</p>
                        <p className="text-sm">편집 탭으로 이동하여 테스트 코드를 작성하세요</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              마지막 저장: {hasChanges ? '저장되지 않음' : '최신'}
            </div>
            <div className="flex items-center gap-2">
              <LoadingButton
                variant="outline"
                onClick={handleCancel}
                icon={<X className="h-4 w-4" />}
                disabled={isSaving}
              >
                취소
              </LoadingButton>
              <LoadingButton
                onClick={handleSave}
                icon={<Save className="h-4 w-4" />}
                isLoading={isSaving}
                loadingText="저장 중..."
                disabled={!hasChanges}
              >
                저장
              </LoadingButton>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}