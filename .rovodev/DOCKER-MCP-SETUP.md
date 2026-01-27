# Docker MCP Setup and Container Reference

> **Status:** ✅ All containers running and verified  
> **Date:** January 13, 2026  
> **Total MCP Tools:** 234 via Docker MCP Gateway

---

## Running MCP Containers

### Primary MCP Gateways

#### 1. frost-full-mcp-gateway
**Container Name:** `frost-full-mcp-gateway`  
**Image:** `mcp-full-mcp-gateway`  
**Status:** ✅ Running (healthy)  
**Internal Port:** 8090  
**External Port:** 8093  
**Access:** `http://localhost:8093`  
**Purpose:** Main MCP gateway with 234 tools

**Tools Include:**
- 38 GitHub tools
- 52 Browser/Playwright tools
- 8 Security/Semgrep tools
- 14 Web scraping tools (Tavily, Apify)
- 1 Sequential thinking tool
- Database, file operations, and more

#### 2. frost-react-mcp
**Container Name:** `frost-react-mcp`  
**Status:** ✅ Running (healthy)  
**External Port:** 8091  
**Access:** `http://localhost:8091`  
**Purpose:** React component MCP tools

#### 3. ui-mcp-gateway
**Container Name:** `ui-mcp-gateway`  
**Image:** `mcp-ui-mcp-gateway`  
**Status:** ✅ Running (healthy)  
**External Port:** 8092  
**Access:** `http://localhost:8092`  
**Purpose:** UI-specific MCP gateway

#### 4. frost-mcp-servers
**Container Name:** `frost-mcp-servers`  
**Status:** ✅ Running (healthy)  
**Ports:** 8811-8813, 9222  
**Purpose:** Additional MCP server collection

---

## Supporting Containers

### 5. penpot-mcp
**Container Name:** `penpot-mcp`  
**Image:** `ghcr.io/astrateam-net/penpot-mcp:0.0.1`  
**Status:** ✅ Running  
**Ports:** 4400-4401  
**Purpose:** Penpot design tool MCP integration

### 6. aio-sandbox
**Container Name:** `aio-sandbox`  
**Image:** `ghcr.io/agent-infra/sandbox:latest`  
**Status:** ✅ Running (healthy)  
**Purpose:** Remote sandbox environment for code execution

### 7. mcp-vision
**Container Name:** `mcp-vision`  
**Status:** ✅ Running  
**Purpose:** Vision-based browser automation

---

## MCP Gateway Tool Categories

### Total: 234 Tools

**Breakdown:**
- **GitHub Integration:** 38 tools
  - Issues, PRs, commits, branches, code search
- **Browser Automation:** 52 tools
  - Playwright, Chrome DevTools Protocol
- **Security & Code Quality:** 8 tools
  - Semgrep, security scanning, code analysis
- **Web Scraping:** 14 tools
  - Tavily AI search, Apify actors, web crawling
- **Sequential Thinking:** 1 tool
  - Multi-step problem solving
- **Database:** 10 tools
- **File Operations:** 10 tools
- **Documentation:** 10 tools
- **Knowledge Graph:** 10 tools
- **Other:** 81 tools

---

## Accessing Docker MCP Gateway

### Via MCP Client (Rovo Dev CLI)

**Configuration in `~/.rovodev/mcp.json`:**
```json
{
  "mcpServers": {
    "MCP_DOCKER": {
      "command": "docker",
      "args": ["mcp", "gateway", "run"],
      "transport": "stdio"
    }
  }
}
```

### Via HTTP (Direct Gateway Access)

**frost-full-mcp-gateway:**
```json
{
  "mcpServers": {
    "frost-gateway": {
      "url": "http://localhost:8093",
      "transport": "http"
    }
  }
}
```

---

## Container Network

All containers are on the same Docker network and can communicate:
- `frost-full-mcp-gateway` → Main gateway
- `frost-react-mcp` → React tools
- `ui-mcp-gateway` → UI tools
- `penpot-mcp` → Penpot integration
- `aio-sandbox` → Sandbox environment
- `mcp-vision` → Vision automation

