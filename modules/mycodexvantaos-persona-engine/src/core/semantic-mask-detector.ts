/**
 * MyCodeXvantaOS Persona Engine - Semantic Mask Detector
 *
 * Detects semantic masks in text - language patterns that conceal, avoid, or distort reality.
 * URN: urn:mycodexvantaos:core:semantic-mask-detector
 */

import type { SemanticMask, SemanticMaskType, TruthReframe } from '../types';

/**
 * Default semantic masks with detection patterns and truth reframes
 */
const DEFAULT_SEMANTIC_MASKS: SemanticMask[] = [
  {
    urn: 'urn:mycodexvantaos:mask:comforting-platitude',
    mask_type: 'comforting_platitude',
    name: '正念安慰句式',
    description: 'Empty comforting phrases that avoid addressing real issues',
    patterns: [
      '一切都會好起來的',
      '時間會治癒一切',
      '要相信自己',
      '保持正向思考',
      '一切都會過去的',
      '上天有最好的安排',
      '發生的事都有原因',
      'just stay positive',
      'everything happens for a reason',
      'time heals all wounds',
      'just believe in yourself',
    ],
    truth_reframe: {
      pattern_name: 'comforting_platitude',
      truth_exposure: 'This phrase avoids facing the actual difficulty of the situation',
      constructive_alternative:
        "Let's identify what specific aspects of this situation we can address",
      follow_up_question: 'What concrete step could you take today to improve this situation?',
    },
    precision: 0.95,
    severity: 'medium',
  },
  {
    urn: 'urn:mycodexvantaos:mask:vague-healing-language',
    mask_type: 'vague_healing_language',
    name: '模糊療癒語言',
    description: 'Vague therapeutic language without specific meaning or action',
    patterns: [
      '你需要療癒你的內在小孩',
      '這是靈魂的功課',
      '能量需要流動',
      '釋放你的負面能量',
      '連結你的高我',
      'align your chakras',
      'heal your inner child',
      'release negative energy',
    ],
    truth_reframe: {
      pattern_name: 'vague_healing_language',
      truth_exposure: 'This language sounds meaningful but lacks actionable content',
      constructive_alternative:
        "Let's translate this into specific behaviors or thoughts we can work on",
      follow_up_question: 'What specific behavior or thought pattern would you like to change?',
    },
    precision: 0.92,
    severity: 'medium',
  },
  {
    urn: 'urn:mycodexvantaos:mask:psychological-jargon-misuse',
    mask_type: 'psychological_jargon_misuse',
    name: '心理學術語誤用',
    description: 'Misuse of psychological terms to avoid real understanding',
    patterns: [
      '這是我的防衛機制',
      '我有依附型人格障礙',
      '這是創傷反應',
      '我的原生家庭問題',
      '這是強迫症',
      '我是 ADHD',
      "that's my defense mechanism",
      'I have attachment issues',
      "it's a trauma response",
    ],
    truth_reframe: {
      pattern_name: 'psychological_jargon_misuse',
      truth_exposure: 'Using clinical terms without proper context can obscure rather than clarify',
      constructive_alternative: "Let's describe the specific behavior or feeling without the label",
      follow_up_question: 'What specifically happens when you experience this?',
    },
    precision: 0.88,
    severity: 'low',
  },
  {
    urn: 'urn:mycodexvantaos:mask:emotional-avoidance',
    mask_type: 'emotional_avoidance',
    name: '情緒迴避語句',
    description: 'Statements that avoid acknowledging or processing emotions',
    patterns: [
      '我不想談這個',
      '這沒什麼大不了的',
      '我已經放下了',
      '我不在乎了',
      '都過去了',
      "I don't want to talk about it",
      "it's fine",
      "I'm over it",
      "it doesn't matter",
    ],
    truth_reframe: {
      pattern_name: 'emotional_avoidance',
      truth_exposure: 'Avoiding discussion often means the issue still affects you',
      constructive_alternative: 'Acknowledging discomfort is the first step to resolution',
      follow_up_question: 'What would happen if you allowed yourself to feel this fully?',
    },
    precision: 0.9,
    severity: 'high',
  },
  {
    urn: 'urn:mycodexvantaos:mask:responsibility-transfer',
    mask_type: 'responsibility_transfer',
    name: '責任轉移表達',
    description: 'Language that shifts responsibility away from oneself',
    patterns: [
      '是他讓我',
      '都是因為',
      '如果不是因為他',
      '我別無選擇',
      '是他們的問題',
      'they made me',
      "it's because of them",
      'I had no choice',
      "it's not my fault",
    ],
    truth_reframe: {
      pattern_name: 'responsibility_transfer',
      truth_exposure: "While others may contribute, you have more agency than you're acknowledging",
      constructive_alternative: "Let's identify what aspects you can control",
      follow_up_question: 'What part of this situation could you influence, even slightly?',
    },
    precision: 0.85,
    severity: 'high',
  },
  {
    urn: 'urn:mycodexvantaos:mask:reality-denial',
    mask_type: 'reality_denial',
    name: '現實否認結構',
    description: 'Statements that deny or minimize obvious reality',
    patterns: [
      '沒有那麼嚴重',
      '其實還好',
      '他不是那種人',
      '這不是真的',
      '我想太多了',
      "it's not that bad",
      'they would never',
      "that's not true",
      "I'm just overthinking",
    ],
    truth_reframe: {
      pattern_name: 'reality_denial',
      truth_exposure: "Minimizing reality doesn't change it - it only delays dealing with it",
      constructive_alternative: 'Facing reality, however painful, enables real solutions',
      follow_up_question: 'If this situation were exactly as you fear, what would you need to do?',
    },
    precision: 0.87,
    severity: 'high',
  },
  {
    urn: 'urn:mycodexvantaos:mask:self-deception',
    mask_type: 'self_deception',
    name: '自我欺騙模式',
    description: 'Self-deceptive patterns that maintain false beliefs',
    patterns: [
      '我下次一定會',
      '我已經改變了',
      '這次不一樣',
      '我能控制',
      '這是最後一次',
      "I'll definitely do it next time",
      "I've changed",
      'this time is different',
      'I can control it',
    ],
    truth_reframe: {
      pattern_name: 'self_deception',
      truth_exposure: 'Patterns repeat until we honestly examine them',
      constructive_alternative: "Let's look at the track record and design concrete safeguards",
      follow_up_question: 'What has happened the last five times you said this?',
    },
    precision: 0.82,
    severity: 'high',
  },
  {
    urn: 'urn:mycodexvantaos:mask:cognitive-dissonance-mask',
    mask_type: 'cognitive_dissonance_mask',
    name: '認知失調掩飾',
    description: 'Rationalizations that reduce cognitive dissonance',
    patterns: [
      '這樣也挺好',
      '其實我本來就不想要',
      '這樣更自由',
      '反正也不重要',
      '這是最好的安排',
      "it's actually better this way",
      "I didn't really want it anyway",
      "it's for the best",
    ],
    truth_reframe: {
      pattern_name: 'cognitive_dissonance_mask',
      truth_exposure: 'Rationalizing disappointment prevents learning from it',
      constructive_alternative: 'Acknowledging disappointment allows authentic growth',
      follow_up_question: 'If you could have this turn out differently, would you want it to?',
    },
    precision: 0.8,
    severity: 'medium',
  },
];

