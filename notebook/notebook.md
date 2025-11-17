# Phân Tích Project MCPorter 🧳

## Tổng quan

**MCPorter** là một TypeScript runtime, CLI và code-generation toolkit được xây dựng cho **Model Context Protocol (MCP)**. Đây là công cụ giúp developers tương tác với các MCP servers một cách dễ dàng, linh hoạt thông qua command line interface hoặc TypeScript code.

**Repository:** https://github.com/steipete/mcporter
**Version hiện tại:** 0.6.0
**License:** MIT
**Tác giả:** Sweetistics

---

## 1. Chức Năng Chính của MCPorter

### 1.1. Zero-Config Discovery (Khám Phá Tự Động)

MCPorter tự động phát hiện và kết nối với các MCP servers đã được cấu hình trong:
- **Cursor** - Code editor
- **Claude Code/Desktop** - AI coding assistant
- **Codex** - OpenAI's codex
- **Windsurf** - Code editor
- **OpenCode** - Code editor
- **VS Code** - Visual Studio Code

**Các tính năng:**
- Tự động merge configs từ `~/.mcporter/mcporter.json` và `config/mcporter.json`
- Hỗ trợ biến môi trường với cú pháp `${ENV}`, `${ENV:-fallback}`, `$env:VAR`
- Connection pooling để tái sử dụng transports
- Import precedence theo thứ tự cấu hình

### 1.2. One-Command CLI Generation

Tạo standalone CLI từ bất kỳ MCP server nào chỉ với một lệnh:

```bash
npx mcporter generate-cli --command https://mcp.context7.com/mcp
```

**Kết quả:**
- File TypeScript template với embedded schemas
- Bundled CLI (sử dụng Rolldown hoặc Bun)
- Optional compiled binary (với `--compile`)
- Embedded metadata cho regeneration

### 1.3. Typed Tool Clients

Generate TypeScript type definitions và client wrappers:

```bash
# Chỉ types
npx mcporter emit-ts linear --out types/linear-tools.d.ts

# Client wrapper + types
npx mcporter emit-ts linear --mode client --out clients/linear.ts
```

**Lợi ích:**
- Strong TypeScript typing
- Autocomplete trong IDE
- Compile-time type checking
- Runtime validation

### 1.4. Friendly Composable API

API được thiết kế để dễ sử dụng:
- **camelCase methods** - `takeSnapshot()` thay vì `take_snapshot`
- **Automatic JSON-schema defaults** - Tự động áp dụng giá trị mặc định
- **Required argument validation** - Kiểm tra tham số bắt buộc
- **CallResult helpers** - `.text()`, `.markdown()`, `.json()`, `.content()`

### 1.5. OAuth và Stdio Ergonomics

- **Built-in OAuth caching** - Cache tokens tự động
- **Browser-based login flow** - Tự động mở browser để login
- **Auto-detection** - Tự động phát hiện hosted MCPs cần OAuth
- **Log tailing** - Theo dõi logs real-time
- **Unified interface** - HTTP, SSE, stdio từ cùng interface

### 1.6. Ad-hoc Connections

Kết nối với bất kỳ MCP endpoint nào mà không cần chỉnh sửa config:

```bash
# HTTP endpoint
npx mcporter list --http-url https://mcp.linear.app/mcp

# Stdio command
npx mcporter call --stdio "bun run ./local-server.ts" --env TOKEN=xyz

# Persist sau này
npx mcporter call --stdio "..." --persist config/mcporter.local.json
```

### 1.7. Daemon Mode

Giữ MCP servers "warm" (luôn chạy sẵn) để tăng performance:

```bash
mcporter daemon start    # Khởi động daemon
mcporter daemon status   # Kiểm tra trạng thái
mcporter daemon restart  # Khởi động lại
mcporter daemon stop     # Dừng daemon
```

**Use cases:**
- Stateful servers: chrome-devtools, mobile-mcp
- Servers cần giữ session: database connections
- Performance optimization: tránh cold starts

---

## 2. Tác Dụng và Use Cases

### 2.1. Cho Developers Sử Dụng MCP

**a) Khám phá và Test Tools**
- Liệt kê tất cả tools có sẵn từ MCP servers
- Xem signatures, parameters, descriptions
- Test tools trực tiếp từ terminal
- Debug tool behavior nhanh chóng

**b) Integration vào Workflows**
- Tích hợp MCP tools vào bash scripts
- Sử dụng trong CI/CD pipelines
- Automation tasks với MCP capabilities
- Chain multiple tool calls

**c) Development Experience**
- TypeScript intellisense
- Auto-correction cho typos
- Friendly error messages
- Rich output formatting

### 2.2. Cho AI Agents

**a) Typed Interface**
```typescript
import { createRuntime, createServerProxy } from "mcporter";

const runtime = await createRuntime();
const linear = createServerProxy(runtime, "linear");

const issues = await linear.listIssues({ assignee: "me" });
console.log(issues.json());
```

