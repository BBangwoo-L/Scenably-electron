interface ClaudeModificationRequest {
  currentCode: string;
  modificationRequest: string;
  targetUrl: string;
}

interface ClaudeModificationResponse {
  modifiedCode: string;
  explanation: string;
}

export class ClaudeService {
  private static readonly API_URL = 'https://api.anthropic.com/v1/messages';

  static async modifyScenario(request: ClaudeModificationRequest): Promise<ClaudeModificationResponse> {
    const apiKey = process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      throw new Error('Claude API key not configured');
    }

    const prompt = `You are an expert Playwright test automation engineer.

Current test code:
\`\`\`javascript
${request.currentCode}
\`\`\`

Target URL: ${request.targetUrl}

Modification request: ${request.modificationRequest}

Please modify the Playwright test code according to the request. Return your response in the following JSON format:
{
  "modifiedCode": "the updated Playwright test code here",
  "explanation": "brief explanation of what was changed and why"
}

Make sure the modified code:
1. Is valid Playwright test syntax
2. Follows best practices for E2E testing
3. Includes proper error handling and waits
4. Is well-commented`;

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0].text;

      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from Claude API');
      }

      const result = JSON.parse(jsonMatch[0]);
      return {
        modifiedCode: result.modifiedCode,
        explanation: result.explanation,
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to modify scenario with AI');
    }
  }
}