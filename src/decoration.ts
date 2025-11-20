import * as vscode from 'vscode';
import * as path from 'path';
import { StateManager } from './state';

export class DecorationProvider implements vscode.FileDecorationProvider {
    private _onDidChangeFileDecorations: vscode.EventEmitter<vscode.Uri | undefined> = new vscode.EventEmitter<vscode.Uri | undefined>();
    readonly onDidChangeFileDecorations: vscode.Event<vscode.Uri | undefined> = this._onDidChangeFileDecorations.event;

    constructor(private state: StateManager) {
        this.state.onDidChangeDecorations((uri) => {
            this._onDidChangeFileDecorations.fire(uri);
        });
    }

    provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FileDecoration> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) return;

        const relPath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
        
        const isHidden = this.state.getHiddenItems().includes(relPath);
        const isFocused = this.state.getFocusedItems().includes(relPath);

        if (isHidden) {
            return {
                badge: "H",
                tooltip: "Marked for Hide"
            };
        }

        if (isFocused) {
            return {
                badge: "F",
                tooltip: "Marked for Focus"
            };
        }

        return undefined;
    }

    dispose() {
        this._onDidChangeFileDecorations.dispose();
    }
}