**b) Connection Pooling**
- Reuse transports across calls
- Avoid repeated OAuth flows
- Better performance
- Resource efficiency

**c) Result Helpers**
```typescript
const result = await chrome.takeSnapshot();

result.text()      // Plain text
result.markdown()  // Markdown format
result.json()      // JSON parsed
result.content()   // Original content array
result.raw         // Full MCP envelope
```

### 2.3. Cho Việc Chia Sẻ Tools

**a) Standalone CLIs**
- Bundle MCP server thành single executable
- Share với team không cần setup
- No boilerplate code required
- Embedded documentation

**b) Distribution**
```bash
# Generate và compile
mcporter generate-cli linear --compile --runtime bun

# Share binary
./linear list_issues --assignee me
```

**c) Documentation**
- Auto-generated TypeScript signatures
- Inline comments từ tool descriptions
- Example commands
- Return type hints

### 2.4. Code Execution Workflows

Theo hướng dẫn "Code Execution with MCP" của Anthropic:

**a) Discover**
```bash
npx mcporter list
```

**b) Call Directly**
```bash
npx mcporter call linear.create_comment issueId:ENG-123 body:"Fixed"
```

**c) Compose in TypeScript**
```typescript
const runtime = await createRuntime();
const linear = createServerProxy(runtime, "linear");
const chrome = createServerProxy(runtime, "chrome-devtools");

// Complex automation
const snapshot = await chrome.takeSnapshot();
const analysis = await analyzeSnapshot(snapshot.content());
await linear.createComment({
  issueId: "ENG-123",
  body: analysis
});
```

**d) Mint CLIs**
```bash
mcporter generate-cli --command "my-automation" --compile
```

---

## 3. Hướng Dẫn Sử Dụng Chi Tiết

### 3.1. Cài Đặt

#### Option 1: Dùng ngay với npx (Không cần cài đặt)
```bash
npx mcporter list
```

**Ưu điểm:**
- Không cần cài đặt gì
- Luôn dùng version mới nhất
- Phù hợp cho thử nghiệm

**Nhược điểm:**
- Chậm hơn khi khởi động
- Tải package mỗi lần chạy

#### Option 2: Thêm vào Project
```bash
# Với pnpm
pnpm add mcporter

# Với npm
npm install mcporter

# Với yarn
yarn add mcporter
```

**Ưu điểm:**
- Khởi động nhanh
- Lock version trong package.json
- Phù hợp cho production

#### Option 3: Global Install
```bash
npm install -g mcporter
```

**Ưu điểm:**
- Dùng được ở mọi nơi
- Command ngắn gọn: `mcporter` thay vì `npx mcporter`

#### Option 4: Homebrew (macOS/Linux)
```bash
brew tap steipete/tap
brew install steipete/tap/mcporter
```

**Ưu điểm:**
- Quản lý version dễ dàng với brew
- Auto-update với `brew upgrade`

### 3.2. Configuration

#### Config File Structure

**Vị trí config:**
1. `--config <path>` - Explicit path
2. `MCPORTER_CONFIG` environment variable
3. `<root>/config/mcporter.json` - Project config
4. `~/.mcporter/mcporter.json` - System config

**Format config:**
```jsonc
{
  "mcpServers": {
    "context7": {
      "description": "Context7 docs MCP",
      "baseUrl": "https://mcp.context7.com/mcp",
      "headers": {
        "Authorization": "$env:CONTEXT7_API_KEY"
      }
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"],
      "env": { "npm_config_loglevel": "error" },
      "lifecycle": "keep-alive"
    },
    "linear": {
      "baseUrl": "https://mcp.linear.app/mcp",
      "oauth": {
        "authUrl": "https://linear.app/oauth/authorize",
        "tokenUrl": "https://api.linear.app/oauth/token",
        "clientId": "${LINEAR_CLIENT_ID}",
        "clientSecret": "${LINEAR_CLIENT_SECRET}",
        "scope": "read write"
      }
    }
  },
  "imports": ["cursor", "claude-code", "claude-desktop", "codex", "windsurf", "opencode", "vscode"]
}
```

#### Environment Variables

**Supported formats:**
- `${VAR}` - Standard shell-style
- `${VAR:-fallback}` - With default value
- `$env:VAR` - PowerShell-style

**Common variables:**
```bash
export LINEAR_API_KEY="sk_linear_..."
export CONTEXT7_API_KEY="..."
export VERCEL_ACCESS_TOKEN="..."
export MCPORTER_LOG_LEVEL="debug"
export MCPORTER_CALL_TIMEOUT="30000"
export MCPORTER_LIST_TIMEOUT="30000"
export MCPORTER_OAUTH_TIMEOUT_MS="60000"
```

#### Quản lý Config với CLI

```bash
# Liệt kê tất cả servers
mcporter config list

# Xem specific server
mcporter config get linear

# Thêm server mới
mcporter config add my-server https://api.example.com/mcp

# Thêm với scope
mcporter config add global-tool https://... --scope home
mcporter config add project-tool https://... --scope project

# Xóa server
mcporter config remove my-server

# Import từ editors
mcporter config import cursor --copy

# Check config health
mcporter config doctor
```

