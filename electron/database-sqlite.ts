import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export interface Scenario {
  id: string;
  name: string;
  description: string | null;
  targetUrl: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface Execution {
  id: string;
  scenarioId: string;
  status: 'SUCCESS' | 'FAILURE' | 'RUNNING';
  result: string | null;
  startedAt: string;
  completedAt: string | null;
}

export class ScenablyDatabase {
  private db: Database.Database;

  constructor() {
    // 사용자 데이터 폴더에 데이터베이스 생성
    const userDataPath = app.getPath('userData');
    const dbDir = join(userDataPath, 'database');

    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    const dbPath = join(dbDir, 'scenably.db');

    console.log('SQLite 데이터베이스 초기화:', dbPath);

    this.db = new Database(dbPath);
    this.initTables();
  }

  private initTables() {
    // Scenario 테이블 생성
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scenarios (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        targetUrl TEXT NOT NULL,
        code TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Execution 테이블 생성
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS executions (
        id TEXT PRIMARY KEY,
        scenarioId TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILURE', 'RUNNING')),
        result TEXT,
        startedAt TEXT NOT NULL DEFAULT (datetime('now')),
        completedAt TEXT,
        FOREIGN KEY (scenarioId) REFERENCES scenarios (id) ON DELETE CASCADE
      )
    `);

    // 인덱스 생성
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_executions_scenario_id ON executions(scenarioId);
      CREATE INDEX IF NOT EXISTS idx_executions_started_at ON executions(startedAt DESC);
    `);

    console.log('데이터베이스 테이블 초기화 완료');
  }

  // Scenario CRUD 메서드들
  findAllScenarios(): (Scenario & { executions: Execution[] })[] {
    const scenarios = this.db.prepare(`
      SELECT id, name, description, targetUrl, code, createdAt, updatedAt
      FROM scenarios
      ORDER BY createdAt DESC
    `).all() as Scenario[];

    return scenarios.map(scenario => ({
      ...scenario,
      executions: this.findExecutionsByScenarioId(scenario.id, 5)
    }));
  }

  findScenarioById(id: string): (Scenario & { executions: Execution[] }) | null {
    const scenario = this.db.prepare(`
      SELECT id, name, description, targetUrl, code, createdAt, updatedAt
      FROM scenarios
      WHERE id = ?
    `).get(id) as Scenario | undefined;

    if (!scenario) return null;

    return {
      ...scenario,
      executions: this.findExecutionsByScenarioId(id)
    };
  }

  createScenario(data: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>): Scenario {
    const id = this.generateId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO scenarios (id, name, description, targetUrl, code, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, data.name, data.description, data.targetUrl, data.code, now, now);

    return {
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    };
  }

  updateScenario(id: string, data: Partial<Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>>): Scenario | null {
    const existing = this.findScenarioById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.targetUrl !== undefined) {
      updates.push('targetUrl = ?');
      values.push(data.targetUrl);
    }
    if (data.code !== undefined) {
      updates.push('code = ?');
      values.push(data.code);
    }

    if (updates.length === 0) return existing;

    updates.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE scenarios
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    return this.findScenarioById(id)!;
  }

  deleteScenario(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM scenarios WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Execution CRUD 메서드들
  findExecutionsByScenarioId(scenarioId: string, limit?: number): Execution[] {
    let query = `
      SELECT id, scenarioId, status, result, startedAt, completedAt
      FROM executions
      WHERE scenarioId = ?
      ORDER BY startedAt DESC
    `;

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    return this.db.prepare(query).all(scenarioId) as Execution[];
  }

  createExecution(data: Omit<Execution, 'id' | 'startedAt'>): Execution {
    const id = this.generateId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO executions (id, scenarioId, status, result, startedAt, completedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, data.scenarioId, data.status, data.result, now, data.completedAt);

    return {
      id,
      ...data,
      startedAt: now
    };
  }

  updateExecution(id: string, data: Partial<Omit<Execution, 'id' | 'scenarioId' | 'startedAt'>>): Execution | null {
    const existing = this.db.prepare('SELECT * FROM executions WHERE id = ?').get(id) as Execution | undefined;
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.result !== undefined) {
      updates.push('result = ?');
      values.push(data.result);
    }
    if (data.completedAt !== undefined) {
      updates.push('completedAt = ?');
      values.push(data.completedAt);
    }

    if (updates.length === 0) return existing;

    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE executions
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    return this.db.prepare('SELECT * FROM executions WHERE id = ?').get(id) as Execution;
  }

  // 유틸리티 메서드
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 연결 종료
  close() {
    this.db.close();
    console.log('SQLite 데이터베이스 연결 종료');
  }

  // 백업 및 복원
  backup(backupPath: string) {
    this.db.backup(backupPath);
    console.log('데이터베이스 백업 완료:', backupPath);
  }
}

// 싱글톤 인스턴스
let dbInstance: ScenablyDatabase | null = null;

export function getDatabase(): ScenablyDatabase {
  if (!dbInstance) {
    dbInstance = new ScenablyDatabase();
  }
  return dbInstance;
}

export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}