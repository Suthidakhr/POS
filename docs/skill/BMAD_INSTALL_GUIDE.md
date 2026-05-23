# BMAD METHOD — Step-by-Step Installation Guide

**Project:** [YOUR_PROJECT_NAME]  
**Date:** [YYYY-MM-DD]  
**BMAD Version:** 6.6.0  
**Node.js:** v22.15.0 (portable, no admin required)

---

## Overview

BMAD METHOD is an AI-driven Agile framework that installs GitHub Copilot skills, agent personas, and workflow prompts into your project. It works with **any tech stack** — or even without code at all (e.g., for summarizing data, writing documents, or managing knowledge). This guide covers installation on a Windows machine **without admin rights**.

---

## Prerequisites

### Always Required (for everyone)

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | Used only to run the BMAD installer. See Step 1 if not installed. |
| VS Code | Latest | With GitHub Copilot extension |
| GitHub Copilot | Active | Extension + subscription |

### By Use Case — Install Only What You Need

**Pick the row that matches your situation:**

| Use Case | Additional Requirements | Verify with |
|---|---|---|
| **No-code / Docs / Data** | None — Node.js above is enough | — |
| **Java project** | Java JDK 8+, Maven 3.6+ | `java -version`, `mvn -v` |
| **Node.js / JavaScript project** | Node.js 18+ (already required above) | `node --version` |
| **Python project** | Python 3.8+ | `python --version` |
| **Go project** | Go 1.18+ | `go version` |
| **Other stack** | Your language runtime as needed | Your stack's version command |

> **Non-code users:** If you are using BMAD to summarize documents, manage data, or write AI-assisted content — you only need Node.js, VS Code, and GitHub Copilot. No programming language runtime is required.

---

## Step 1 — Install Node.js (No Admin Required)

> Skip this step if `node --version` and `npx --version` work in your terminal.

**Option A: Portable ZIP (recommended, no admin)**

```cmd
:: Create tools folder
mkdir D:\tools

:: Download Node.js 22 LTS ZIP via PowerShell
powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v22.15.0/node-v22.15.0-win-x64.zip' -OutFile 'D:\tools\node-v22.15.0-win-x64.zip' -UseBasicParsing"

:: Extract
powershell -Command "Expand-Archive -Path 'D:\tools\node-v22.15.0-win-x64.zip' -DestinationPath 'D:\tools\' -Force"

:: Add to PATH for this session
set "PATH=D:\tools\node-v22.15.0-win-x64;%PATH%"

:: Verify
node --version
npx --version
```

> **Note:** You must run `set "PATH=D:\tools\node-v22.15.0-win-x64;%PATH%"` at the start of every new cmd session, OR add it permanently via System Properties → Environment Variables.

**Option B: winget (requires admin)**

```cmd
winget install OpenJS.NodeJS.LTS
```

---

## Step 2 — Navigate to Project Root

```cmd
cd /d [YOUR_PROJECT_PATH]
```

> **Example:** `cd /d D:\MyWorkspace\MyProject`

Replace `[YOUR_PROJECT_PATH]` with the full path to your project root. For Java projects, this folder must contain your `pom.xml`.

---

## Step 3 — Run the BMAD Installer

```cmd
set "PATH=D:\tools\node-v22.15.0-win-x64;%PATH%"
npx bmad-method@latest install
```

The installer will prompt you interactively. Follow the steps below.

---

## Step 4 — Interactive Installer Walkthrough

### 4.1 — Confirm Installation Directory

```
◆  Installation directory:
│  [YOUR_PROJECT_PATH]
◆  Install to this directory?
│  ● Yes / ○ No
```
→ Press **Enter** to confirm **Yes**.

---

### 4.2 — Select Official Modules

```
◆  Select official modules to install:
│  ◼ BMad Core Module (v6.6.0) (always installed)
│  ◼ BMad Method Agile-AI Driven-Development (v6.6.0)
│  ◻ BMad Builder (v1.8.0)
│  ◻ BMad Creative Intelligence Suite (v0.2.0)
│  ◻ BMad Game Dev Studio (v0.4.0)
│  ◻ Test Architect (v1.17.0)
│  ◻ BMad Automator (Experimental) (v1.14.2)
│  ↑/↓ to navigate • TAB/SPACE: select • ENTER: confirm
```

