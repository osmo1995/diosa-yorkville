# Specialized MCP Subagent Profiles

> **Created:** January 13, 2026  
> **Total Subagents:** 10  
> **Total Tools Covered:** 340+

---

## Overview

This directory contains specialized subagent profiles for each MCP server configured in your Rovo Dev setup. Each subagent is an expert in their specific domain with restricted tool access.

---

## Available Subagents

### 1. AIO Sandbox Specialist
**File:** `AIOSandboxSpecialist.md`  
**MCP Server:** aio-sandbox (HTTP)  
**Tools:** 33  
**Specialization:** Remote browser automation, code execution, vision-based interaction

**Key Capabilities:**
- ✅ Browser automation (33 tools)
- ✅ Vision-based clicking
- ✅ Code execution (Python + JavaScript)
- ✅ Sandbox file operations
- ✅ Screenshot capture
- ✅ Tab management
- ✅ Form automation

**Use Cases:**
- Web scraping
- Browser testing
- Form automation
- Visual testing
- Code execution in isolation
- File processing
- Download automation

---

### 2. MCP Docker Gateway Specialist
**File:** `MCPDockerSpecialist.md`  
**MCP Server:** MCP_DOCKER (stdio)  
**Tools:** 234  
**Specialization:** GitHub, security, web research, code analysis, databases

**Key Capabilities:**
- ✅ GitHub integration (40+ tools)
- ✅ Security scanning (10+ tools)
- ✅ Web research & scraping (10+ tools)
- ✅ Browser automation (35+ tools)
- ✅ Code analysis (15+ tools)
- ✅ Database operations (10+ tools)
- ✅ File operations (10+ tools)
- ✅ Documentation search (10+ tools)
- ✅ Knowledge graph (10+ tools)
- ✅ Payment integration (20+ tools)

**Use Cases:**
- GitHub PR reviews
- Security audits
- Web research
- Code refactoring
- Database management
- Documentation search
- Payment processing

---

### 3. Chrome DevTools Specialist
**File:** `ChromeDevToolsSpecialist.md`  
**MCP Server:** chrome-devtools (stdio)  
**Tools:** 23  
**Specialization:** Performance analysis, network debugging, DevTools Protocol

**Key Capabilities:**
- ✅ Performance tracing
- ✅ Network request inspection
- ✅ Console log monitoring
- ✅ Device emulation
- ✅ Screenshot automation
- ✅ CDP access

**Use Cases:**
- Performance audits
- Network debugging
- Console monitoring
- Responsive testing
- DevTools automation

---

### 4. Shell Command Specialist
**File:** `ShellCommandSpecialist.md`  
**MCP Server:** shell (stdio)  
**Tools:** 1 (unlimited commands)  
**Specialization:** System command execution, CLI automation

**Key Capabilities:**
- ✅ Execute any shell command
- ✅ Git operations
- ✅ Package management
- ✅ Process management
- ✅ File operations via CLI
- ✅ System monitoring

**Use Cases:**
- Build automation
- Deployment tasks
- Git workflows
- System monitoring
- File processing
- CLI tool integration

---

### 5. Browser MCP Specialist
**File:** `BrowserMCPSpecialist.md`  
**MCP Server:** browsermcp (stdio)  
**Tools:** 15  
**Specialization:** Accessibility-first browser automation

**Key Capabilities:**
- ✅ Accessibility tree snapshots
- ✅ Semantic element selection
- ✅ ARIA-aware interactions
- ✅ Screen reader testing
- ✅ Role-based automation

**Use Cases:**
- Accessibility testing
- WCAG compliance
- Semantic automation
- Screen reader validation
- Accessible form testing

---

### 6. Penpot Design Specialist
**File:** `PenpotDesignSpecialist.md`  
**MCP Server:** penpot (SSE)  
**Tools:** 5  
**Specialization:** Design tool automation, asset generation

**Key Capabilities:**
- ✅ Execute code in Penpot
- ✅ Shape manipulation
- ✅ Asset export (PNG/SVG)
- ✅ Image import
- ✅ Batch operations

**Use Cases:**
- Design automation
- Asset generation
- Icon export
- Template creation
- Design validation

---

### 7. Forge Knowledge Specialist
**File:** `ForgeKnowledgeSpecialist.md`  
**MCP Server:** forge-knowledge (HTTP)  
**Tools:** 7  
**Specialization:** Atlassian Forge documentation and development guidance

**Key Capabilities:**
- ✅ Forge development guides
- ✅ UI Kit documentation
- ✅ Backend API reference
- ✅ Manifest configuration
- ✅ Module listing
- ✅ Design tokens

