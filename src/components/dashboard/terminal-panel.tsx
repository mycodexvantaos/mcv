import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export function TerminalPanel() {
  return (
    <div className="flex h-full flex-col">
      <Tabs defaultValue="terminal" className="flex h-full flex-col">
        <TabsList className="h-10 justify-start rounded-none bg-transparent p-0 px-2 border-b">
          <TabsTrigger
            value="terminal"
            className="h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-sm text-muted-foreground shadow-none data-[state=active]:border-accent data-[state=active]:text-foreground"
          >
            Terminal
          </TabsTrigger>
          <TabsTrigger
            value="problems"
            className="h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-sm text-muted-foreground shadow-none data-[state=active]:border-accent data-[state=active]:text-foreground"
          >
            Problems
          </TabsTrigger>
          <TabsTrigger
            value="output"
            className="h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-sm text-muted-foreground shadow-none data-[state=active]:border-accent data-[state=active]:text-foreground"
          >
            Output
          </TabsTrigger>
          <TabsTrigger
            value="debug"
            className="h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-sm text-muted-foreground shadow-none data-[state=active]:border-accent data-[state=active]:text-foreground"
          >
            Debug Console
          </TabsTrigger>
        </TabsList>
        <TabsContent value="terminal" className="flex-1 overflow-hidden p-0 m-0">
          <ScrollArea className="h-full">
            <pre className="p-4 text-xs font-code text-muted-foreground">
              <p>EcoDev AI Studio v1.0.0</p>
              <p>
                <span className="text-accent">user@ecostudio</span>
                <span className="text-primary">:</span>
                <span className="text-blue-400">~/projects/ecostudio</span>
                <span className="text-primary">$ </span>
                <span>npm install</span>
              </p>
              <p>up to date, audited 1590 packages in 5s</p>
              <p>210 packages are looking for funding</p>
              <p> run `npm fund` for details</p>
              <p>
                <span className="text-accent">user@ecostudio</span>
                <span className="text-primary">:</span>
                <span className="text-blue-400">~/projects/ecostudio</span>
                <span className="text-primary">$ </span>
                <span className="animate-pulse">|</span>
              </p>
            </pre>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="problems" className="flex-1 p-4 text-sm text-muted-foreground">
          No problems have been detected in the workspace.
        </TabsContent>
        <TabsContent value="output" className="flex-1 p-4 text-sm text-muted-foreground">
          Output will be shown here.
        </TabsContent>
        <TabsContent value="debug" className="flex-1 p-4 text-sm text-muted-foreground">
          Debug console output will be shown here.
        </TabsContent>
      </Tabs>
    </div>
  );
}