**Recommended selections for most projects:**
- ◼ **BMad Core Module** — always included automatically
- ◼ **BMad Method Agile-AI Driven-Development** — pre-selected, keep it
- ◼ **Test Architect** — recommended if your project includes automated testing

Select any additional modules relevant to your project using the **↓ arrow** + **Space** to toggle, then **Enter** to confirm.

---

### 4.3 — Community Modules

```
◆  Would you like to browse community modules?
│  ○ Yes / ● No
```
→ Press **Enter** for **No** (unless you need community plugins).

---

### 4.4 — Custom Source

```
◆  Would you like to install from a custom source (Git URL or local path)?
│  ○ Yes / ● No
```
→ Press **Enter** for **No**.

---

### 4.5 — IDE Integration

```
◆  Integrate with:
│  ◻ Claude Code ⭐
│  ◻ Codex ⭐
│  ◻ Cursor ⭐
│  ◻ GitHub Copilot ⭐
│  ...
│  ↑/↓ to navigate • TAB/SPACE: select • ENTER: confirm
```
→ Select the IDE(s) you use. Type the name to filter, press **Space** to select, then **Enter**.

---

### 4.6 — Core Configuration

```
◆  What should agents call you?
│  _[YOUR_NAME_OR_TEAM_NAME]
```
→ Type your name or team name, press **Enter**.

```
◆  What is your project called?
│  _[YOUR_PROJECT_NAME]
```
→ Type your project name, press **Enter**.

```
◆  What language should agents use when chatting with you?
│  _English
```
→ Press **Enter** for English (or type your preferred language).

```
◆  Preferred document output language?
│  _English
```
→ Press **Enter** for English (or type your preferred language).

```
◆  Where should output files be saved?
│  __bmad-output
```
→ Press **Enter** for default `_bmad-output`, or type a custom folder name.

---

### 4.7 — Module Configuration

```
◆  Module configuration
│  ● Express Setup (accept all defaults (recommended))
│  ○ Customize
```
→ Press **Enter** for **Express Setup**.

---

### 4.8 — Installation Complete

You should see:

```
╭─BMAD is ready to use!────────────────────────────────────────╮
│    ✓  Shared scripts                                          │
│    ✓  BMad Method Agile-AI Driven-Development (v6.6.0)       │
│    ✓  BMad Core Module (v6.6.0)                              │
│    ✓  Module directories                                      │
│    ✓  Configurations (generated)                             │
│    ✓  Help catalog                                            │
│    ✓  github-copilot (42 skills → .agents/skills)            │
│                                                               │
│    Installed to: [YOUR_PROJECT_PATH]\_bmad                   │
╰───────────────────────────────────────────────────────────────╯
```

---

## Step 5 — Verify Installation

Check that these folders were created:

```cmd
dir /B [YOUR_PROJECT_PATH]\_bmad
dir /B [YOUR_PROJECT_PATH]\.agents\skills
```

Expected output from `_bmad`:
```
bmm
config.toml
config.user.toml
core
custom
scripts
_config
```

Expected output from `.agents\skills` (42 skills including):
```
bmad-agent-dev
bmad-agent-pm
bmad-agent-architect
bmad-qa-generate-e2e-tests
bmad-code-review
bmad-create-prd
bmad-sprint-planning
... (42 total)
```

---

## Step 6 — Confirm Your Project Still Works

After installation, verify BMAD did not affect your existing project. Run whichever command matches your stack:

| Stack | Command |
|---|---|
| Java / Maven | `mvn test` |
| Java / Gradle | `./gradlew test` |
| Node.js / npm | `npm test` |
| Node.js / yarn | `yarn test` |
| Python | `pytest` or `python -m unittest` |
| Go | `go test ./...` |
| .NET | `dotnet test` |
| No-code / Docs | No build step needed — skip this step |

Your project should build and/or pass tests exactly as before. BMAD only adds `_bmad/` and `.agents/` folders and does not touch your source code.

---

## Step 7 — Use BMAD Skills in Your IDE

In VS Code, open GitHub Copilot Chat (or your chosen IDE chat) and reference any installed skill:

