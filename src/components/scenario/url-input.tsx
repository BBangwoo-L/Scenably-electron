"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";
import { Globe, ArrowRight } from "lucide-react";

export function UrlInput() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) return;

    try {
      setIsLoading(true);

      // Validate URL format
      let validUrl = url.trim();
      if (!validUrl.startsWith('https://') && !validUrl.startsWith('http://')) {
        validUrl = `https://${validUrl}`;
      }
      new URL(validUrl); // This will throw if invalid

      // Navigate to scenario builder with the URL
      router.push(`/scenario/new?url=${encodeURIComponent(validUrl)}`);
    } catch (error) {
      alert("올바른 URL을 입력해주세요");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">웹사이트 URL</Label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="url"
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!url.trim() || isLoading}
        className="w-full"
      >
        {isLoading ? (
          "로딩 중..."
        ) : (
          <>
            테스트 생성 시작
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}