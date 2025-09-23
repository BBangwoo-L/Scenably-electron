import { prisma } from './prisma'
import { Scenario, Execution, ExecutionStatus } from '@prisma/client'

export type ScenarioWithExecutions = Scenario & {
  executions: Execution[]
}

export class ScenarioService {
  static async create(data: {
    name: string
    description?: string
    targetUrl: string
    code: string
  }): Promise<Scenario> {
    return prisma.scenario.create({
      data,
    })
  }

  static async findAll(): Promise<ScenarioWithExecutions[]> {
    return prisma.scenario.findMany({
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 5, // Latest 5 executions per scenario
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  static async findById(id: string): Promise<ScenarioWithExecutions | null> {
    return prisma.scenario.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
        },
      },
    })
  }

  static async update(id: string, data: {
    name?: string
    description?: string
    targetUrl?: string
    code?: string
  }): Promise<Scenario> {
    return prisma.scenario.update({
      where: { id },
      data,
    })
  }

  static async delete(id: string): Promise<void> {
    await prisma.scenario.delete({
      where: { id },
    })
  }

  static async createExecution(scenarioId: string): Promise<Execution> {
    console.log(`📝 Creating new execution for scenario: ${scenarioId}`);

    const execution = await prisma.execution.create({
      data: {
        scenarioId,
        status: ExecutionStatus.PENDING,
      },
    });

    console.log(`✅ Created execution: ${execution.id} with status: ${execution.status} at ${execution.startedAt}`);
    return execution;
  }

  static async updateExecution(id: string, data: {
    status?: ExecutionStatus
    result?: string
    error?: string
    completedAt?: Date
  }): Promise<Execution> {
    console.log(`📝 Updating execution ${id} with status: ${data.status}`);

    const execution = await prisma.execution.update({
      where: { id },
      data,
    });

    console.log(`✅ Updated execution: ${execution.id} to status: ${execution.status}`);
    return execution;
  }
}