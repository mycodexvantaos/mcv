/**
 * @fileoverview URL Content Extractor — Extract text content from URLs
 *
 * Provides native URL content extraction for the Humaniser engine.
 * Uses fetch + HTML parsing to extract readable text from web pages.
 * Follows Local-first principle with graceful degradation.
 */

export interface ExtractedContent {
  url: string;
  title: string;
  text: string;
  wordCount: number;
  extractionMethod: string;
  timestamp: string;
}

/**
 * Extract readable text content from a URL
 *
 * Uses a simple HTML-to-text extraction approach that works
 * without external dependencies.
 */
export async function extractFromUrl(url: string): Promise<ExtractedContent> {
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MyCodexVantaOS-Humaniser/1.0',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Simple HTML-to-text extraction
    const text = htmlToText(html);
    const title = extractTitle(html);

    return {
      url,
      title,
      text,
      wordCount: text.split(/\s+/).filter((w) => w.length > 0).length,
      extractionMethod: 'native-fetch',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Failed to extract content from URL: ${error.message}`);
  }
}

/**
 * Convert HTML to plain text using regex-based extraction
 *
 * This is a simple native implementation. For production use with
 * complex pages, consider using a connected provider with better
 * parsing capabilities.
 */
function htmlToText(html: string): string {
  let text = html;

  // Remove script and style blocks
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, '');
  text = text.replace(/<header[\s\S]*?<\/header>/gi, '');

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Extract the page title from HTML
 */
function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : 'Untitled';
}

/**
 * Extract text from a file buffer
 *
 * Supports plain text, markdown, and basic document formats.
 * For PDF/DOCX, use a connected provider.
 */
export function extractFromFile(content: string, mimeType: string): ExtractedContent {
  let text = content;
  let method = 'native-text';

  if (mimeType === 'text/markdown' || mimeType === 'text/md') {
    // Strip markdown formatting
    text = content
      .replace(/^#{1,6}\s+/gm, '') // Headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
      .replace(/\*([^*]+)\*/g, '$1') // Italic
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Images
      .replace(/^[-*+]\s+/gm, '') // List items
      .replace(/^>\s+/gm, ''); // Blockquotes
    method = 'native-markdown';
  } else if (mimeType === 'text/html') {
    text = htmlToText(content);
    method = 'native-html';
  }

  return {
    url: '',
    title: '',
    text: text.trim(),
    wordCount: text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length,
    extractionMethod: method,
    timestamp: new Date().toISOString(),
  };
}