/**
 * Detection result interface
 */
export interface MaskDetectionResult {
  detected: boolean;
  masks: DetectedMask[];
  total_severity: number;
  summary: string;
}

/**
 * Detected mask with context
 */
export interface DetectedMask {
  mask: SemanticMask;
  matched_pattern: string;
  position: {
    start: number;
    end: number;
  };
  context: string;
  truth_reframe: TruthReframe;
}

/**
 * SemanticMaskDetector class
 * Detects semantic masks in text and provides truth reframes
 */
export class SemanticMaskDetector {
  private masks: Map<string, SemanticMask>;
  private patternCache: Map<string, RegExp[]>;

  constructor(customMasks?: SemanticMask[]) {
    this.masks = new Map();
    this.patternCache = new Map();

    // Load default masks
    for (const mask of DEFAULT_SEMANTIC_MASKS) {
      this.masks.set(mask.urn, mask);
      this.compilePatterns(mask);
    }

    // Add custom masks if provided
    if (customMasks) {
      for (const mask of customMasks) {
        this.masks.set(mask.urn, mask);
        this.compilePatterns(mask);
      }
    }
  }

  /**
   * Compile regex patterns for a mask
   */
  private compilePatterns(mask: SemanticMask): void {
    const patterns: RegExp[] = mask.patterns.map((pattern) => {
      // Escape special regex characters and create case-insensitive pattern
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(escaped, 'gi');
    });
    this.patternCache.set(mask.urn, patterns);
  }

  /**
   * Add a new mask to the detector
   */
  addMask(mask: SemanticMask): void {
    this.masks.set(mask.urn, mask);
    this.compilePatterns(mask);
  }

