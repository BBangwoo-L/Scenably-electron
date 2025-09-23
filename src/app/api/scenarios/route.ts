import { NextRequest, NextResponse } from 'next/server';
import { ScenarioService } from '@/lib/db/scenario';

export async function GET() {
  try {
    const scenarios = await ScenarioService.findAll();
    return NextResponse.json(scenarios);
  } catch (error) {
    console.error('Failed to fetch scenarios:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, targetUrl, code } = body;

    if (!name || !targetUrl || !code) {
      return NextResponse.json(
        { error: 'Missing required fields: name, targetUrl, code' },
        { status: 400 }
      );
    }

    const scenario = await ScenarioService.create({
      name,
      description,
      targetUrl,
      code,
    });

    return NextResponse.json(scenario, { status: 201 });
  } catch (error) {
    console.error('Failed to create scenario:', error);
    return NextResponse.json(
      { error: 'Failed to create scenario' },
      { status: 500 }
    );
  }
}