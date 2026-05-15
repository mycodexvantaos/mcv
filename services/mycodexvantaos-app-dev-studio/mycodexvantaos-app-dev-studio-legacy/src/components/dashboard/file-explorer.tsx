'use client';

import { Folder, File, ChevronDown, ChevronRight } from 'lucide-react';

type FileItem = {
  name: string;
  type: 'folder' | 'file';
  active?: boolean;
  children?: FileItem[];
};

const files: FileItem[] = [
  {
    name: 'app',
    type: 'folder',
    children: [
      { name: 'dashboard', type: 'folder', children: [{ name: 'page.tsx', type: 'file' }] },
      { name: 'page.tsx', type: 'file' },
      { name: 'layout.tsx', type: 'file' },
    ],
  },
  {
    name: 'components',
    type: 'folder',
    children: [
      {
        name: 'dashboard',
        type: 'folder',
        children: [
          { name: 'header.tsx', type: 'file' },
          { name: 'editor-view.tsx', type: 'file', active: true },
        ],
      },
    ],
  },
  {
    name: 'docs',
    type: 'folder',
    children: [
      {
        name: 'architecture',
        type: 'folder',
        children: [
          { name: 'component-interaction.md', type: 'file' },
          { name: 'naming-convention.md', type: 'file' },
        ],
      },
      { name: 'ARCHITECTURE.md', type: 'file' },
      { name: 'api-draft.md', type: 'file' },
    ],
  },
  { name: 'package.json', type: 'file' },
  { name: 'next.config.ts', type: 'file' },
];

const FileTree = ({ items, level = 0 }: { items: FileItem[]; level?: number }) => (
  <>
    {items.map((item) => (
      <div key={item.name}>
        <div
          className={`flex items-center py-1.5 cursor-pointer rounded-md text-sm ${item.active ? 'bg-primary/20 text-accent' : 'hover:bg-primary/10'}`}
          style={{ paddingLeft: `${level * 1 + 0.75}rem` }}
        >
          {item.type === 'folder' ? (
            <>
              <ChevronDown className="mr-1 h-4 w-4" />
              <Folder className="mr-2 h-4 w-4 text-primary" />
            </>
          ) : (
            <File className="mr-2 h-4 w-4 text-muted-foreground ml-5" />
          )}
          <span>{item.name}</span>
        </div>
        {item.children && <FileTree items={item.children} level={level + 1} />}
      </div>
    ))}
  </>
);

export function FileExplorer() {
  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
          Explorer
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        <h3 className="flex items-center px-2 py-1 text-sm font-medium cursor-pointer">
          <ChevronDown className="mr-1 h-4 w-4" />
          AI-CODE-EDITOR-RESEARCH-PLATFORM
        </h3>
        <div className="mt-2">
          <FileTree items={files} />
        </div>
      </div>
    </div>
  );
}
