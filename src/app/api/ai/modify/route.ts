import { NextRequest, NextResponse } from 'next/server';
import { ClaudeService } from '@/lib/ai/claude';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentCode, modificationRequest, targetUrl } = body;

    if (!currentCode || !modificationRequest) {
      return NextResponse.json(
        { error: 'Missing required fields: currentCode, modificationRequest' },
        { status: 400 }
      );
    }

    const result = await ClaudeService.modifyScenario({
      currentCode,
      modificationRequest,
      targetUrl: targetUrl || '',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI modification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to modify scenario' },
      { status: 500 }
    );
  }
}