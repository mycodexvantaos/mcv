import { EditorView } from './editor-view';
import { TerminalPanel } from './terminal-panel';

export function MainView() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <EditorView />
      </div>
      <div className="h-1/3 min-h-[150px] border-t border-border">
        <TerminalPanel />
      </div>
    </div>
  );
}
