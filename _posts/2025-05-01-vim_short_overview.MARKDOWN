---
layout: post
title: "Vim Essentials: Your Roadmap to Lightning-Fast Coding"
url: /vim_short_overview
file_name: vim_short_overview
---

Below is a **comprehensive overview** of Vim’s commands, subcommands, and options. Because Vim is extremely feature-rich, no single guide can capture every detail the same way the built-in `:help` does. However, this aims to serve as a **“definitive” high-level reference** to help you discover and understand most of Vim’s functionality. For **further detail**, always refer to Vim’s built-in help (e.g., `:help <topic>`) or the [online Vim documentation](https://vimhelp.org/).

---

# Table of Contents

- [Table of Contents](#table-of-contents)
  - [1. Vim Modes](#1-vim-modes)
  - [2. Basic Movement and Navigation Commands](#2-basic-movement-and-navigation-commands)
  - [3. Editing and Insertion Commands](#3-editing-and-insertion-commands)
    - [Entering Insert Mode](#entering-insert-mode)
    - [Basic Edits (Normal Mode)](#basic-edits-normal-mode)
    - [Deleting (Normal Mode)](#deleting-normal-mode)
    - [Copying \& Pasting (Normal Mode)](#copying--pasting-normal-mode)
  - [4. Visual Mode and Selections](#4-visual-mode-and-selections)
  - [5. Command-Line Mode (Ex Commands)](#5-command-line-mode-ex-commands)
  - [6. Searching and Replacing](#6-searching-and-replacing)
    - [Search](#search)
    - [Search Options](#search-options)
    - [Replace](#replace)
  - [7. Window, Buffer, and Tab Management](#7-window-buffer-and-tab-management)
    - [Buffers](#buffers)
    - [Windows (Splits)](#windows-splits)
    - [Tabs](#tabs)
  - [8. Registers, Macros, and Undo/Redo](#8-registers-macros-and-undoredo)
    - [Registers](#registers)
    - [Macros](#macros)
    - [Undo/Redo](#undoredo)
  - [9. Marks, Jumps, and Positions](#9-marks-jumps-and-positions)
  - [10. Folding and Outline View](#10-folding-and-outline-view)
  - [11. Sessions, Views, and Persistent Settings](#11-sessions-views-and-persistent-settings)
  - [12. Vim’s Configuration Files (vimrc) and Options](#12-vims-configuration-files-vimrc-and-options)
    - [`.vimrc` (or `vim.init`)](#vimrc-or-viminit)
    - [Common Settings](#common-settings)
  - [13. Plugin Management Basics](#13-plugin-management-basics)
  - [14. Useful “Hidden Gems”](#14-useful-hidden-gems)
  - [15. Additional Resources](#15-additional-resources)
- [Conclusion](#conclusion)

---

<a name="vim-modes"></a>

## 1. Vim Modes

Vim has several modes, each with its own set of commands:

1. **Normal Mode**  
   - Default mode for navigation, text manipulation commands (e.g., `dd`, `yy`, `p`).  
   - Press `Esc` or `Ctrl-[` to enter Normal Mode from other modes.

2. **Insert Mode**  
   - Text insertion and editing, similar to typical text editors.  
   - Entered via `i`, `a`, `o`, etc. from Normal Mode.

3. **Visual Mode**  
   - Selecting and manipulating text.  
   - Entered via `v` (character-wise), `V` (line-wise), or `Ctrl-v` (block-wise).

4. **Select Mode**  
   - Similar to Visual Mode but replaces the selection when you type. (Less commonly used.)

5. **Command-Line (Ex) Mode**  
   - Entered by typing `:` (colon), `?` or `/` for search.  
   - Execute commands like `:w`, `:q`, `:s`, etc.

6. **Replace Mode**  
   - Overwrites existing text as you type.  
   - Entered with `R` in Normal Mode.

7. **Operator-Pending Mode**  
   - Appears after starting an operation (e.g., `d`, `y`, `>`). Awaits a motion command (e.g., `w`, `2w`, `}`) or text object.

---

<a name="basic-movement"></a>

## 2. Basic Movement and Navigation Commands

Vim provides extensive navigation shortcuts. In **Normal Mode**:

| Command | Description                                              |
|---------|----------------------------------------------------------|
| `h`     | Move left one character                                  |
| `j`     | Move down one line                                      |
| `k`     | Move up one line                                        |
| `l`     | Move right one character                                 |
| `w`     | Move to next word start                                 |
| `b`     | Move to previous word start                             |
| `e`     | Move to next word end                                  |
| `0`     | Move to the beginning of the line                       |
| `^`     | Move to the first non-blank character of the line       |
| `$`     | Move to the end of the line                             |
| `gg`    | Go to the first line of the file                        |
| `G`     | Go to the last line of the file                         |
| `:n`    | Go to line `n` (e.g., `:25` goes to line 25)            |
| `%`     | Jump to matching bracket/parenthesis                    |
| `H`     | Move to top of the screen (Home)                        |
| `M`     | Move to the middle of the screen                        |
| `L`     | Move to the bottom (Last) of the screen                 |
| `Ctrl-e`| Scroll window down (without moving cursor)              |
| `Ctrl-y`| Scroll window up (without moving cursor)                |
| `Ctrl-f`| Page forward                                            |
| `Ctrl-b`| Page backward                                           |
| `Ctrl-d`| Half-page down                                          |
| `Ctrl-u`| Half-page up                                            |

Most movement commands can be **prefixed with a count** (e.g., `5j` moves 5 lines down).

---

<a name="editing-insertion"></a>

## 3. Editing and Insertion Commands

### Entering Insert Mode

| Command | Description                                                |
|---------|------------------------------------------------------------|
| `i`     | Insert before the cursor                                  |
| `a`     | Insert (append) after the cursor                          |
| `I`     | Insert at the beginning of the line                       |
| `A`     | Insert (append) at the end of the line                    |
| `o`     | Open a new line below the current line and enter insert   |
| `O`     | Open a new line above the current line and enter insert   |
| `gi`    | Insert at the last insert position                        |

### Basic Edits (Normal Mode)

| Command    | Description                                                               |
|------------|---------------------------------------------------------------------------|
| `x`        | Delete the character under the cursor                                    |
| `X`        | Delete the character before the cursor                                   |
| `r<char>`  | Replace a single character under the cursor with `<char>`                |
| `s`        | Delete character under cursor, then start Insert Mode                    |
| `cc`       | Change (replace) an entire line (equivalent to `S`)                      |
| `cw`       | Change (replace) from cursor to the end of the current word              |
| `c{motion}`| Change the text specified by a motion (e.g., `c$` to change to end of line) |
| `C`        | Change from cursor to end of line (equivalent to `c$`)                   |
| `~`        | Toggle case of the character under cursor                                 |
| `u`        | Undo (see also [Undo/Redo](#registers-macros))                           |
| `Ctrl-r`   | Redo                                                                     |

### Deleting (Normal Mode)

| Command    | Description                                                                 |
|------------|-----------------------------------------------------------------------------|
| `d{motion}`| Delete the text specified by the motion (e.g., `dw`, `d2w`, `dd` for line)  |
| `dd`       | Delete the current line                                                     |
| `D`        | Delete from the cursor to the end of the line (equivalent to `d$`)          |

### Copying & Pasting (Normal Mode)

| Command    | Description                                                                          |
|------------|--------------------------------------------------------------------------------------|
| `y{motion}`| Yank (copy) text specified by a motion (e.g., `yw`, `yy`)                           |
| `yy`       | Yank the current line                                                                |
| `p`        | Put (paste) the yanked or deleted text after the cursor                              |
| `P`        | Put (paste) the yanked or deleted text before the cursor                             |

---

<a name="visual-mode"></a>

## 4. Visual Mode and Selections

- **`v`**: Start character-wise visual selection.  
- **`V`**: Start line-wise visual selection.  
- **`Ctrl-v`**: Start block-wise visual selection.  
- Use normal motion commands (`h/j/k/l/w/b/0/$`) to expand or shrink the selection.  
- Once selected, you can apply editing commands:
  - `d` to delete the selection  
  - `y` to yank the selection  
  - `>` or `<` to shift (indent/outdent)  
  - `c` to change (replace) the selection, etc.

---

<a name="command-line-mode"></a>

## 5. Command-Line Mode (Ex Commands)

You enter Command-Line mode by pressing `:` in Normal Mode. The **Ex commands** let you perform file operations, search and replace, run macros, and much more.

Common Ex commands:

| Command       | Description                                                  |
|---------------|--------------------------------------------------------------|
| `:w`          | Write (save) the current file                                |
| `:w filename` | Write (save as) to `filename`                                |
| `:q`          | Quit Vim                                                     |
| `:q!`         | Quit without saving changes                                  |
| `:wq`         | Write and quit                                               |
| `:x`          | Same as `:wq` if the file changed, otherwise just quit       |
| `:e filename` | Edit/open `filename` in the current buffer                   |
| `:help topic` | Display help for `topic`                                     |
| `:ls` or `:buffers` | List all open buffers                                 |
| `:b <n>` or `:buffer <n>` | Switch to buffer number `<n>`                   |
| `:split <file>` | Split window horizontally and open `<file>`                |
| `:vsplit <file>` | Split window vertically and open `<file>`                |
| `:vert help <topic>` | Open help in a vertical split                        |
| `:read !cmd`  | Insert the output of external shell command `cmd`           |
| `:write !cmd` | Send the current buffer (or selection) as input to `cmd`     |
| `:!cmd`       | Run shell command `cmd`                                     |
| `:cd` or `:lcd` | Change directory (global or local to the window)          |
| `:colorscheme <name>` | Change current color scheme                          |
| `:syntax on/off` | Enable or disable syntax highlighting                     |

Many Ex commands can take **ranges** (like `:1,10`, `:%`, `:'<,'>`, etc.) to specify lines or the entire file.

---

<a name="search-replace"></a>

## 6. Searching and Replacing

### Search

- **`/pattern`**: Search forward for `pattern`. Press `n` to go to the next match, `N` for the previous.
- **`?pattern`**: Search backward for `pattern`. Press `n` to go to the next match (still forward in the search sense), `N` for the previous.
- **`\c`, `\C`**: Within the pattern, `\c` can force case-insensitivity, `\C` can force case-sensitivity (depending on your settings).

### Search Options

| Setting          | Description                                                         |
|------------------|---------------------------------------------------------------------|
| `:set ignorecase`| Makes searches case-insensitive                                     |
| `:set smartcase` | If the search pattern has an uppercase letter, match case exactly   |
| `:set hlsearch`  | Highlight matches of the last used search                           |
| `:set incsearch` | Incrementally highlight matches as you type the search pattern      |

### Replace

You can do search and replace with the Ex command `:substitute`:

```
:[range]s/{pattern}/{replacement}/[flags]
```

- **`%`** range means all lines in the file.  
- **`g`** flag (at the end) means replace all occurrences in each line.  
- **`c`** flag means confirm each replacement.  

**Examples:**

- `:%s/foo/bar/g`  
  Replace all `foo` with `bar` in the entire file, all occurrences per line.
- `:'<,'>s/foo/bar/gc`  
  Replace within a visual selection, with confirmation.

---

<a name="windows-buffers-tabs"></a>

## 7. Window, Buffer, and Tab Management

### Buffers

- Vim manages each open file (or text) as a **buffer**.
- A buffer may be displayed in a window or be hidden in the background.

Key commands:

| Command       | Description                                              |
|---------------|----------------------------------------------------------|
| `:ls` or `:buffers` | List all buffers                                  |
| `:b <n>` or `:buffer <n>` | Switch to buffer `<n>`                     |
| `:bd <n>` or `:bdelete <n>` | Close buffer `<n>` but keep window open   |
| `:bw <n>` or `:bwipeout <n>` | Wipe out buffer `<n>` entirely           |
| `bn`          | Go to next buffer                                       |
| `bp`          | Go to previous buffer                                   |
| `[count]gt`   | Go to [count]-th tab (if using tabs)                    |

### Windows (Splits)

- **Horizontal split**: `:split` or shortcut `Ctrl-w s`
- **Vertical split**: `:vsplit` or shortcut `Ctrl-w v`
- **Navigation**: Use `Ctrl-w + direction key (h/j/k/l)` to move among splits.
- **Resizing**:
  - `Ctrl-w =` auto-equalize all split sizes
  - `Ctrl-w <` or `>` to shrink or grow horizontally
  - `Ctrl-w +` or `-` to grow or shrink vertically

### Tabs

- **`:tabnew [file]`**: Open a new tab (optionally with `file`).
- **`:tabedit file`**: Open `file` in a new tab.
- **`:tabs`**: List all tabs.
- **`gt`**: Go to the next tab, **`gT`** for the previous tab.
- **`:tabclose [N]`**: Close current tab (or tab N).
- **`:tabmove [N]`**: Move current tab to position N (0-based).

---

<a name="registers-macros"></a>

## 8. Registers, Macros, and Undo/Redo

### Registers

- When you yank or delete text, it goes into the **unnamed register** (`""`) by default.
- You can specify a register (named `a` to `z`) before a command:  
  - `"ayy` → yank current line into register `a`.  
  - `"ap` → paste from register `a`.
- Some special registers:  
  - `"*` or `"+` for system clipboard (depending on build).  
  - `"_` is the black-hole register (discard).  
  - `":` last command-line command.  
  - `"/` last search pattern.

### Macros

- **Record** a macro: `q<register>` to start recording to a register, then type your commands, then `q` again to stop.
- **Execute** the macro: `@<register>`.
- **Repeat** the last executed macro: `@@`.

Example:

1. `qa` → start recording into register `a`.
2. Type commands, e.g., move down, yank a line, etc.
3. Press `q` to stop.
4. `@a` → replay those commands.

### Undo/Redo

| Command    | Description                             |
|------------|-----------------------------------------|
| `u`        | Undo the last change                    |
| `Ctrl-r`   | Redo the last undone change             |
| `:undo N`  | Undo back to a certain undo state (N)   |
| `:redo N`  | Redo forward to a certain state (N)     |
| `g+` or `g-` | Go to newer or older text state       |

---

<a name="marks-jumps"></a>

## 9. Marks, Jumps, and Positions

Marks let you set bookmarks in a file:

- **`m<letter>`** to set a mark named `<letter>` at the current cursor position.
- **`'<letter>`** to jump to the start of the line where the mark is set.
- **`` `<letter> ``** (backtick + letter) to jump to the exact cursor position of the mark.
- Marks can be **lowercase** (local to current file) or **uppercase** (global across files).

Other position-related features:

- **Jumps**: Vim keeps a jump list (like a navigation history). Use `Ctrl-o` to go to older position, `Ctrl-i` to go to newer position.
- **Change list**: Jump among changes with `g;` (back) and `g,` (forward).

---

<a name="folding"></a>

## 10. Folding and Outline View

Vim supports folding (collapsing) sections of text:

- **`zf{motion}`**: Create a fold based on a motion (e.g., `zf%`).
- **`zfa}`**: Create a fold from here to the matching `}`.
- **`zd`**: Delete the fold under the cursor.
- **`zo`**: Open the fold under the cursor.
- **`zc`**: Close the fold under the cursor.
- **`zO`**: Open all folds at the cursor recursively.
- **`zC`**: Close all folds at the cursor recursively.
- **`:set foldmethod=indent/syntax/marker/etc.`**: Various ways to define folds automatically.

---

<a name="sessions-views"></a>

## 11. Sessions, Views, and Persistent Settings

- **Sessions** store the state of all open windows, buffers, and tabs:
  - `:mksession session.vim` creates a session file.
  - `:source session.vim` loads it back.
- **Views** store window-specific settings (folds, cursor position, etc.):
  - `:mkview 1`  
  - `:loadview 1`
- **Persisting** your settings in `.vimrc` or `init.vim` (Neovim).

---

<a name="vimrc-options"></a>

## 12. Vim’s Configuration Files (vimrc) and Options

### `.vimrc` (or `vim.init`)

- Main configuration file read at startup (unless `-u NONE`).
- Typical location: `~/.vimrc` or `~/.config/nvim/init.vim` (Neovim).
- Contains **Ex** commands, `set` statements, plugin configurations, etc.

### Common Settings

You can set options using `:set <option>`, for example:

| Option                | Description                                                                                  |
|-----------------------|----------------------------------------------------------------------------------------------|
| `:set number` / `:set nonumber` | Show or hide line numbers                                                        |
| `:set relativenumber` | Show relative line numbers                                                                  |
| `:set expandtab`      | Insert spaces instead of tabs                                                               |
| `:set tabstop=4`      | Number of spaces a tab counts for (when reading a file)                                     |
| `:set shiftwidth=4`   | Number of spaces used for each step of (auto)indent                                         |
| `:set softtabstop=4`  | Number of spaces Vim uses while editing in Insert Mode for a tab                            |
| `:set autoindent`     | Auto-indent new lines to the same indentation as the current line                           |
| `:set smartindent`    | Smarter autoindenting for code                                                              |
| `:set cursorline`     | Highlight the line under the cursor                                                         |
| `:set wrap`           | Wrap long lines at the window boundary (enable/disable)                                     |
| `:set linebreak`      | Break lines at word boundaries (when wrap is on)                                            |
| `:set ruler`          | Show the cursor position at the bottom right                                                |
| `:set showcmd`        | Show partial Normal Mode commands in the last line                                          |
| `:set showmatch`      | Briefly jump to matching bracket when inserting a bracket                                   |
| `:set incsearch`      | Incremental search (highlight as you type)                                                  |
| `:set hlsearch`       | Highlight all search matches                                                                |
| `:set ignorecase`     | Case-insensitive search (unless uppercase letter is used and `smartcase` is set)            |
| `:set smartcase`      | Case-insensitive unless the pattern contains uppercase                                      |
| `:set wildmenu`       | Enhanced command-line completion                                                            |
| `:set history=1000`   | Number of Ex commands, search patterns stored in history                                    |

- Place these in your `.vimrc` for automatic loading.

---

<a name="plugin-management"></a>

## 13. Plugin Management Basics

While older Vim setups used plugin managers like **Pathogen** or **Vundle**, modern ones often use:

- **vim-plug**  

  ```vim
  call plug#begin('~/.vim/plugged')
    Plug 'tpope/vim-sensible'
    Plug 'scrooloose/nerdtree'
    ...
  call plug#end()
  ```

  Then run `:PlugInstall`.

- **dein.vim**  
- **packer.nvim** (for Neovim)  
- **lazy.nvim** (for Neovim)

These managers automate downloading and updating plugins from Git repositories.

---

<a name="hidden-gems"></a>

## 14. Useful “Hidden Gems”

1. **Command Repetition**:  
   - **`.`** in Normal Mode repeats the last change.
2. **Text Objects**:  
   - `ciw` (change inside word), `di(` (delete inside parentheses), `ya"` (yank around quotes), etc.
3. **Omni Completion**:  
   - In Insert Mode, `Ctrl-x Ctrl-o` triggers context-aware auto-completion (requires `:set omnifunc=...`).
4. **Increment/Decrement Numbers**:  
   - `Ctrl-a` to increment, `Ctrl-x` to decrement the number under the cursor.
5. **Abbreviations**:  
   - `:iabbrev teh the` → automatically correct “teh” to “the” in Insert Mode.
6. **Spell Checking**:  
   - `:set spell spelllang=en_us`, then `]s` / `[s` to jump to next/previous misspelling, `z=` to see suggestions.
7. **Diff Mode**:  
   - `vimdiff file1 file2` or in an existing Vim session: `:diffsplit file2`.
8. **Global Commands**:  
   - `:global /pattern/ command` → run an Ex command on all lines matching `pattern`.
9. **Filtering**:  
   - `:'<,'>!sort` → pipe a visual selection to the `sort` command, replace with its output.

---

<a name="additional-resources"></a>

## 15. Additional Resources

- **Built-in help**:  
  - `:help`  
  - `:help <topic>` (for any command, e.g., `:help :substitute`, `:help text-objects`)  
  - `:help index` for an alphabetical index of all help topics.  
- **[Vim Help Online](https://vimhelp.org/)**: A browsable, up-to-date version of the official Vim docs.  
- **Vim Tips Wiki**: <http://vim.wikia.com/wiki/Vim_Tips_Wiki> (archive of user-contributed tips).  
- **Learning resources**:  
  - `vimtutor` (a built-in interactive tutorial, run from the terminal).

---

# Conclusion

This guide outlines **most** of Vim’s primary commands, subcommands, and configuration options—from the basic movements and editing commands to advanced features like macros, folding, and plugin management. However, Vim’s functionality is extensive, and the best way to discover everything is by **experimenting** with commands and consulting `:help` for deeper explanations and usage examples.

If you want a truly exhaustive reference, **Vim’s help system** is the definitive source. The combination of exploring with `:help`, customizing your `.vimrc`, and practicing everyday usage will give you the fullest command of Vim’s power. Enjoy your Vim journey!