### 3.3. Listing MCP Servers và Tools

#### List All Servers
```bash
# Xem tất cả servers đã config
npx mcporter list

# Output:
# context7 - Context7 docs MCP
#   5 tools · HTTP https://mcp.context7.com/mcp
#
# linear - Hosted Linear MCP
#   23 tools · 1654ms · HTTP https://mcp.linear.app/mcp
#   ⚠ Requires authentication
#
# chrome-devtools - Chrome DevTools MCP
#   8 tools · stdio npx -y chrome-devtools-mcp@latest
```

#### List Specific Server
```bash
# Xem chi tiết một server
npx mcporter list linear

# Output: TypeScript-style signatures
# linear - Hosted Linear MCP; exposes issue search, create, and workflow tooling.
#   23 tools · 1654ms · HTTP https://mcp.linear.app/mcp
#
#   /**
#    * Create a comment on a specific Linear issue
#    * @param issueId The issue ID
#    * @param body The content of the comment as Markdown
#    * @param parentId? A parent comment ID to reply to
#    */
#   function create_comment(issueId: string, body: string, parentId?: string);
#   // optional (3): notifySubscribers, labelIds, mentionIds
```

#### List Options
```bash
# Hiện tất cả parameters (kể cả optional)
npx mcporter list linear --all-parameters

# Hiện full JSON schema
npx mcporter list linear --schema

# JSON output cho scripting
npx mcporter list --json

# List ad-hoc server
npx mcporter list --http-url https://mcp.linear.app/mcp
npx mcporter list --stdio "bun run ./local-server.ts"
```

### 3.4. Calling MCP Tools

#### Cú pháp 1: Colon-Delimited (CLI-friendly)
```bash
npx mcporter call linear.create_comment issueId:ENG-123 body:'Looks good!'
```

**Đặc điểm:**
- Shell-friendly
- Không cần quotes cho simple values
- Dễ type nhanh
- Support `:` hoặc `=` hoặc `: `

#### Cú pháp 2: Function-Call Style
```bash
npx mcporter call 'linear.create_comment(issueId: "ENG-123", body: "Looks good!")'
```

**Đặc điểm:**
- Giống JavaScript
- Support nested objects/arrays
- Có thể omit labels (rely on schema order)
- Rõ ràng hơn

#### Cú pháp 3: Shorthand
```bash
# Bỏ "call" khi có dot notation
npx mcporter linear.list_issues

# Auto-infer server khi chỉ có 1 tool match
npx mcporter list_issues
```

#### Examples

**Context7 (No auth required):**
```bash
npx mcporter call context7.resolve-library-id libraryName=react
npx mcporter call context7.get-library-docs context7CompatibleLibraryID=/websites/react_dev topic=hooks
```

**Linear (Requires LINEAR_API_KEY):**
```bash
LINEAR_API_KEY=sk_linear_... npx mcporter call linear.search_documentation query="automations"
npx mcporter call linear.create_issue title:"Bug fix" team:ENG priority:High
```

**Chrome DevTools:**
```bash
npx mcporter call chrome-devtools.take_snapshot
npx mcporter call chrome-devtools.execute_javascript code:'document.title'
```

**Ad-hoc URLs:**
```bash
npx mcporter call https://mcp.linear.app/mcp.list_issues assignee=me
npx mcporter call shadcn.io/api/mcp.getComponent component=vortex
```

**Quoted stdio commands:**
```bash
npx mcporter call "npx -y vercel-domains-mcp" domain=example.com
```

#### Helpful Flags

```bash
# Custom config
--config <path>

# Working directory cho stdio
--root <path>

# Log level
--log-level debug

# OAuth timeout
--oauth-timeout 120000

# Tail logs
--tail-log

# Output format
--output json
--output raw
--raw

# Ad-hoc connections
--http-url https://...
--stdio "command ..."
--env KEY=value
--cwd /path
--name server-name
--persist config.json
```

### 3.5. OAuth Authentication

#### Detect OAuth Requirement
```bash
# Khi list hoặc call, MCPorter sẽ báo nếu cần OAuth
npx mcporter list vercel
# Output: ⚠ Requires OAuth authentication
```

#### Authenticate
```bash
# Authenticate với server
npx mcporter auth vercel

# Browser sẽ tự động mở
# Login và authorize
# Token được cache tại ~/.mcporter/vercel/

# Giờ có thể gọi tools
npx mcporter call vercel.search_vercel_documentation topic:routing
```

#### Ad-hoc OAuth
```bash
# OAuth với ad-hoc URL
npx mcporter auth https://mcp.example.com/mcp

# Hoặc với stdio
npx mcporter auth --stdio "npx -y mcp-server" --name my-server
```

#### Logout
```bash
# Xóa cached tokens
mcporter config logout vercel
```

### 3.6. Using in TypeScript Code

