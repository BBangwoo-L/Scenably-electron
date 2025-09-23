import { NextRequest, NextResponse } from 'next/server';
import { PlaywrightRecorder } from '@/lib/playwright/recorder';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, mode = 'interactive' } = body;

    console.log('📝 Recording start - Raw URL received:', url);

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Normalize URL to prevent duplication
    let normalizedUrl = url.trim();
    if (normalizedUrl.includes('https:// https://')) {
      normalizedUrl = normalizedUrl.replace('https:// https://', 'https://');
      console.log('🔧 Fixed duplicate protocol in URL:', normalizedUrl);
    }

    console.log('📝 Recording start - Normalized URL:', normalizedUrl);

    if (mode === 'headless') {
      // Generate interactive code template without opening browser
      const code = await PlaywrightRecorder.startHeadlessRecording(normalizedUrl);
      return NextResponse.json({
        mode: 'headless',
        code,
        message: 'Interactive code template generated',
      });
    } else {
      // Start interactive recording with browser
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const result = await PlaywrightRecorder.startRecording(normalizedUrl, sessionId);

      return NextResponse.json({
        mode: 'interactive',
        sessionId: result.sessionId,
        message: result.message,
      });
    }

  } catch (error) {
    console.error('Recording start error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start recording' },
      { status: 500 }
    );
  }
}