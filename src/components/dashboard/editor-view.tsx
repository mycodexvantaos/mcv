import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Cpu, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const sampleCode = `
import { PieceTable } from '@/core/kernel/textBuffer';
import { ViewportRenderer } from '@/core/kernel/rendering';

/**
 * @MyCodeXvantaOS 核心渲染邏輯
 * 採用 Piece Table 數據結構優化超大文件處理 (O(1) 行查詢)
 * 結合 Viewport Virtualization 確保 60fps 滾動效能
 */
class EditorEngine {
  private buffer: PieceTable;
  private renderer: ViewportRenderer;

  constructor(content: string) {
    this.buffer = new PieceTable(content);
    this.renderer = new ViewportRenderer({
      lineHeight: 18,
      virtualization: true,
      gpuAcceleration: true
    });
  }

  public render(viewportHeight: number) {
    const visibleLines = this.renderer.calculateVisibleRange(viewportHeight);
    return this.buffer.getRange(visibleLines);
  }
}

export default EditorEngine;
`.trim();

export function EditorView() {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border bg-card/30 px-2 h-10">
        <Tabs defaultValue="editor-view.tsx" className="flex-1">
          <TabsList className="h-10 justify-start rounded-none bg-transparent p-0">
            <TabsTrigger
              value="editor-view.tsx"
              className="h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-xs text-muted-foreground shadow-none data-[state=active]:border-accent data-[state=active]:bg-secondary/30 data-[state=active]:text-foreground"
            >
              editor-view.tsx
              <X className="ml-2 h-3 w-3 text-muted-foreground/50 hover:text-foreground" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2 px-2">
          <Badge
            variant="outline"
            className="text-[8px] bg-primary/5 text-primary border-primary/20 h-5 flex gap-1"
          >
            <Cpu className="h-2 w-2" /> PIECE-TABLE ACTIVE
          </Badge>
          <Badge
            variant="outline"
            className="text-[8px] bg-accent/5 text-accent border-accent/20 h-5 flex gap-1"
          >
            <Layers className="h-2 w-2" /> VIRTUAL-RENDER ON
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full">
          <div className="flex text-xs font-code">
            <div className="w-10 select-none py-4 text-right text-muted-foreground/30 border-r border-border/20 bg-secondary/5">
              {Array.from({ length: 30 }, (_, i) => (
                <div key={i} className="px-3">
                  {i + 1}
                </div>
              ))}
            </div>
            <pre className="flex-1 py-4 px-4 overflow-x-auto">
              <code className="text-foreground/90">{sampleCode}</code>
            </pre>
          </div>
        </ScrollArea>

        {/* 背景裝飾：架構水印 */}
        <div className="absolute bottom-4 right-6 opacity-5 pointer-events-none select-none">
          <p className="text-6xl font-black italic">MYCODEXVANTAOS</p>
        </div>
      </div>
    </div>
  );
}
