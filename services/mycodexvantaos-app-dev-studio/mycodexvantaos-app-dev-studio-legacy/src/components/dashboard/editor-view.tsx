import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';

const sampleCode = `
import { useState } from 'react';

type GreeterProps = {
  name: string;
};

/**
 * A simple component to greet a user.
 * @param name The name of the user to greet.
 * @returns A JSX element with a greeting.
 */
function Greeter({ name }: GreeterProps) {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(prevCount => prevCount + 1);
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h1 className="text-2xl text-white">
        Hello, {name}!
      </h1>
      <p className="text-gray-400 mt-2">
        You've clicked the button {count} times.
      </p>
      <button 
        onClick={increment}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Click me
      </button>
    </div>
  );
}

export default Greeter;
`.trim();

export function EditorView() {
  return (
    <div className="flex h-full flex-col bg-background">
      <Tabs defaultValue="editor-view.tsx" className="flex h-full flex-col">
        <div className="border-b border-border">
          <TabsList className="h-10 justify-start rounded-none bg-transparent p-0">
            <TabsTrigger
              value="page.tsx"
              className="h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-muted-foreground shadow-none data-[state=active]:border-accent data-[state=active]:bg-secondary/30 data-[state=active]:text-foreground"
            >
              page.tsx
              <X className="ml-2 h-3.5 w-3.5 text-muted-foreground/50 hover:text-foreground" />
            </TabsTrigger>
            <TabsTrigger
              value="editor-view.tsx"
              className="h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-muted-foreground shadow-none data-[state=active]:border-accent data-[state=active]:bg-secondary/30 data-[state=active]:text-foreground"
            >
              editor-view.tsx
              <X className="ml-2 h-3.5 w-3.5 text-muted-foreground/50 hover:text-foreground" />
            </TabsTrigger>
            <TabsTrigger
              value="header.tsx"
              className="h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-muted-foreground shadow-none data-[state=active]:border-accent data-[state=active]:bg-secondary/30 data-[state=active]:text-foreground"
            >
              header.tsx
              <X className="ml-2 h-3.5 w-3.5 text-muted-foreground/50 hover:text-foreground" />
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="editor-view.tsx" className="flex-1 overflow-hidden p-0 m-0">
          <ScrollArea className="h-full">
            <div className="flex text-sm font-code">
              <div className="w-12 select-none py-4 text-right text-muted-foreground/50">
                {Array.from({ length: 32 }, (_, i) => (
                  <div key={i} className="px-4">
                    {i + 1}
                  </div>
                ))}
              </div>
              <pre className="flex-1 py-4">
                <code className="text-foreground">{sampleCode}</code>
              </pre>
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="page.tsx" className="flex-1 p-4">
          Empty file: page.tsx
        </TabsContent>
        <TabsContent value="header.tsx" className="flex-1 p-4">
          Empty file: header.tsx
        </TabsContent>
      </Tabs>
    </div>
  );
}
