"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Badge } from "@/shared/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface ExecutionDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  execution: {
    id: string;
    status: string;
    result?: string | null;
    startedAt: string;
    completedAt?: string | null;
  } | null;
}

export function ExecutionDetailDialog({ isOpen, onClose, execution }: ExecutionDetailDialogProps) {
  if (!execution) return null;

  let parsedResult: any = null;
  try {
    if (execution.result) {
      parsedResult = JSON.parse(execution.result);
    }
  } catch {
    parsedResult = { raw: execution.result };
  }

  const statusConfig = {
    SUCCESS: { icon: <CheckCircle className="h-5 w-5 text-green-500" />, className: "bg-green-100 text-green-800" },
    FAILED: { icon: <XCircle className="h-5 w-5 text-red-500" />, className: "bg-red-100 text-red-800" },
    FAILURE: { icon: <XCircle className="h-5 w-5 text-red-500" />, className: "bg-red-100 text-red-800" },
    RUNNING: { icon: <Clock className="h-5 w-5 text-blue-500 animate-spin" />, className: "bg-blue-100 text-blue-800" },
  }[execution.status] || { icon: <Clock className="h-5 w-5 text-gray-500" />, className: "bg-gray-100 text-gray-800" };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {statusConfig.icon}
            실행 결과 상세
          </DialogTitle>
          <DialogDescription>
            실행 ID: {execution.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">상태: </span>
              <Badge variant="secondary" className={statusConfig.className}>
                {execution.status}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">시작: </span>
              {new Date(execution.startedAt).toLocaleString()}
            </div>
            {execution.completedAt && (
              <div>
                <span className="text-muted-foreground">완료: </span>
                {new Date(execution.completedAt).toLocaleString()}
              </div>
            )}
          </div>

          {parsedResult && (
            <>
              {parsedResult.error && (
                <div>
                  <h4 className="font-medium text-sm mb-1 text-red-600">에러</h4>
                  <pre className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                    {parsedResult.error}
                  </pre>
                </div>
              )}

              {parsedResult.stdout && (
                <div>
                  <h4 className="font-medium text-sm mb-1">표준 출력 (stdout)</h4>
                  <pre className="bg-muted rounded-lg p-3 text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto">
                    {parsedResult.stdout}
                  </pre>
                </div>
              )}

              {parsedResult.stderr && (
                <div>
                  <h4 className="font-medium text-sm mb-1 text-orange-600">표준 에러 (stderr)</h4>
                  <pre className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto">
                    {parsedResult.stderr}
                  </pre>
                </div>
              )}

              {parsedResult.exitCode !== undefined && (
                <div className="text-sm">
                  <span className="text-muted-foreground">종료 코드: </span>
                  <span className={parsedResult.exitCode === 0 ? 'text-green-600' : 'text-red-600'}>
                    {parsedResult.exitCode}
                  </span>
                </div>
              )}

              {parsedResult.raw && (
                <div>
                  <h4 className="font-medium text-sm mb-1">결과</h4>
                  <pre className="bg-muted rounded-lg p-3 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                    {parsedResult.raw}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