  /**
   * Remove a mask from the detector
   */
  removeMask(urn: string): boolean {
    const deleted = this.masks.delete(urn);
    if (deleted) {
      this.patternCache.delete(urn);
    }
    return deleted;
  }

  /**
   * Get all registered masks
   */
  getMasks(): SemanticMask[] {
    return Array.from(this.masks.values());
  }

  /**
   * Get a specific mask by URN
   */
  getMask(urn: string): SemanticMask | undefined {
    return this.masks.get(urn);
  }

  /**
   * Get masks by type
   */
  getMasksByType(type: SemanticMaskType): SemanticMask[] {
    return Array.from(this.masks.values()).filter((m) => m.mask_type === type);
  }

  /**
   * Detect semantic masks in text
   */
  detect(text: string): MaskDetectionResult {
    const detectedMasks: DetectedMask[] = [];
    let totalSeverity = 0;

    for (const [urn, mask] of this.masks) {
      const patterns = this.patternCache.get(urn) || [];

      for (const pattern of patterns) {
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(text)) !== null) {
          const start = match.index;
          const end = start + match[0].length;

          // Get context around the match
          const contextStart = Math.max(0, start - 30);
          const contextEnd = Math.min(text.length, end + 30);
          const context = text.substring(contextStart, contextEnd);

          detectedMasks.push({
            mask,
            matched_pattern: match[0],
            position: { start, end },
            context: `...${context}...`,
            truth_reframe: mask.truth_reframe,
          });

          // Add to severity score
          const severityValue = mask.severity === 'high' ? 3 : mask.severity === 'medium' ? 2 : 1;
          totalSeverity += severityValue;
        }
      }
    }

    // Sort by position
    detectedMasks.sort((a, b) => a.position.start - b.position.start);

    // Remove duplicates (same position, different patterns)
    const uniqueMasks = this.removeDuplicates(detectedMasks);

    return {
      detected: uniqueMasks.length > 0,
      masks: uniqueMasks,
      total_severity: totalSeverity,
      summary: this.generateSummary(uniqueMasks),
    };
  }

  /**
   * Remove duplicate detections at the same position
   */
  private removeDuplicates(masks: DetectedMask[]): DetectedMask[] {
    const seen = new Map<string, DetectedMask>();

    for (const m of masks) {
      const key = `${m.position.start}-${m.position.end}`;
      if (!seen.has(key)) {
        seen.set(key, m);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Generate a summary of detected masks
   */
  private generateSummary(masks: DetectedMask[]): string {
    if (masks.length === 0) {
      return 'No semantic masks detected.';
    }

    const typeCounts = new Map<SemanticMaskType, number>();
    for (const m of masks) {
      const count = typeCounts.get(m.mask.mask_type) || 0;
      typeCounts.set(m.mask.mask_type, count + 1);
    }

    const parts: string[] = [];
    for (const [type, count] of typeCounts) {
      parts.push(`${type}: ${count}`);
    }

    return `Detected ${masks.length} semantic mask(s) - ${parts.join(', ')}`;
  }

  /**
   * Get truth reframe for a specific mask type
   */
  getTruthReframe(maskType: SemanticMaskType): TruthReframe | undefined {
    for (const mask of this.masks.values()) {
      if (mask.mask_type === maskType) {
        return mask.truth_reframe;
      }
    }
    return undefined;
  }

  /**
   * Generate constructive response for detected masks
   */
  generateConstructiveResponse(detection: MaskDetectionResult): string {
    if (!detection.detected) {
      return '';
    }

    const responses: string[] = [];

    for (const detected of detection.masks) {
      const reframe = detected.truth_reframe;
      responses.push(
        `**Detected pattern: ${detected.mask.name}**\n` +
          `Observation: ${reframe.truth_exposure}\n` +
          `Alternative approach: ${reframe.constructive_alternative}\n` +
          (reframe.follow_up_question ? `Question: ${reframe.follow_up_question}` : '')
      );
    }

    return responses.join('\n\n---\n\n');
  }

  /**
   * Analyze text and return detailed report
   */
  analyze(text: string): {
    detection: MaskDetectionResult;
    recommendations: string[];
    followUpQuestions: string[];
  } {
    const detection = this.detect(text);
    const recommendations: string[] = [];
    const followUpQuestions: string[] = [];

    for (const detected of detection.masks) {
      recommendations.push(detected.truth_reframe.constructive_alternative);
      if (detected.truth_reframe.follow_up_question) {
        followUpQuestions.push(detected.truth_reframe.follow_up_question);
      }
    }

    return {
      detection,
      recommendations,
      followUpQuestions,
    };
  }
}

export default SemanticMaskDetector;