**Use Cases:**
- Forge app development
- API reference
- Component documentation
- Architecture guidance
- Troubleshooting

---

### 8. Iconify Search Specialist
**File:** `IconifySearchSpecialist.md`  
**MCP Server:** iconify (stdio)  
**Tools:** 5  
**Specialization:** Icon discovery from 200k+ icons

**Key Capabilities:**
- ✅ Search 200k+ icons
- ✅ Browse 100+ icon sets
- ✅ Get SVG code
- ✅ Component integration
- ✅ Find similar icons

**Use Cases:**
- Icon selection
- Design systems
- UI development
- Brand identity
- Component development

---

### 9. 21st Magic UI Specialist
**File:** `MagicUISpecialist.md`  
**MCP Server:** @21st-dev/magic (stdio)  
**Tools:** 5-10  
**Specialization:** AI-powered React component generation

**Key Capabilities:**
- ✅ Generate components from natural language
- ✅ Design to code conversion
- ✅ Tailwind CSS styling
- ✅ Component variants
- ✅ Production-ready code

**Use Cases:**
- Rapid prototyping
- Component generation
- Design-to-code
- UI iteration
- Template creation

---

### 10. Figma Design Specialist
**File:** `FigmaDesignSpecialist.md`  
**MCP Server:** figma (HTTP - public or local)  
**Tools:** 10-15  
**Specialization:** Figma design file inspection and asset export

**Key Capabilities:**
- ✅ Access Figma files
- ✅ Extract design tokens
- ✅ Export assets (PNG/SVG)
- ✅ Component inspection
- ✅ Code snippet generation
- ✅ Dev Mode integration

**Use Cases:**
- Design inspection
- Token extraction
- Asset export
- Component documentation
- Design handoff
- Style guide generation

---

## Usage Guide

### Invoking Subagents

**In Rovo Dev CLI:**
```bash
# Interactive mode
/subagents

# Programmatic (if enabled)
invoke_subagent profile="AIOSandboxSpecialist" task="..."
```

**In your code/prompts:**
```
Please use the AIO Sandbox Specialist to scrape https://example.com
```

---

## Subagent Decision Tree

### When to use AIO Sandbox Specialist:
- ✅ Need to interact with websites visually
- ✅ Need to execute Python/JavaScript code in isolation
- ✅ Need vision-based clicking (dynamic UIs)
- ✅ Need to test web applications
- ✅ Need to manage browser tabs/downloads
- ✅ Need remote sandbox environment

### When to use MCP Docker Specialist:
- ✅ Need to work with GitHub (issues, PRs, code)
- ✅ Need security scanning (Semgrep)
- ✅ Need web research (Tavily AI)
- ✅ Need code analysis (refactoring, metrics)
- ✅ Need database operations
- ✅ Need documentation search
- ✅ Need payment integration (Stripe)
- ✅ Need knowledge graph operations

---

## Tool Coverage Summary

| Category | AIO | Docker | Chrome | Shell | Browser | Penpot | Forge | Iconify | Total |
|----------|-----|--------|--------|-------|---------|--------|-------|---------|-------|
| Browser Automation | 23 | 35 | 15 | - | 15 | - | - | - | 88 |
| Code Execution | 10 | 15 | - | 1 | - | 1 | - | - | 27 |
| GitHub Integration | - | 40 | - | - | - | - | - | - | 40 |
| Security Scanning | - | 10 | - | - | - | - | - | - | 10 |
| Web Research | - | 10 | - | - | - | - | - | - | 10 |
| Performance Analysis | - | - | 3 | - | - | - | - | - | 3 |
| Network Analysis | - | - | 2 | - | - | - | - | - | 2 |
| Database Operations | - | 10 | - | - | - | - | - | - | 10 |
| File Operations | 10 | 10 | - | ∞ | - | - | - | - | 20+ |
| Documentation | - | 10 | - | - | - | - | 7 | - | 17 |
| Design Tools | - | - | - | - | - | 5 | - | - | 5 |
| Icon Discovery | - | - | - | - | - | - | - | 5 | 5 |
| Accessibility | - | - | 1 | - | 15 | - | - | - | 16 |
| Payment Integration | - | 20 | - | - | - | - | - | - | 20 |
| Knowledge Graph | - | 10 | - | - | - | - | - | - | 10 |
| Other | - | 64 | 2 | - | - | - | - | - | 66 |
| **TOTAL** | **33** | **234** | **23** | **1+** | **15** | **5** | **7** | **5** | **8** | **12** | **343+** |

---

## Comparison Matrix

