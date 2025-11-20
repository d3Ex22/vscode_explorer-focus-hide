# Explorer Focus & Hide

**Explorer Focus & Hide** allows you to take control of your VS Code file explorer. Hide distracting files or focus only on what matters for your current task.

## Features

### 🎯 Focus Mode
Keep only the files relevant to your current task visible.
- **Right-click** a file or folder and select **"Mark for Focus"**.
- Toggle **Focus Mode** using the target icon in the explorer title bar.
- When active, everything else is hidden, except the path to your focused items.

### 👁️ Hide Mode
Quickly hide distracting files or generated folders.
- **Right-click** a file or folder and select **"Mark for Hide"**.
- Toggle **Hide Mode** using the eye icon in the explorer title bar.
- Hidden items are added to your workspace exclusion list efficiently.

### ⚡ Mixed Mode
Both modes can work together with smart priority logic:
- If a folder is hidden but contains a focused item, the folder remains visible to allow access to the focused content.
- **Focus** takes precedence over **Hide** when conflicts occur in the hierarchy.

### 🔄 Reset
- Easily **Reset** an item's status (remove it from both Focus and Hide lists) via the context menu.

## Visual Indicators

Files are marked with subtle badges in the explorer:
- **F**: Item is marked for **Focus**.
- **H**: Item is marked for **Hide**.

## Installation

1. Install via the VS Code Marketplace.
2. Reload VS Code.

## Credits & Acknowledgments

This extension was created by **d3Ex22**.

It is heavily inspired by the [Workspace](https://marketplace.visualstudio.com/items?itemName=Fooxly.workspace) extension created by **Fooxly**.
Big thanks to Fooxly for the original idea and initial work on the concept.
Original repository: [https://github.com/Fooxly/workspace](https://github.com/Fooxly/workspace)

## License

This project is licensed under the AGPL-3.0 License.

### Original License (Fooxly/workspace)

The original concept and parts of the inspiration come from `Fooxly/workspace` which is licensed under MIT:

```
MIT License

Copyright (c) 2019 Fooxly

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
