"use client";

import { useState } from "react";
import { EnhancedCodePreview } from "./enhanced-code-preview";
import { FullscreenCodeEditor } from "./fullscreen-code-editor";
import type { ScenarioData } from "../hooks";

interface CodeEditorProps {
  scenarioData: ScenarioData;
  onUpdate: (updates: Partial<ScenarioData>) => void;
}

export function CodeEditor({ scenarioData, onUpdate }: CodeEditorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCodeSave = (newCode: string) => {
    onUpdate({ code: newCode });
  };

  const handleFullScreen = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <EnhancedCodePreview
        code={scenarioData.code}
        title="E2E 테스트 코드"
        maxLines={12}
        onEdit={() => setIsModalOpen(true)}
        onFullScreen={handleFullScreen}
        showStats={true}
        className="shadow-sm hover:shadow-md transition-shadow"
      />

      <FullscreenCodeEditor
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        code={scenarioData.code}
        onSave={handleCodeSave}
        title="E2E 테스트 코드 편집"
        placeholder="E2E 테스트 코드를 여기에 입력하세요..."
      />
    </>
  );
}