| Feature | AIO | Docker | Chrome | Shell | Browser | Penpot | Forge | Iconify |
|---------|-----|--------|--------|-------|---------|--------|-------|---------|
| **Transport** | HTTP | stdio | stdio | stdio | stdio | SSE | HTTP | stdio |
| **Latency** | 200-500ms | 50-200ms | 100-300ms | 50-100ms | 100-200ms | 50-150ms | 100-300ms | 100-200ms |
| **Specialization** | Remote browser | Multi-domain | Performance | System CLI | Accessibility | Design | Forge docs | Icons |
| **Unique Features** | Vision clicking | GitHub, security | DevTools | Any command | ARIA testing | Penpot API | Forge API | 200k icons |
| **Concurrency** | Single | Parallel | Single | N/A | Single | Single | N/A | N/A |
| **Persistence** | Session | Stateless | Stateless | Local | Stateless | File-based | N/A | N/A |
| **Best For** | Web scraping | Code review | Performance audit | Build scripts | A11y testing | Design automation | Forge dev | Icon discovery |

---

## Integration Patterns

### Pattern 1: Web Research → Analysis
```
1. MCP Docker: tavily-search (research topic)
2. MCP Docker: fetch (extract content)
3. MCP Docker: analyze_python_file (if code found)
4. AIO Sandbox: browser_vision_screen_capture (visual verification)
```

### Pattern 2: GitHub PR → Testing
```
1. MCP Docker: pull_request_read (get PR details)
2. MCP Docker: semgrep_scan (security check)
3. AIO Sandbox: browser_navigate (test changes)
4. AIO Sandbox: browser_screenshot (capture results)
5. MCP Docker: add_comment_to_pending_review (add feedback)
```

### Pattern 3: Code Execution → Database
```
1. AIO Sandbox: sandbox_execute_code (run analysis script)
2. AIO Sandbox: sandbox_file_operations (save results)
3. MCP Docker: insert_data (store in database)
```

---

## Configuration

### Enable Subagent Delegation

In `~/.rovodev/config.yml`:
```yaml
experimental:
  enableDelegationTool: true
```

### MCP Server Configuration

In `~/.rovodev/mcp.json`:
```json
{
  "mcpServers": {
    "aio-sandbox": {
      "url": "https://nonvenally-geopolitic-keira.ngrok-free.dev/mcp",
      "transport": "http"
    },
    "MCP_DOCKER": {
      "command": "docker",
      "args": ["mcp", "gateway", "run"],
      "transport": "stdio"
    }
  }
}
```

---

## Best Practices

### 1. Choose the Right Specialist
- Match task to subagent expertise
- Consider tool availability
- Think about latency requirements

### 2. Provide Clear Instructions
```
Good: "Use AIO Sandbox to test login at https://app.example.com with user@test.com"
Bad: "Test the app"
```

### 3. Chain Subagents
- Use multiple specialists in sequence
- Each specialist handles their domain
- Main agent orchestrates workflow

### 4. Error Handling
- Subagents have built-in error handling
- Review outputs for issues/recommendations
- Retry with adjusted parameters if needed

### 5. Tool Limitations
- Respect tool restrictions
- Don't ask subagents to use prohibited tools
- Verify capabilities before tasking

---

## Maintenance

### Adding New Subagents
1. Create new profile in `.rovodev/subagents/`
2. Follow template structure
3. Update this README
4. Test with `/subagents` command

### Updating Existing Profiles
1. Inspect MCP server for new tools
2. Update tool lists in profile
3. Add new workflow patterns
4. Update version number

---

## Troubleshooting

### Subagent Not Found
- Check profile file exists in `.rovodev/subagents/`
- Verify file name matches invocation
- Check config.yml has enableDelegationTool: true

### Tool Not Available
- Verify MCP server is running
- Check mcp.json configuration
- Inspect server with MCP Inspector

### Poor Performance
- Check MCP server latency
- Consider caching results
- Use batch operations
- Choose lower-latency specialist

---

## Resources

### Documentation
- **Rovo Dev CLI:** https://docs.atlassian.com/rovodev
- **MCP Protocol:** https://modelcontextprotocol.io
- **Subagent Guide:** ROVODEV-INSTRUCTIONS-SERVERS.txt

### Tools
- **MCP Inspector:** Use to discover server capabilities
- **Docker MCP:** `docker mcp tools ls`
- **Rovo Dev:** `acli rovodev --help`

---

## Version History

**v1.0 - January 13, 2026**
- Created AIO Sandbox Specialist (33 tools)
- Created MCP Docker Specialist (234 tools)
- Total: 267 tools across 2 specialists

---

**Status:** Production Ready  
**Maintenance:** Update quarterly or when MCP servers change  
**Contact:** Reference AGENTS.md for project conventions
