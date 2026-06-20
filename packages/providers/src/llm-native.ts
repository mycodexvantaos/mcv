import { LlmProvider, LlmCompletionRequest, LlmCompletionResponse } from '@mycodexvantaos/core-kernel';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Native "Dumb but working" implementation.
 * Platform independence guarantee: If internet is down or API token expires,
 * the system seamlessly routes here.
 */
export class NativeLlmProvider implements LlmProvider {
  public manifest = {
    capability: 'llm',
    provider: 'native-rules',
    mode: 'native' as const
  };

  private dictionary: any[] = [];

  async initialize(config?: any): Promise<void> {
    console.log('[Provider: llm-native] Initialized local rule-based LLM engine with semantic dictionary.');
    this.dictionary = this.loadDictionary();
  }

  async healthCheck(): Promise<{ status: "healthy" | "degraded" | "down"; reason?: string | undefined; }> {
    return { status: 'healthy' }; // Native is always healthy by definition
  }

  async shutdown(): Promise<void> {
     // Cleanup local caches
  }

  private loadDictionary() {
    const dictPath = path.join(process.cwd(), 'engineering-templates/semantic-root/semantic-dictionary.yaml');
    if (!fs.existsSync(dictPath)) return [];
    const content = fs.readFileSync(dictPath, 'utf8');
    const terms: any[] = [];
    let currentTerm: any = null;
    
    const lines = content.split('\n');
    for (const line of lines) {
      const idMatch = line.match(/^\s+-\s+id:\s+"([^"]+)"/);
      if (idMatch) {
        if (currentTerm) terms.push(currentTerm);
        currentTerm = { id: idMatch[1] };
      } else if (currentTerm) {
        const engMatch = line.match(/^\s+english:\s+"([^"]+)"/);
        if (engMatch) currentTerm.english = engMatch[1];
        
        const defMatch = line.match(/^\s+definition:\s+"([^"]+)"/);
        if (defMatch) currentTerm.definition = defMatch[1];
        
        const tcMatch = line.match(/^\s+traditional_chinese:\s+"([^"]+)"/);
        if (tcMatch) currentTerm.traditional_chinese = tcMatch[1];
        
        const scMatch = line.match(/^\s+simplified_chinese:\s+"([^"]+)"/);
        if (scMatch) currentTerm.simplified_chinese = scMatch[1];
      }
    }
    if (currentTerm) terms.push(currentTerm);
    return terms;
  }

  async generate(request: LlmCompletionRequest): Promise<LlmCompletionResponse> {
    const lowerPrompt = request.prompt.toLowerCase();
    
    // Semantic Fallback: Check if user is asking about any term in the dictionary
    for (const term of this.dictionary) {
      if (!term.english) continue;
      const engLower = term.english.toLowerCase();
      const tc = term.traditional_chinese;
      const sc = term.simplified_chinese;
      
      // Match if the prompt mentions the term
      if (lowerPrompt.includes(engLower) || (tc && lowerPrompt.includes(tc)) || (sc && lowerPrompt.includes(sc))) {
        return {
          content: `本地語意降級 (Semantic Fallback)：\n術語: ${term.english} ${tc ? ' / ' + tc : ''}\n定義: ${term.definition}`,
          providerUsed: 'native-rules'
        };
      }
    }

    let responseText = "本地離線處理：很抱歉，我無法理解此複雜邏輯或無外部網路。";

    if (lowerPrompt.includes('summary') || lowerPrompt.includes('摘要')) {
       responseText = `本地離線提取：這是一段關於 "${request.prompt.substring(0, 20)}..." 的長文摘要內容。`;
    } else if (lowerPrompt.includes('error') || lowerPrompt.includes('錯誤')) {
       responseText = `本地離線除錯建議：請檢察此區段程式碼或網路連線。`;
    }

    return {
      content: responseText,
      providerUsed: 'native-rules'
    };
  }
}
