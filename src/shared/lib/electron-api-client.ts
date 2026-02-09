// Electron 환경 감지
const isElectron = typeof window !== 'undefined' &&
  typeof window.electronAPI !== 'undefined' &&
  window.electronAPI !== null;

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

type ExecutionStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

function normalizeExecutionStatus(status: string | undefined | null): ExecutionStatus {
  if (!status) return "PENDING";
  const upper = status.toUpperCase();
  if (upper === "FAILURE") return "FAILED";
  if (upper === "FAILED") return "FAILED";
  if (upper === "SUCCESS") return "SUCCESS";
  if (upper === "RUNNING") return "RUNNING";
  return "PENDING";
}

function normalizeScenarioStatus<T extends { executions?: Array<any> }>(scenario: T): T {
  if (!scenario || !scenario.executions) return scenario;
  return {
    ...scenario,
    executions: scenario.executions.map((execution) => ({
      ...execution,
      status: normalizeExecutionStatus(execution.status)
    }))
  };
}

function normalizeScenarioList<T extends { executions?: Array<any> }>(scenarios: T[]): T[] {
  return scenarios.map((scenario) => normalizeScenarioStatus(scenario));
}

// Electron API 클라이언트
class ElectronApiClient {
  private async handleElectronResponse<T>(response: APIResponse<T>): Promise<T> {
    if (!response.success) {
      throw new Error(response.error || '알 수 없는 오류가 발생했습니다.');
    }
    return response.data as T;
  }

  // 시나리오 관련 API
  async getScenarios() {
    if (!isElectron) throw new Error('Electron 환경이 아닙니다.');
    const response = await window.electronAPI.scenarios.getAll();
    const data = await this.handleElectronResponse(response);
    return normalizeScenarioList(data);
  }

  async createScenario(data: any) {
    if (!isElectron) throw new Error('Electron 환경이 아닙니다.');
    const response = await window.electronAPI.scenarios.create(data);
    const result = await this.handleElectronResponse(response);
    return normalizeScenarioStatus(result);
  }

  async getScenarioById(id: string) {
    if (!isElectron) throw new Error('Electron 환경이 아닙니다.');
    const response = await window.electronAPI.scenarios.getById(id);
    const result = await this.handleElectronResponse(response);
    return normalizeScenarioStatus(result);
  }

  async updateScenario(id: string, data: any) {
    if (!isElectron) throw new Error('Electron 환경이 아닙니다.');
    const response = await window.electronAPI.scenarios.update(id, data);
    const result = await this.handleElectronResponse(response);
    return normalizeScenarioStatus(result);
  }

  async deleteScenario(id: string) {
    if (!isElectron) throw new Error('Electron 환경이 아닙니다.');
    const response = await window.electronAPI.scenarios.delete(id);
    return this.handleElectronResponse(response);
  }

  async executeScenario(id: string, code: string) {
    if (!isElectron) throw new Error('Electron 환경이 아닙니다.');
    const response = await window.electronAPI.scenarios.execute(id, code);
    const result = await this.handleElectronResponse(response);
    return {
      ...result,
      status: normalizeExecutionStatus(result?.status)
    };
  }

  async debugScenario(code: string) {
    if (!isElectron) throw new Error('Electron 환경이 아닙니다.');
    const response = await window.electronAPI.scenarios.debug(code);
    return this.handleElectronResponse(response);
  }

  // 실행 관련 API
  async getExecutionById(id: string) {
    if (!isElectron) throw new Error('Electron 환경이 아닙니다.');
    const response = await window.electronAPI.executions.getById(id);
    const result = await this.handleElectronResponse(response);
    if (!result) return result;
    return {
      ...result,
      status: normalizeExecutionStatus(result.status)
    };
  }

  onExecutionStatusChanged(callback: (data: any) => void): () => void {
    if (!isElectron) return () => {};
    return window.electronAPI.executions.onStatusChanged((data: any) => {
      if (data) {
        callback({
          ...data,
          status: normalizeExecutionStatus(data.status)
        });
        return;
      }
      callback(data);
    });
  }

  // 레코딩 관련 API
  async startRecording(url: string) {
    if (!isElectron) throw new Error('Electron 환경이 아닙니다.');
    const response = await window.electronAPI.recording.start(url);
    return this.handleElectronResponse(response);
  }