| Use Case | Skill to invoke |
|---|---|
| Generate E2E tests | `bmad-qa-generate-e2e-tests` |
| Code review | `bmad-code-review` |
| Create user stories | `bmad-create-epics-and-stories` |
| Sprint planning | `bmad-sprint-planning` |
| Project documentation | `bmad-document-project` |
| Architecture design | `bmad-create-architecture` |
| Help / overview | `bmad-help` |

**Example in Copilot Chat:**
```
@workspace #bmad-qa-generate-e2e-tests
Generate unit tests for [YourServiceName] using [YourTestFramework]
```

---

## Step 8 — Add Custom BMAD Agents (Optional)

You can create **custom agents** for your project in `.github/agents/`. These let you define specialized AI personas tailored to your codebase.

**Example agent files you might create:**

| File | Purpose | Usage |
|---|---|---|
| `[project]-test-planner.agent.md` | Discover services, write TEST_PLAN.md | `@[project]-test-planner` |
| `[project]-generate-tests.agent.md` | Generate tests for your stack | `@[project]-generate-tests` |
| `[project]-todo-plan.agent.md` | Manage TODO_PLAN.md Kanban | `@[project]-todo-plan` |
| `[project]-summary-doc.agent.md` | Generate TEST_SUMMARY.md | `@[project]-summary-doc` |
| `[project]-modernize.agent.md` | Legacy code modernization tasks | `@[project]-modernize` |

**Example usage in Copilot Chat:**
```
@workspace @[project]-generate-tests
Generate unit tests for [YourServiceName]
```

> See the [BMAD documentation](https://github.com/bmadcode/bmad-method) for how to write custom agent files.

---

## Updating BMAD

To update to the latest version:

```cmd
set "PATH=D:\tools\node-v22.15.0-win-x64;%PATH%"
cd /d [YOUR_PROJECT_PATH]
npx bmad-method@latest install
```

Choose **Quick Update** at the "How would you like to proceed?" prompt.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `npx: not recognized` | Run `set "PATH=D:\tools\node-v22.15.0-win-x64;%PATH%"` first |
| `winget install` cancelled | Use portable ZIP method (Step 1 Option A) |
| Tests fail after BMAD install | BMAD only adds `._bmad/` and `.agents/` — run your test command to verify |
| 42 skills not showing in Copilot | Reload VS Code window (`Ctrl+Shift+P` → `Reload Window`) |
| Module selection not working | Use arrow keys (↑/↓) + Space in the interactive terminal |

---

## File Structure After Installation

```
[YOUR_PROJECT_PATH]\
├── _bmad/                    ← BMAD core (config, agents, scripts)
│   ├── config.toml           ← Main BMAD config (project name, language, etc.)
│   ├── config.user.toml      ← User-specific config
│   ├── core/                 ← Core module files
│   ├── bmm/                  ← Agile-AI module files
│   └── scripts/              ← Shared scripts
├── _bmad-output/             ← BMAD generated artifacts
│   ├── planning-artifacts/   ← PRDs, user stories, epics
│   └── implementation-artifacts/
├── .agents/
│   └── skills/               ← 42 GitHub Copilot skills
├── .github/
│   ├── copilot-instructions.md ← Auto-loaded project context
│   ├── agents/               ← Your custom agents (optional)
│   ├── prompts/              ← Slash command prompts
│   ├── skills/               ← Custom skills + templates
│   ├── instructions/         ← Coding conventions
│   └── docs/                 ← TEST_PLAN.md, TODO_PLAN.md, etc.
├── src/ (or your source folder) ← Your source code (if applicable)
└── [build-file]              ← e.g. pom.xml, package.json, go.mod, requirements.txt
                                 (not needed for no-code / docs use cases)
```

---

## Quick Reference: Placeholders to Replace

| Placeholder | Replace with |
|---|---|
| `[YOUR_PROJECT_NAME]` | Your actual project name (e.g., `MyApp`) |
| `[YOUR_PROJECT_PATH]` | Full path to your project root (e.g., `D:\MyWorkspace\MyApp`) |
| `[YOUR_NAME_OR_TEAM_NAME]` | Your name or team identifier |
| `[YourServiceName]` | The service or class you want to test |
| `[YourTestFramework]` | Your test framework (e.g., JUnit 5, Jest, pytest) |
| `[project]` | A short prefix for your custom agent filenames |
| `[YYYY-MM-DD]` | Today's date |
