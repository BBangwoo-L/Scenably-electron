import { spawnSync } from 'child_process';

export type ScheduleFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface ScheduleDefinition {
  id: string;
  scenarioId: string;
  frequency: ScheduleFrequency;
  time: string; // HH:MM
  dayOfWeek?: string | null; // "MON,TUE"
  dayOfMonth?: number | null; // 1-31
  enabled: number;
}

function buildTaskName(id: string) {
  return `Scenably\\Schedule\\${id}`;
}

function buildTaskCommand(id: string) {
  return `"${process.execPath}" --run-schedule=${id}`;
}

function runSchtasks(args: string[]) {
  const result = spawnSync('schtasks', args, { windowsHide: true });
  const stdout = result.stdout?.toString() || '';
  const stderr = result.stderr?.toString() || '';
  // 스케줄러 호출 결과 디버그 로그
  // eslint-disable-next-line no-console
  console.log(`[Scheduler] schtasks ${args.join(' ')}`);
  // eslint-disable-next-line no-console
  console.log(`[Scheduler] status=${result.status} stdout=${stdout.trim()} stderr=${stderr.trim()}`);
  return { status: result.status ?? -1, stdout, stderr };
}

export function createOrUpdateTask(def: ScheduleDefinition) {
  if (process.platform !== 'win32') {
    return { ok: false, error: 'Windows에서만 지원됩니다.' };
  }

  const taskName = buildTaskName(def.id);
  const taskCommand = buildTaskCommand(def.id);

  // eslint-disable-next-line no-console
  console.log(`[Scheduler] createOrUpdateTask id=${def.id} scenarioId=${def.scenarioId} frequency=${def.frequency} time=${def.time} enabled=${def.enabled}`);

  const args = [
    '/Create',
    '/F',
    '/TN', taskName,
    '/TR', taskCommand,
    '/SC', def.frequency,
    '/ST', def.time
  ];

  if (def.frequency === 'WEEKLY') {
    const days = def.dayOfWeek && def.dayOfWeek.trim() ? def.dayOfWeek : 'MON';
    args.push('/D', days);
  }

  if (def.frequency === 'MONTHLY') {
    const day = def.dayOfMonth && def.dayOfMonth > 0 ? String(def.dayOfMonth) : '1';
    args.push('/D', day);
  }

  const result = runSchtasks(args);
  if (result.status !== 0) {
    return { ok: false, error: result.stderr || result.stdout || '스케줄 등록 실패' };
  }

  if (def.enabled === 0) {
    const disableResult = runSchtasks(['/Change', '/TN', taskName, '/Disable']);
    if (disableResult.status !== 0) {
      return { ok: false, error: disableResult.stderr || disableResult.stdout || '스케줄 비활성화 실패' };
    }
  }

  return { ok: true };
}

export function deleteTask(scheduleId: string) {
  if (process.platform !== 'win32') {
    return { ok: false, error: 'Windows에서만 지원됩니다.' };
  }

  // eslint-disable-next-line no-console
  console.log(`[Scheduler] deleteTask id=${scheduleId}`);
  const taskName = buildTaskName(scheduleId);
  const result = runSchtasks(['/Delete', '/F', '/TN', taskName]);
  if (result.status !== 0) {
    return { ok: false, error: result.stderr || result.stdout || '스케줄 삭제 실패' };
  }
  return { ok: true };
}

export function setTaskEnabled(scheduleId: string, enabled: boolean) {
  if (process.platform !== 'win32') {
    return { ok: false, error: 'Windows에서만 지원됩니다.' };
  }

  // eslint-disable-next-line no-console
  console.log(`[Scheduler] setTaskEnabled id=${scheduleId} enabled=${enabled}`);
  const taskName = buildTaskName(scheduleId);
  const result = runSchtasks(['/Change', '/TN', taskName, enabled ? '/Enable' : '/Disable']);
  if (result.status !== 0) {
    return { ok: false, error: result.stderr || result.stdout || '스케줄 상태 변경 실패' };
  }
  return { ok: true };
}
