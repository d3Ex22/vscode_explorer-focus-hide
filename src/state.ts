import * as vscode from 'vscode';
import * as path from 'path';

export class StateManager {
    private context: vscode.ExtensionContext;
    private _hideMode: boolean = false;
    private _focusMode: boolean = false;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this._hideMode = this.context.workspaceState.get('hideMode', false);
        this._focusMode = this.context.workspaceState.get('focusMode', false);
    }

    get hideMode(): boolean { return this._hideMode; }
    get focusMode(): boolean { return this._focusMode; }

    async setHideMode(value: boolean) {
        this._hideMode = value;
        await this.context.workspaceState.update('hideMode', value);
        await this.updateExclusions();
        vscode.commands.executeCommand('setContext', 'explorer-focus-hide.hideMode', value);
    }

    async setFocusMode(value: boolean) {
        this._focusMode = value;
        await this.context.workspaceState.update('focusMode', value);
        await this.updateExclusions();
        vscode.commands.executeCommand('setContext', 'explorer-focus-hide.focusMode', value);
    }

    getHiddenItems(): string[] {
        return this.context.workspaceState.get('hiddenItems', []);
    }

    getFocusedItems(): string[] {
        return this.context.workspaceState.get('focusedItems', []);
    }

    async toggleHideItem(fsPath: string) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(fsPath));
        if (!workspaceFolder) return;
        
        const relPath = path.relative(workspaceFolder.uri.fsPath, fsPath);
        let hiddenItems = this.getHiddenItems();
        let focusedItems = this.getFocusedItems();
        let changed = false;
        
        if (hiddenItems.includes(relPath)) {
            hiddenItems = hiddenItems.filter(i => i !== relPath);
            changed = true;
        } else {
            hiddenItems.push(relPath);
            changed = true;
            // Enforce mutual exclusivity: remove from focused if present
            if (focusedItems.includes(relPath)) {
                focusedItems = focusedItems.filter(i => i !== relPath);
            }
        }
        
        if (changed) {
            await this.context.workspaceState.update('hiddenItems', hiddenItems);
            await this.context.workspaceState.update('focusedItems', focusedItems);

            if (this.hideMode || this.focusMode) {
                await this.updateExclusions();
            }
            this._onDidChangeDecorations.fire(undefined);
        }
    }

    async toggleFocusItem(fsPath: string) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(fsPath));
        if (!workspaceFolder) return;

        const relPath = path.relative(workspaceFolder.uri.fsPath, fsPath);
        let focusedItems = this.getFocusedItems();
        let hiddenItems = this.getHiddenItems();
        let changed = false;

        if (focusedItems.includes(relPath)) {
            focusedItems = focusedItems.filter(i => i !== relPath);
            changed = true;
        } else {
            focusedItems.push(relPath);
            changed = true;
            // Enforce mutual exclusivity: remove from hidden if present
            if (hiddenItems.includes(relPath)) {
                hiddenItems = hiddenItems.filter(i => i !== relPath);
            }
        }

        if (changed) {
            await this.context.workspaceState.update('focusedItems', focusedItems);
            await this.context.workspaceState.update('hiddenItems', hiddenItems);
            
            if (this.focusMode || this.hideMode) {
                await this.updateExclusions();
            }
            this._onDidChangeDecorations.fire(undefined);
        }
    }

    async resetItem(fsPath: string) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(fsPath));
        if (!workspaceFolder) return;

        const relPath = path.relative(workspaceFolder.uri.fsPath, fsPath);
        let focusedItems = this.getFocusedItems();
        let hiddenItems = this.getHiddenItems();
        let changed = false;

        if (focusedItems.includes(relPath)) {
            focusedItems = focusedItems.filter(i => i !== relPath);
            changed = true;
        }
        if (hiddenItems.includes(relPath)) {
            hiddenItems = hiddenItems.filter(i => i !== relPath);
            changed = true;
        }

        if (changed) {
            await this.context.workspaceState.update('focusedItems', focusedItems);
            await this.context.workspaceState.update('hiddenItems', hiddenItems);

            if (this.focusMode || this.hideMode) {
                await this.updateExclusions();
            }
            this._onDidChangeDecorations.fire(undefined);
        }
    }

    private _onDidChangeDecorations = new vscode.EventEmitter<vscode.Uri | undefined>();
    get onDidChangeDecorations(): vscode.Event<vscode.Uri | undefined> {
        return this._onDidChangeDecorations.event;
    }

    // --- Core Logic ---

    private async calculateFocusExclusions(root: vscode.WorkspaceFolder, focusedItems: string[]): Promise<string[]> {
        const keepTree = new Set<string>();
        keepTree.add('.'); // Root
        
        for (const item of focusedItems) {
            const parts = item.split('/');
            let current = '';
            for (const part of parts) {
                current = current ? `${current}/${part}` : part;
                keepTree.add(current);
            }
        }

        const toExclude: string[] = [];
        const keepList = Array.from(keepTree);
        
        for (const keepPath of keepList) {
            if (focusedItems.includes(keepPath)) {
                continue;
            }
            
            const fullPath = keepPath === '.' ? root.uri.fsPath : path.join(root.uri.fsPath, keepPath);
            
            try {
                const stat = await vscode.workspace.fs.stat(vscode.Uri.file(fullPath));
                if ((stat.type & vscode.FileType.Directory) !== 0) {
                    const children = await vscode.workspace.fs.readDirectory(vscode.Uri.file(fullPath));
                    for (const [name, type] of children) {
                        const childRelPath = keepPath === '.' ? name : `${keepPath}/${name}`;
                        if (!keepTree.has(childRelPath)) {
                            toExclude.push(childRelPath);
                        }
                    }
                }
            } catch (e) {
                // Path might not exist (deleted?), ignore
            }
        }
        
        return toExclude;
    }

    async updateExclusions() {
        const config = vscode.workspace.getConfiguration('files');
        const currentExclusions = config.inspect('exclude')?.workspaceValue || {};
        const newExclusions: Record<string, boolean> = { ...(currentExclusions as Record<string, boolean>) };
        
        const hiddenItems = this.getHiddenItems();
        const focusedItems = this.getFocusedItems();

        // 1. Calculate Focus Logic First (Priority)
        let focusExclusions: string[] = [];
        if (this.focusMode && focusedItems.length > 0) {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders) {
                for (const folder of workspaceFolders) {
                    const siblings = await this.calculateFocusExclusions(folder, focusedItems);
                    focusExclusions.push(...siblings);
                }
            }
        }

        // 2. Apply Logic
        const oldManaged = this.context.workspaceState.get<string[]>('managedExclusions', []);
        for (const key of oldManaged) {
            delete newExclusions[key];
        }

        const keysWeSet: string[] = [];

        // If Focus Mode is ON
        if (this.focusMode && focusedItems.length > 0) {
            // Apply focus exclusions (siblings of focused items)
            focusExclusions.forEach(ex => {
                newExclusions[ex] = true;
                keysWeSet.push(ex);
            });

            // If Hide Mode is ALSO ON
            if (this.hideMode) {
                for (const hidden of hiddenItems) {
                     // If a folder is hidden but is a parent of a focused item, 
                     // we must NOT hide it, otherwise the child won't be visible.
                     if (this.isParentOfAnyFocus(hidden, focusedItems)) {
                         continue;
                     }
                     newExclusions[hidden] = true;
                     keysWeSet.push(hidden);
                }
            }
        } 
        // If Focus Mode is OFF (Pure Hide Mode)
        else if (this.hideMode) {
             for (const item of hiddenItems) {
                 newExclusions[item] = true;
                 keysWeSet.push(item);
             }
        }

        await this.context.workspaceState.update('managedExclusions', keysWeSet);
        await config.update('exclude', newExclusions, vscode.ConfigurationTarget.Workspace);
    }

    private isParentOfAnyFocus(hiddenPath: string, focusedItems: string[]): boolean {
        for (const focus of focusedItems) {
            if (focus.startsWith(hiddenPath + '/') || focus === hiddenPath) {
                return true;
            }
        }
        return false;
    }
}