#### One-Shot Calls
```typescript
import { callOnce } from "mcporter";

const result = await callOnce({
  server: "firecrawl",
  toolName: "crawl",
  args: { url: "https://anthropic.com" },
});

console.log(result); // Raw MCP envelope
```

**Đặc điểm:**
- Tự động discovery
- Handle OAuth
- Auto-close transports
- Ideal cho manual runs

#### Runtime với Connection Pooling
```typescript
import { createRuntime } from "mcporter";

const runtime = await createRuntime();

// List tools
const tools = await runtime.listTools("context7");

// Call tool
const result = await runtime.callTool("context7", "resolve-library-id", {
  args: { libraryName: "react" },
});

console.log(result);

// Cleanup
await runtime.close();
```

**Đặc điểm:**
- Connection pooling
- Repeated calls efficient
- Advanced options (timeouts, streaming)
- Manual lifecycle management

#### Server Proxy (Recommended)
```typescript
import { createRuntime, createServerProxy } from "mcporter";

const runtime = await createRuntime();
const chrome = createServerProxy(runtime, "chrome-devtools");
const linear = createServerProxy(runtime, "linear");

// camelCase methods
const snapshot = await chrome.takeSnapshot();
console.log(snapshot.text());

// With options
const docs = await linear.searchDocumentation({
  query: "automations",
  page: 0,
});
console.log(docs.json());

await runtime.close();
```

**Ergonomic features:**
- camelCase → kebab-case auto-mapping
- Positional args → required fields
- JSON-schema defaults applied
- CallResult helpers

#### CallResult Helpers
```typescript
const result = await linear.searchDocumentation({ query: "api" });

// Different output formats
result.text()      // Plain text extraction
result.markdown()  // Markdown formatting
result.json()      // Parse as JSON
result.content()   // Original content array
result.raw         // Full MCP envelope

// Check result
if (result.isError) {
  console.error(result.raw.error);
}
```

#### Complex Automation Example
```typescript
import { createRuntime, createServerProxy } from "mcporter";

async function automateIssueTracking() {
  const runtime = await createRuntime();
  const linear = createServerProxy(runtime, "linear");
  const chrome = createServerProxy(runtime, "chrome-devtools");

  try {
    // Take screenshot
    const snapshot = await chrome.takeSnapshot();

    // Search for related docs
    const docs = await linear.searchDocumentation({
      query: "bug reporting"
    });

    // Create issue with context
    const issue = await linear.createIssue({
      title: "UI Bug Found",
      description: `
        Screenshot attached.

        Related docs:
        ${docs.markdown()}
      `,
      team: "ENG",
      priority: "High"
    });

    console.log(`Created issue: ${issue.json().id}`);

  } finally {
    await runtime.close();
  }
}

automateIssueTracking();
```

### 3.7. Generate CLI from MCP Server

#### Basic Generation
```bash
# Từ HTTP URL
npx mcporter generate-cli --command https://mcp.context7.com/mcp

# Output:
#   context7.ts        (TypeScript template)
#   context7.js        (Bundled CLI)
```

#### From Stdio Command
```bash
npx mcporter generate-cli --command "npx -y chrome-devtools-mcp@latest"

# Shorthand (omit --command)
npx mcporter generate-cli "npx -y chrome-devtools-mcp@latest"
```

#### From Configured Server
```bash
# Server đã có trong config
npx mcporter generate-cli linear --bundle dist/linear.js
```

#### Generation Options
```bash
# Custom name
npx mcporter generate-cli https://... --name my-tool

# Custom description
npx mcporter generate-cli https://... --description "My custom tool"

# Output path
npx mcporter generate-cli https://... --output bin/tool.ts

# Bundle
npx mcporter generate-cli https://... --bundle dist/tool.js

# Choose bundler
npx mcporter generate-cli https://... --bundle dist/tool.js --bundler rolldown
npx mcporter generate-cli https://... --bundle dist/tool.js --bundler bun

# Choose runtime
npx mcporter generate-cli https://... --runtime node
npx mcporter generate-cli https://... --runtime bun

# Compile to binary (requires Bun)
npx mcporter generate-cli https://... --compile --runtime bun
```

#### Regeneration
```bash
# Inspect generated CLI
npx mcporter inspect-cli dist/context7.js

# Regenerate with latest mcporter
npx mcporter generate-cli --from dist/context7.js

# Dry run
npx mcporter generate-cli --from dist/context7.js --dry-run
```

#### Using Generated CLI
```bash
# List tools
./context7

# Call tool
./context7 resolve-library-id --libraryName react

# Help
./context7 --help
./context7 resolve-library-id --help
```

### 3.8. Generate TypeScript Types

#### Types-Only Mode
```bash
npx mcporter emit-ts linear --out types/linear-tools.d.ts
```

**Output: `types/linear-tools.d.ts`**
```typescript
export interface LinearTools {
  createComment(issueId: string, body: string, parentId?: string): Promise<any>;
  listIssues(assignee?: string, limit?: number): Promise<any>;
  searchDocumentation(query: string, page?: number): Promise<any>;
  // ... more tools
}
```

