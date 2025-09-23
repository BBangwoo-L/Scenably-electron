import { NextRequest, NextResponse } from 'next/server';
import { ScenarioService } from '@/lib/db/scenario';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const scenario = await ScenarioService.findById(id);

    if (!scenario) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(scenario);
  } catch (error) {
    console.error('Failed to fetch scenario:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenario' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, targetUrl, code } = body;

    const scenario = await ScenarioService.update(id, {
      name,
      description,
      targetUrl,
      code,
    });

    return NextResponse.json(scenario);
  } catch (error) {
    console.error('Failed to update scenario:', error);
    return NextResponse.json(
      { error: 'Failed to update scenario' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await ScenarioService.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete scenario:', error);
    return NextResponse.json(
      { error: 'Failed to delete scenario' },
      { status: 500 }
    );
  }
}