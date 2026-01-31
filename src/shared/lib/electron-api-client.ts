// Electron 환경 감지
const isElectron = typeof window !== 'undefined' && window.electronAPI;

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
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
    return this.handleElectronResponse(response);
  }

  async createScenario(data: any) {
    if (!isElectron) throw new Error('Electron 환경이 아닙니다.');
    const response = await window.electronAPI.scenarios.create(data);
    return this.handleElectronResponse(response);
  }

  async getScenarioById(id: string) {
    if (!isElectron) throw new Error('Electron 환경이 아닙니다.');
    const response = await window.electronAPI.scenarios.getById(id);
    return this.handleElectronResponse(response);
  }

  async updateScenario(id: string, data: any) {
    if (!isElectron) throw new Error('Electron 환경이 아닙니다.');
    const response = await window.electronAPI.scenarios.update(id, data);
    return this.handleElectronResponse(response);
  }

  async deleteScenario(id: string) {
    if (!isElectron) throw new Error('Electron 환경이 아닙니다.');
    const response = await window.electronAPI.scenarios.delete(id);
    return this.handleElectronResponse(response);
  }

  async executeScenario(id: string, code: string) {
    if (!isElectron) throw new Error('Electron 환경이 아닙니다.');
    const response = await window.electronAPI.scenarios.execute(id, code);
    return this.handleElectronResponse(response);
  }

  async debugScenario(code: string) {
    if (!isElectron) throw new Error('Electron 환경이 아닙니다.');
    const response = await window.electronAPI.scenarios.debug(code);
    return this.handleElectronResponse(response);
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
    return this.callAPI(
      () => this.electronClient.getScenarios(),
      '/api/scenarios'
    );
  }

  async createScenario(data: any) {
    return this.callAPI(
      () => this.electronClient.createScenario(data),
      '/api/scenarios',
      'POST',
      data
    );
  }

  async getScenarioById(id: string) {
    return this.callAPI(
      () => this.electronClient.getScenarioById(id),
      `/api/scenarios/${id}`
    );
  }

  async updateScenario(id: string, data: any) {
    return this.callAPI(
      () => this.electronClient.updateScenario(id, data),
      `/api/scenarios/${id}`,
      'PUT',
      data
    );
  }

  async deleteScenario(id: string) {
    return this.callAPI(
      () => this.electronClient.deleteScenario(id),
      `/api/scenarios/${id}`,
      'DELETE'
    );
  }

  async executeScenario(id: string, code: string) {
    return this.callAPI(
      () => this.electronClient.executeScenario(id, code),
      `/api/scenarios/${id}/execute`,
      'POST',
      { code }
    );
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