#### Client Mode
```bash
npx mcporter emit-ts linear --mode client --out clients/linear.ts
```

**Output: `clients/linear.ts` + `clients/linear.d.ts`**
```typescript
import { createRuntime, createServerProxy } from "mcporter";

export async function createLinearClient() {
  const runtime = await createRuntime();
  return createServerProxy(runtime, "linear");
}

export type LinearClient = {
  createComment(issueId: string, body: string, parentId?: string): Promise<CallResult>;
  // ...
};
```

**Usage:**
```typescript
import { createLinearClient } from "./clients/linear";

const linear = await createLinearClient();
const result = await linear.createComment("ENG-123", "Fixed!");
console.log(result.text());
```

#### Options
```bash
# Include all optional parameters
npx mcporter emit-ts linear --include-optional

# JSON output for scripting
npx mcporter emit-ts linear --out types/linear.d.ts --json

# From URL
npx mcporter emit-ts https://mcp.linear.app/mcp --out types/linear.d.ts

# From ad-hoc
npx mcporter emit-ts --stdio "bun run server.ts" --out types/server.d.ts
```

### 3.9. Daemon Mode

#### Why Use Daemon?

**Benefits:**
- Keep servers warm (no cold starts)
- Maintain stateful connections (Chrome tabs, mobile devices)
- Share connections across multiple CLI calls
- Better performance

**Servers that benefit:**
- `chrome-devtools` - Keep Chrome connection alive
- `mobile-mcp` - Maintain device sessions
- Database MCPs - Connection pooling
- Any server with slow startup

#### Daemon Commands

```bash
# Start daemon
mcporter daemon start

# Start with logging
mcporter daemon start --log
mcporter daemon start --log-file /tmp/daemon.log

# Log specific servers
mcporter daemon start --log-servers chrome-devtools,linear

# Check status
mcporter daemon status

# Output:
# Daemon: running (PID 12345)
# Connected servers:
#   - chrome-devtools (keep-alive)
#   - linear (keep-alive)

# Restart
mcporter daemon restart

# Stop
mcporter daemon stop
```

#### Configure Keep-Alive

**In config file:**
```jsonc
{
  "mcpServers": {
    "my-server": {
      "command": "...",
      "lifecycle": "keep-alive",  // or "ephemeral"
      "logging": {
        "daemon": {
          "enabled": true
        }
      }
    }
  }
}
```

**Via environment:**
```bash
# Enable keep-alive
export MCPORTER_KEEPALIVE=my-server

# Disable keep-alive
export MCPORTER_DISABLE_KEEPALIVE=chrome-devtools
```

#### Auto Keep-Alive

Một số servers tự động dùng keep-alive:
- `chrome-devtools`
- `mobile-mcp`

Servers khác mặc định là ephemeral (per-call).

### 3.10. Advanced Features

#### Ad-Hoc Connections

**HTTP endpoints:**
```bash
# List without config
npx mcporter list --http-url https://mcp.linear.app/mcp --name linear

# Call without config
npx mcporter call --http-url https://mcp.linear.app/mcp.list_issues assignee=me

# Persist to config
npx mcporter call --http-url https://... --persist config/mcporter.local.json
```

**Stdio commands:**
```bash
# Run local server
npx mcporter call --stdio "bun run ./server.ts" --name local

# With environment
npx mcporter call --stdio "node server.js" --env TOKEN=xyz --env DEBUG=true

# With working directory
npx mcporter call --stdio "python server.py" --cwd /path/to/project

# Persist
npx mcporter call --stdio "..." --name my-server --persist config.json
```

#### Auto-Correction

MCPorter tự động sửa typos:

```bash
# Typo: "listIsssues" → auto-corrects to "list_issues"
npx mcporter call linear.listIsssues

# Output: ℹ Auto-corrected to list_issues
```

**Heuristic:**
- Levenshtein distance < 3
- Similar tool name found
- Shows "Did you mean...?" for ambiguous cases

#### Output Formats

```bash
# Auto-detect (default)
npx mcporter call linear.list_issues

# JSON
npx mcporter call linear.list_issues --output json

# Raw (no formatting)
npx mcporter call linear.list_issues --raw

# Markdown
npx mcporter call linear.search_documentation --output markdown
```

#### Timeouts

```bash
# Environment variables
export MCPORTER_LIST_TIMEOUT=30000     # 30s
export MCPORTER_CALL_TIMEOUT=60000     # 60s
export MCPORTER_OAUTH_TIMEOUT_MS=120000 # 2min

# Command line
npx mcporter call linear.list_issues --oauth-timeout 120000
```

#### Logging

```bash
# Log levels
export MCPORTER_LOG_LEVEL=debug  # debug|info|warn|error

# Or via flag
npx mcporter call linear.list_issues --log-level debug

# Tail logs from tool response
npx mcporter call chrome-devtools.take_snapshot --tail-log
```

---

## 4. Các Use Cases Thực Tế

### 4.1. Testing MCP Tools