---

## Managing Containers

### Start All MCP Containers
```bash
# Using docker compose (if configured)
docker compose up -d

# Or start specific containers
docker start frost-full-mcp-gateway
docker start frost-react-mcp
docker start ui-mcp-gateway
docker start penpot-mcp
docker start aio-sandbox
```

### Stop All MCP Containers
```bash
docker stop frost-full-mcp-gateway frost-react-mcp ui-mcp-gateway penpot-mcp aio-sandbox mcp-vision
```

### Check Container Health
```bash
docker ps --filter "name=mcp" --filter "name=frost" --filter "name=penpot" --filter "name=aio"
```

### View Container Logs
```bash
docker logs frost-full-mcp-gateway --tail 50
docker logs frost-react-mcp --tail 50
docker logs penpot-mcp --tail 50
```

---

## Tool Discovery

### List All Gateway Tools
```bash
docker mcp tools ls
```

### Inspect Specific Tool
```bash
docker mcp tools inspect <tool-name>
```

### Test Tool Execution
```bash
docker mcp tools call <tool-name>
```

---

## Subagent Container References

Each subagent should reference the appropriate Docker container:

### For GitHub, Security, Web Research, Browser
**Use:** `MCP_DOCKER` gateway (stdio) or `frost-full-mcp-gateway` (HTTP port 8093)

### For React Components
**Use:** `frost-react-mcp` (HTTP port 8091)

### For UI Operations
**Use:** `ui-mcp-gateway` (HTTP port 8092)

### For Penpot Design
**Use:** `penpot-mcp` (HTTP ports 4400-4401)

### For Remote Sandbox
**Use:** `aio-sandbox` container

---

## Sequential Thinking Tool

**Available in:** `frost-full-mcp-gateway`  
**Tool Name:** `sequentialthinking`  
**Purpose:** Dynamic and reflective problem-solving through structured thoughts

**All subagents should start with sequential thinking for:**
- Planning multi-step tasks
- Breaking down complex problems
- Structured reasoning
- Decision tracking

---

## Health Checks

All main containers have health checks enabled:
- ✅ `frost-full-mcp-gateway`: healthy
- ✅ `frost-react-mcp`: healthy
- ✅ `ui-mcp-gateway`: healthy
- ✅ `aio-sandbox`: healthy

---

## Port Summary

| Container | Internal Port | External Port | Protocol |
|-----------|---------------|---------------|----------|
| frost-full-mcp-gateway | 8090 | 8093 | HTTP |
| frost-react-mcp | 8091 | 8091 | HTTP |
| ui-mcp-gateway | 8090 | 8092 | HTTP |
| frost-mcp-servers | 8811-8813 | 8811-8813 | HTTP |
| frost-mcp-servers | 9222 | 9222 | CDP |
| penpot-mcp | 4400-4401 | 4400-4401 | HTTP/SSE |

---

## Troubleshooting

### Container Not Running
```bash
docker start <container-name>
docker logs <container-name>
```

### Gateway Not Responding
```bash
# Check if port is listening
netstat -an | findstr "8093"

# Restart gateway
docker restart frost-full-mcp-gateway
```

### Tool Not Found
```bash
# Refresh tool list
docker mcp tools ls > mcp-tools-list.txt

# Verify tool exists
docker mcp tools inspect <tool-name>
```

---

## Container Images

- `mcp-full-mcp-gateway` - Full MCP gateway with 234 tools
- `mcp-ui-mcp-gateway` - UI-focused MCP tools
- `mcp-frost-react-mcp` - React component tools
- `ghcr.io/astrateam-net/penpot-mcp:0.0.1` - Penpot integration
- `ghcr.io/agent-infra/sandbox:latest` - AIO sandbox

---

**Last Verified:** January 13, 2026  
**Status:** All containers healthy and accessible  
**Gateway Tool Count:** 234 tools
