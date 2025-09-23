import { ScenarioList } from "@/components/scenario/scenario-list";
import { UrlInput } from "@/components/scenario/url-input";
import { QuickStartGuide } from "@/components/scenario/quick-start-guide";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export default function Home() {
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">E2E 테스트 관리자</h1>
        <p className="text-muted-foreground">
          AI 도움으로 웹사이트 E2E 테스트를 생성, 관리, 실행하세요
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>새 테스트 시나리오 생성</CardTitle>
            <CardDescription>
              URL을 입력하여 새로운 E2E 테스트 시나리오를 만드세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UrlInput />
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>테스트 시나리오</CardTitle>
              <CardDescription>
                기존 테스트 시나리오를 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScenarioList />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <QuickStartGuide />
      </div>
    </div>
  );
}