```bash
# Quick test một tool
npx mcporter call context7.resolve-library-id libraryName=react

# Test với different parameters
npx mcporter call linear.list_issues assignee=me
npx mcporter call linear.list_issues team=ENG
npx mcporter call linear.list_issues --all-parameters
```

### 4.2. CI/CD Integration

```bash
#!/bin/bash
# deploy-check.sh

# Check deployment status
STATUS=$(npx mcporter call vercel.get_deployment_status \
  deploymentId=$DEPLOYMENT_ID \
  --output json | jq -r '.status')

if [ "$STATUS" = "ready" ]; then
  echo "Deployment successful"
  exit 0
else
  echo "Deployment failed"
  exit 1
fi
```

### 4.3. Documentation Generation

```bash
# Fetch docs for multiple libraries
for lib in react vue angular; do
  npx mcporter call context7.get-library-docs \
    context7CompatibleLibraryID=/websites/${lib}_dev \
    topic=getting-started \
    > docs/${lib}-quickstart.md
done
```

### 4.4. Issue Automation

```typescript
import { createRuntime, createServerProxy } from "mcporter";

async function autoTriageIssues() {
  const runtime = await createRuntime();
  const linear = createServerProxy(runtime, "linear");

  // Get unassigned issues
  const issues = await linear.listIssues({ assignee: null });
  const issueList = issues.json();

  for (const issue of issueList) {
    // Auto-assign based on labels
    if (issue.labels.includes("frontend")) {
      await linear.updateIssue({
        issueId: issue.id,
        assignee: "frontend-team"
      });
    }
  }

  await runtime.close();
}
```

### 4.5. Cross-Tool Automation

```typescript
import { createRuntime, createServerProxy } from "mcporter";

async function syncDocsToIssues() {
  const runtime = await createRuntime();
  const context7 = createServerProxy(runtime, "context7");
  const linear = createServerProxy(runtime, "linear");

  // Fetch latest React docs
  const docs = await context7.getLibraryDocs({
    context7CompatibleLibraryID: "/websites/react_dev",
    topic: "hooks"
  });

  // Create issue with docs
  await linear.createIssue({
    title: "Update hooks documentation",
    description: docs.markdown(),
    team: "DOCS",
    labels: ["documentation", "react"]
  });

  await runtime.close();
}
```

### 4.6. Chrome Automation

```typescript
import { createRuntime, createServerProxy } from "mcporter";

async function auditWebsite(url: string) {
  const runtime = await createRuntime();
  const chrome = createServerProxy(runtime, "chrome-devtools");

  // Navigate
  await chrome.navigate({ url });

  // Take snapshot
  const snapshot = await chrome.takeSnapshot();

  // Execute custom checks
  const title = await chrome.executeJavascript({
    code: "document.title"
  });

  // Analyze results
  console.log("Title:", title.text());
  console.log("Snapshot:", snapshot.content());

  await runtime.close();
}

auditWebsite("https://example.com");
```

### 4.7. Create Custom Workflows

```typescript
import { createRuntime, createServerProxy } from "mcporter";

async function onboardingWorkflow(newDevEmail: string) {
  const runtime = await createRuntime();
  const linear = createServerProxy(runtime, "linear");

  // Create onboarding tasks
  const tasks = [
    "Setup development environment",
    "Read team documentation",
    "Complete first PR",
    "Pair programming session"
  ];

  for (const task of tasks) {
    await linear.createIssue({
      title: task,
      assignee: newDevEmail,
      team: "ENG",
      labels: ["onboarding"],
      priority: "Medium"
    });
  }

  console.log(`Created ${tasks.length} onboarding tasks for ${newDevEmail}`);

  await runtime.close();
}
```

---

## 5. Troubleshooting

### 5.1. Common Issues

#### Authentication Errors
```bash
# Error: OAuth required
# Solution: Authenticate first
npx mcporter auth vercel

# Error: Invalid API key
# Solution: Check environment variables
echo $LINEAR_API_KEY
export LINEAR_API_KEY="sk_linear_..."
```

#### Server Not Found
```bash
# Error: Server "linearr" not found
# Solution: Use exact name or let auto-correct fix it
npx mcporter list linear  # correct name

# Check available servers
npx mcporter list
```

#### Timeout Issues
```bash
# Error: Timeout after 30000ms
# Solution: Increase timeout
export MCPORTER_CALL_TIMEOUT=60000
npx mcporter call slow-server.tool
```

#### Daemon Issues
```bash
# Daemon not starting
mcporter daemon stop
mcporter daemon start --log

# Check logs
cat ~/.mcporter/daemon.log

# Restart with specific server logging
mcporter daemon restart --log-servers chrome-devtools
```

### 5.2. Debugging

```bash
# Enable debug logging
export MCPORTER_LOG_LEVEL=debug
npx mcporter call linear.list_issues

# Check config
mcporter config list
mcporter config doctor

# Inspect generated CLI
mcporter inspect-cli dist/tool.js

# Test ad-hoc connection
npx mcporter list --http-url https://mcp.example.com/mcp
```

