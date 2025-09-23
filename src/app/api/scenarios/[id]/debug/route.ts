import { NextRequest, NextResponse } from 'next/server';
import { PlaywrightExecutor } from '@/lib/playwright/executor';
import { prisma } from '@/lib/db/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const scenarioId = resolvedParams.id;

    // Get scenario from database
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId }
    });

    if (!scenario) {
      return NextResponse.json(
        { error: '시나리오를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Start debug mode
    const result = await PlaywrightExecutor.startDebugMode(
      scenario.code,
      scenarioId,
      scenario.targetUrl
    );

    return NextResponse.json({
      sessionId: result.sessionId,
      message: result.message,
    });

  } catch (error) {
    console.error('Debug start error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '디버그 모드 시작에 실패했습니다' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: '세션 ID가 필요합니다' },
        { status: 400 }
      );
    }

    const result = await PlaywrightExecutor.stopDebugSession(sessionId);

    return NextResponse.json({
      message: result.message,
    });

  } catch (error) {
    console.error('Debug stop error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '디버그 세션 종료에 실패했습니다' },
      { status: 500 }
    );
  }
}

// Get active debug sessions
export async function GET() {
  try {
    const activeSessions = PlaywrightExecutor.getActiveDebugSessions();

    return NextResponse.json({
      sessions: activeSessions,
    });

  } catch (error) {
    console.error('Debug sessions error:', error);
    return NextResponse.json(
      { error: '디버그 세션 목록을 가져오는데 실패했습니다' },
      { status: 500 }
    );
  }
}