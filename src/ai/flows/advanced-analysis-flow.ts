/**
 * @fileOverview Sentinel 高級分析與情報合成引擎。
 * 處理跨維度文件索引、OCR 提取、法律/學術分析及多源數據清洗。
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalysisModeSchema = z.enum([
  'SEMANTIC_SEARCH',
  'OCR_EXTRACTION',
  'RESEARCH_SYNTHESIS',
  'PRODUCT_COMPARISON',
  'DATA_QUALITY_AUDIT',
  'LEGAL_CONTRACT_REVIEW',
  'COMPLIANCE_GAP_ANALYSIS',
]);

const AdvancedAnalysisInputSchema = z.object({
  mode: AnalysisModeSchema,
  contextDescription: z.string().describe('分析背景或任務目標'),
  mockDataSeed: z.string().optional().describe('用於生成模擬數據的種子'),
});

export type AdvancedAnalysisInput = z.infer<typeof AdvancedAnalysisInputSchema>;

const AdvancedAnalysisOutputSchema = z.object({
  summary: z.string().describe('分析結果摘要'),
  findings: z.array(
    z.object({
      source: z.string().describe('來源標籤或文件名'),
      content: z.any().describe('發現的具體內容（文本、表格或結構化數據）'),
      relevance: z.number().optional().describe('相關性評分 (0-1)'),
      pageReference: z.string().optional().describe('頁碼或引用參考'),
    })
  ),
  recommendations: z.array(z.string()).describe('基於分析的行動建議'),
  metadata: z.record(z.any()).optional().describe('額外的元數據（如 OCR 信心分數、統計指標）'),
});

export type AdvancedAnalysisOutput = z.infer<typeof AdvancedAnalysisOutputSchema>;

export async function runAdvancedAnalysis(
  input: AdvancedAnalysisInput
): Promise<AdvancedAnalysisOutput> {
  return advancedAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'advancedAnalysisPrompt',
  input: { schema: AdvancedAnalysisInputSchema },
  output: { schema: AdvancedAnalysisOutputSchema },
  prompt: `你現在是 Sentinel 的「全知分析引擎」。你的任務是執行跨維度、多格式的文件分析。

當前模式: {{{mode}}}
分析目標: {{{contextDescription}}}

請根據模式執行以下邏輯：
1. 若為 SEMANTIC_SEARCH: 模擬從 PDF, Word, Excel 中提取內容，進行語義匹配，並生成帶有引用的摘要。
2. 若為 OCR_EXTRACTION: 模擬掃描件提取，識別表格與表單，並提供信心分數。
3. 若為 RESEARCH_SYNTHESIS: 分析多篇學術論文，提取方法論、關鍵發現並識別研究空缺。
4. 若為 DATA_QUALITY_AUDIT: 偵測數據集中的缺失值、離群值與格式不一致，並建議清洗策略。
5. 若為 LEGAL_CONTRACT_REVIEW: 提取合約方、付款條款、責任限制，並標記高風險條款。
6. 若為 COMPLIANCE_GAP_ANALYSIS: 針對 GDPR/HIPAA/SOC2 進行合規性比對，識別缺失條款。

輸出的 findings 必須包含具體的來源引用（如 "Doc_A.pdf, p.12"）。
請展現出千萬美元級別的專業深度與嚴謹度。`,
});

const advancedAnalysisFlow = ai.defineFlow(
  {
    name: 'advancedAnalysisFlow',
    inputSchema: AdvancedAnalysisInputSchema,
    outputSchema: AdvancedAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