### 5.3. Debug Hanging Servers

```bash
# Use tmux to keep session visible
tmux new-session -- pnpm mcporter:list

# In another terminal, inspect
tmux capture-pane -pt <session>

# Enable hang debugging
export MCPORTER_DEBUG_HANG=1
npx mcporter call chrome-devtools.take_snapshot
```

---

## 6. Best Practices

### 6.1. Configuration Management

**Project vs System Config:**
- Use `config/mcporter.json` cho project-specific servers
- Use `~/.mcporter/mcporter.json` cho global/personal servers
- Use `--scope home|project` để chọn target khi add servers

**Environment Variables:**
- Never commit API keys to git
- Use `.env` files (add to `.gitignore`)
- Use `${VAR:-fallback}` cho optional variables

**Config Organization:**
```jsonc
{
  "mcpServers": {
    // Development tools
    "chrome-devtools": { ... },

    // External services
    "linear": { ... },
    "vercel": { ... },

    // Documentation
    "context7": { ... }
  }
}
```

### 6.2. TypeScript Best Practices

**Use Server Proxy:**
```typescript
// Good: Type-safe, ergonomic
const linear = createServerProxy(runtime, "linear");
await linear.createComment({ issueId: "...", body: "..." });

// Avoid: Stringly-typed
await runtime.callTool("linear", "create_comment", {
  args: { issueId: "...", body: "..." }
});
```

**Handle Errors:**
```typescript
try {
  const result = await linear.listIssues({ assignee: "me" });

  if (result.isError) {
    console.error("Tool error:", result.raw.error);
    return;
  }

  console.log(result.json());
} catch (error) {
  console.error("Runtime error:", error);
}
```

**Clean Up Resources:**
```typescript
const runtime = await createRuntime();
try {
  // ... do work
} finally {
  await runtime.close();  // Always close
}
```

### 6.3. Performance Optimization

**Use Daemon for Stateful Servers:**
```bash
# Start daemon once
mcporter daemon start

# Subsequent calls are fast
mcporter chrome-devtools.take_snapshot
```

**Connection Pooling:**
```typescript
// Good: Reuse runtime
const runtime = await createRuntime();
for (const issue of issues) {
  await linear.updateIssue(issue);
}
await runtime.close();

// Bad: Create runtime per call
for (const issue of issues) {
  const runtime = await createRuntime();
  await linear.updateIssue(issue);
  await runtime.close();
}
```

**Parallel Calls:**
```typescript
// Good: Parallel when possible
const [docs, issues] = await Promise.all([
  context7.getLibraryDocs({ ... }),
  linear.listIssues({ ... })
]);

// Bad: Sequential when not needed
const docs = await context7.getLibraryDocs({ ... });
const issues = await linear.listIssues({ ... });
```

### 6.4. Security

**API Keys:**
- Store in environment variables
- Never hardcode in source
- Rotate regularly
- Use least privilege scope

**OAuth Tokens:**
- Cached at `~/.mcporter/<server>/`
- Automatically refreshed
- Logout when done: `mcporter config logout <server>`

**Stdio Commands:**
- Validate command sources
- Be careful with `--env` injection
- Use `--cwd` to restrict file access

---

## 7. Architecture Overview

### 7.1. Core Components

**Runtime (`src/runtime.ts`):**
- Manages MCP server connections
- Handles connection pooling
- OAuth token management
- Tool invocation

**Config (`src/config.ts`):**
- Config file resolution
- Environment variable interpolation
- Import merging
- Schema validation

**CLI (`src/cli.ts`):**
- Command parsing
- Output formatting
- Error handling
- Interactive features

**Server Proxy (`src/server-proxy.ts`):**
- Ergonomic tool wrapper
- camelCase → kebab-case mapping
- Result helpers
- Type inference

### 7.2. Tool Calling Flow

```
User Input
  ↓
CLI Parser (parse server.tool + args)
  ↓
Server Lookup (find server in config/imports)
  ↓
Runtime (get or create connection)
  ↓
Transport (HTTP/SSE/stdio)
  ↓
MCP Server (execute tool)
  ↓
Result (CallResult wrapper)
  ↓
Output Formatter (text/json/markdown)
  ↓
Display to User
```

### 7.3. Config Resolution

```
--config flag or MCPORTER_CONFIG
  ↓ (if not set)
~/.mcporter/mcporter.json (system config)
  ↓ (merged with)
<root>/config/mcporter.json (project config)
  ↓ (merged with)
Editor imports (Cursor, Claude, VS Code, etc.)
  ↓
Final resolved config
```

### 7.4. Transport Types

**HTTP/HTTPS:**
- RESTful MCP endpoints
- OAuth support
- Header interpolation

**SSE (Server-Sent Events):**
- Streaming responses
- Long-lived connections

**Stdio:**
- Local command execution
- Process spawning
- Environment inheritance

---

## 8. Contributing

### 8.1. Development Setup