  async stopRecording(sessionId: string) {
    if (!isElectron) throw new Error('Electron 환경이 아닙니다.');
    const response = await window.electronAPI.recording.stop(sessionId);
    return this.handleElectronResponse(response);
  }

  // AI 관련 API
  async modifyCode(code: string, instruction: string) {
    if (!isElectron) throw new Error('Electron 환경이 아닙니다.');
    const response = await window.electronAPI.ai.modify(code, instruction);
    return this.handleElectronResponse(response);
  }
}

// 통합 API 클라이언트 (Electron과 Web 환경 모두 지원)
class UnifiedApiClient {
  private electronClient = new ElectronApiClient();

  // 환경 감지해서 적절한 클라이언트 사용
  private async callAPI<T>(
    electronMethod: () => Promise<T>,
    webEndpoint: string,
    webMethod: string = 'GET',
    webData?: any
  ): Promise<T> {
    if (isElectron) {
      return electronMethod();
    } else {
      // 웹 환경에서는 기존 fetch API 사용
      const { apiClient } = await import('./api-client');

      switch (webMethod) {
        case 'POST':
          return apiClient.post<T>(webEndpoint, webData);
        case 'PUT':
          return apiClient.put<T>(webEndpoint, webData);
        case 'DELETE':
          return apiClient.delete<T>(webEndpoint);
        default:
          return apiClient.get<T>(webEndpoint);
      }
    }
  }

  // 시나리오 API
  async getScenarios() {
    const result = await this.callAPI(
      () => this.electronClient.getScenarios(),
      '/api/scenarios'
    );
    return normalizeScenarioList(result);
  }

  async createScenario(data: any) {
    const result = await this.callAPI(
      () => this.electronClient.createScenario(data),
      '/api/scenarios',
      'POST',
      data
    );
    return normalizeScenarioStatus(result);
  }

  async getScenarioById(id: string) {
    const result = await this.callAPI(
      () => this.electronClient.getScenarioById(id),
      `/api/scenarios/${id}`
    );
    return normalizeScenarioStatus(result);
  }

  async updateScenario(id: string, data: any) {
    const result = await this.callAPI(
      () => this.electronClient.updateScenario(id, data),
      `/api/scenarios/${id}`,
      'PUT',
      data
    );
    return normalizeScenarioStatus(result);
  }

  async deleteScenario(id: string) {
    return this.callAPI(
      () => this.electronClient.deleteScenario(id),
      `/api/scenarios/${id}`,
      'DELETE'
    );
  }

  async executeScenario(id: string, code: string) {
    const result = await this.callAPI(
      () => this.electronClient.executeScenario(id, code),
      `/api/scenarios/${id}/execute`,
      'POST',
      { code }
    );
    return {
      ...result,
      status: normalizeExecutionStatus(result?.status)
    };
  }

  async debugScenario(code: string) {
    return this.callAPI(
      () => this.electronClient.debugScenario(code),
      `/api/scenarios/debug`,
      'POST',
      { code }
    );
  }

  // 레코딩 API
  async startRecording(url: string) {
    return this.callAPI(
      () => this.electronClient.startRecording(url),
      '/api/recording/start',
      'POST',
      { url }
    );
  }

  async stopRecording(sessionId: string) {
    return this.callAPI(
      () => this.electronClient.stopRecording(sessionId),
      '/api/recording/stop',
      'POST',
      { sessionId }
    );
  }

  // 실행 API
  async getExecutionById(id: string) {
    const result = await this.callAPI(
      () => this.electronClient.getExecutionById(id),
      `/api/executions/${id}`
    );
    if (!result) return result;
    return {
      ...result,
      status: normalizeExecutionStatus(result.status)
    };
  }

  onExecutionStatusChanged(callback: (data: any) => void): () => void {
    return this.electronClient.onExecutionStatusChanged((data: any) => {
      if (data) {
        callback({
          ...data,
          status: normalizeExecutionStatus(data.status)
        });
        return;
      }
      callback(data);
    });
  }

  // AI API
  async modifyCode(code: string, instruction: string) {
    return this.callAPI(
      () => this.electronClient.modifyCode(code, instruction),
      '/api/ai/modify',
      'POST',
      { code, instruction }
    );
  }
}

export const unifiedApiClient = new UnifiedApiClient();
export { isElectron };
