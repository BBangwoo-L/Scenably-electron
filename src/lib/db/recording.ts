import { prisma } from './prisma'
import { RecordingSession, RecordingStatus } from '@prisma/client'

export class RecordingService {
  static async createSession(data: {
    url: string
    outputFile: string
    processId?: number
  }): Promise<RecordingSession> {
    return prisma.recordingSession.create({
      data: {
        ...data,
        status: RecordingStatus.STARTING,
      },
    })
  }

  static async findById(id: string): Promise<RecordingSession | null> {
    return prisma.recordingSession.findUnique({
      where: { id },
    })
  }

  static async updateSession(id: string, data: {
    status?: RecordingStatus
    processId?: number
    outputFile?: string
  }): Promise<RecordingSession> {
    return prisma.recordingSession.update({
      where: { id },
      data,
    })
  }

  static async deleteSession(id: string): Promise<void> {
    await prisma.recordingSession.delete({
      where: { id },
    })
  }

  static async findActiveSessionByUrl(url: string): Promise<RecordingSession | null> {
    return prisma.recordingSession.findFirst({
      where: {
        url,
        status: {
          in: [RecordingStatus.STARTING, RecordingStatus.RECORDING]
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async cleanupOldSessions(): Promise<void> {
    // Delete sessions older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    await prisma.recordingSession.deleteMany({
      where: {
        createdAt: { lt: oneHourAgo },
        status: {
          in: [RecordingStatus.STOPPED, RecordingStatus.COMPLETED, RecordingStatus.FAILED]
        }
      }
    })
  }
}