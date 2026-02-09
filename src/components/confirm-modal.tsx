"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useConfirmModalStore } from "@/stores/confirm-modal-store";

export function ConfirmModalContainer() {
  const { confirmModalPropsList, closeConfirmModal } = useConfirmModalStore();

  return (
    <>
      {confirmModalPropsList.map((modalProps) => (
        <ConfirmModalItem
          key={modalProps.id}
          {...modalProps}
          onClose={() => closeConfirmModal(modalProps.id)}
        />
      ))}
    </>
  );
}

interface ConfirmModalItemProps {
  id: string;
  title: string;
  message: string;
  isAlert: boolean;
  isPrompt: boolean;
  defaultValue: string;
  handleCancel: () => void;
  handleCheck: (value?: string) => void;
  onClose: () => void;
}

function ConfirmModalItem({
  title,
  message,
  isAlert,
  isPrompt,
  defaultValue,
  handleCancel,
  handleCheck,
  onClose,
}: ConfirmModalItemProps) {
  const [promptValue, setPromptValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPrompt) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isPrompt]);

  const onConfirm = () => {
    if (isPrompt) {
      handleCheck(promptValue);
    } else {
      handleCheck();
    }
    onClose();
  };

  const onCancel = () => {
    handleCancel();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>

        {isPrompt && (
          <div className="py-2">
            <Input
              ref={inputRef}
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(); }}
            />
          </div>
        )}

        <DialogFooter>
          {!isAlert && (
            <Button variant="outline" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button onClick={onConfirm}>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
