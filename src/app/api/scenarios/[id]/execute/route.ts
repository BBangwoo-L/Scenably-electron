import { NextRequest, NextResponse } from 'next/server';
import { ScenarioService } from '@/lib/db/scenario';
import { PlaywrightExecutor } from '@/lib/playwright/executor';
import { ExecutionStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get the scenario
    const scenario = await ScenarioService.findById(id);
    if (!scenario) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }

    // Validate the scenario code
    const validation = await PlaywrightExecutor.validateScenarioCode(scenario.code);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid scenario code', details: validation.errors },
        { status: 400 }
      );
    }

    // Create an execution record
    const execution = await ScenarioService.createExecution(id);

    try {
      // Update status to running
      await ScenarioService.updateExecution(execution.id, {
        status: ExecutionStatus.RUNNING,
      });

      // Execute the scenario synchronously
      console.log(`▶️ Executing scenario ${id} synchronously`);
      const result = await PlaywrightExecutor.executeScenario(scenario.code, id);
      console.log(`✅ Execution completed - success: ${result.success}`);

      // Update with results
      const finalStatus = result.success ? ExecutionStatus.SUCCESS : ExecutionStatus.FAILED;

      await ScenarioService.updateExecution(execution.id, {
        status: finalStatus,
        result: result.output,
        error: result.error,
        completedAt: new Date(),
      });

      return NextResponse.json({
        executionId: execution.id,
        status: finalStatus,
        result: result.output,
        error: result.error,
        success: result.success,
        message: result.success ? 'Test executed successfully' : 'Test execution failed',
      });

    } catch (error) {
      console.error('❌ Execution error:', error);

      // Update execution status to failed
      await ScenarioService.updateExecution(execution.id, {
        status: ExecutionStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown execution error',
        completedAt: new Date(),
      });

      return NextResponse.json({
        executionId: execution.id,
        status: ExecutionStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown execution error',
        success: false,
        message: 'Test execution failed',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Execution start error:', error);
    return NextResponse.json(
      { error: 'Failed to start execution' },
      { status: 500 }
    );
  }
}

