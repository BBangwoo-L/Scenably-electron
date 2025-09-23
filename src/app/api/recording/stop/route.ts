import { NextRequest, NextResponse } from 'next/server';
import { PlaywrightRecorder } from '@/lib/playwright/recorder';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, saveCode = true } = body;

    console.log(`🟡 API: Received stop request - sessionId: ${sessionId}, saveCode: ${saveCode}`);

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const result = await PlaywrightRecorder.stopRecording(sessionId, saveCode);

    console.log(`🟡 API: Recorder result - message: ${result.message}, codeLength: ${result.code?.length || 0}`);

    const responseData = {
      code: saveCode ? result.code : null,
      message: result.message,
    };

    console.log(`🟡 API: Sending response - saveCode: ${saveCode}, responseCodeLength: ${responseData.code?.length || 0}`);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Recording stop error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to stop recording' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: '세션 ID가 필요합니다' },
        { status: 400 }
      );
    }

    const session = await PlaywrightRecorder.getRecordingStatus(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: '세션을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json(session);

  } catch (error) {
    console.error('Recording status error:', error);
    return NextResponse.json(
      { error: '레코딩 상태를 가져오는데 실패했습니다' },
      { status: 500 }
    );
  }
}