```bash
# Clone repository
git clone https://github.com/steipete/mcporter.git
cd mcporter

# Install dependencies
pnpm install

# Run in development
pnpm mcporter list

# Build
pnpm build

# Run tests
pnpm test

# Linting
pnpm check
```

### 8.2. Testing

```bash
# Unit tests
pnpm test

# Live tests (requires actual MCP servers)
MCP_LIVE_TESTS=1 pnpm test:live

# Specific test file
pnpm test tests/runtime.test.ts

# Watch mode
pnpm test --watch
```

### 8.3. Code Quality

```bash
# Biome formatting
pnpm lint:biome

# Oxlint type-aware linting
pnpm lint:oxlint

# Type checking
pnpm typecheck

# All checks
pnpm check
```

---

## 9. Resources

### 9.1. Documentation

- **README**: [README.md](../README.md)
- **CLI Reference**: [docs/cli-reference.md](../docs/cli-reference.md)
- **Call Syntax**: [docs/call-syntax.md](../docs/call-syntax.md)
- **Ad-hoc Connections**: [docs/adhoc.md](../docs/adhoc.md)
- **Config Management**: [docs/config.md](../docs/config.md)
- **TypeScript Generation**: [docs/emit-ts.md](../docs/emit-ts.md)
- **Daemon Mode**: [docs/daemon.md](../docs/daemon.md)
- **Tool Calling**: [docs/tool-calling.md](../docs/tool-calling.md)

### 9.2. Examples

**Config Examples:**
- [config/mcporter.json](../config/mcporter.json) - Example config

**Test Examples:**
- [tests/](../tests/) - Test suite với nhiều examples

**Scripts:**
- [scripts/docs-list.ts](../scripts/docs-list.ts) - Documentation automation

### 9.3. External Links

- **GitHub**: https://github.com/steipete/mcporter
- **NPM**: https://www.npmjs.com/package/mcporter
- **MCP Specification**: https://modelcontextprotocol.io
- **Anthropic MCP Guide**: https://docs.anthropic.com/claude/docs/model-context-protocol

---

## 10. Roadmap và Future Features

### Current Focus (v0.6.x)
- ✅ Layered config resolution (system + project)
- ✅ Improved quick start examples in generated CLIs
- ✅ Better STDIO environment variable handling
- ✅ Enhanced daemon mode

### Potential Future Enhancements
- [ ] MCP server templates/scaffolding
- [ ] Built-in MCP server registry
- [ ] Interactive config wizard
- [ ] Web UI for server management
- [ ] Plugin system for custom transports
- [ ] Enhanced streaming support
- [ ] Metrics and monitoring
- [ ] Multi-runtime support (Deno, etc.)

---

## 11. FAQ

### Q: MCPorter vs Direct MCP SDK?
**A:** MCPorter provides:
- Zero-config discovery from existing editors
- CLI for quick testing
- Code generation (CLIs + types)
- Connection pooling
- OAuth management
- Ergonomic API

Direct SDK requires manual setup for all of these.

### Q: Can I use MCPorter without config files?
**A:** Yes! Use ad-hoc flags:
```bash
npx mcporter call --http-url https://... tool_name arg=value
```

### Q: Does MCPorter work with all MCP servers?
**A:** Yes, it supports:
- HTTP/HTTPS endpoints
- SSE (Server-Sent Events)
- Stdio processes
- OAuth-protected servers

### Q: How do I share a tool with my team?
**A:** Generate a standalone CLI:
```bash
mcporter generate-cli my-server --compile
# Share the binary
```

### Q: Can I use MCPorter in production?
**A:** Yes! It's MIT licensed and production-ready. Consider:
- Using daemon mode for performance
- Setting appropriate timeouts
- Handling errors properly
- Securing API keys

### Q: What's the difference between `callOnce` and `createRuntime`?
**A:**
- `callOnce`: One-shot calls, auto-cleanup, simpler
- `createRuntime`: Connection pooling, multiple calls, manual cleanup, more control

### Q: How do I update MCPorter?
**A:**
```bash
# With npx (always latest)
npx mcporter@latest list

# Update package
pnpm update mcporter

# Homebrew
brew upgrade mcporter
```

---

## 12. Kết Luận

**MCPorter** là một công cụ mạnh mẽ và linh hoạt cho việc làm việc với Model Context Protocol. Nó giúp:

✅ **Đơn giản hóa** việc khám phá và sử dụng MCP servers
✅ **Tăng tốc** development với typed clients và CLIs
✅ **Tự động hóa** workflows phức tạp
✅ **Chia sẻ** tools dễ dàng với team

Với thiết kế zero-config và API thân thiện, MCPorter là lựa chọn tốt cho cả:
- **Developers** cần test/debug MCP tools
- **AI Agents** cần typed interface
- **Teams** muốn chia sẻ automation tools

**Bắt đầu ngay:**
```bash
npx mcporter list
```

---

*Document này được tạo bởi: Claude Code*
*Ngày: 2025-11-17*
*MCPorter Version: 0.6.0*
