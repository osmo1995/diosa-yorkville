# Sequential Thinking Mandate for All Subagents

> **Status:** MANDATORY for all subagent invocations  
> **Tool:** `sequentialthinking` from Docker MCP Gateway  
> **Purpose:** Structured problem-solving and planning

---

## 🎯 Core Principle

**Every subagent MUST begin every task with sequential thinking.**

No exceptions. No shortcuts. Think first, act second.

---

## 🧠 Sequential Thinking Tool

**Available In:** Docker MCP Gateway (`frost-full-mcp-gateway`)  
**Tool Name:** `sequentialthinking`  
**Access:** Via `mcp__mcp_docker__invoke_tool`

### Tool Purpose
- Dynamic and reflective problem-solving
- Structured thought process
- Traceable reasoning
- Decision documentation
- Step-by-step planning

---

## 📋 Mandatory Protocol

### For EVERY Task:

1. **Receive Task**
   - Understand requirements
   - Identify constraints
   - Note success criteria

2. **Invoke Sequential Thinking**
   ```
   Tool: sequentialthinking
   Input: Task description, context, goals
   Output: Structured thought process with steps
   ```

3. **Review Thought Process**
   - Validate reasoning
   - Check for missed steps
   - Identify potential issues

4. **Execute Planned Steps**
   - Follow the sequential plan
   - Verify each step
   - Adjust if needed

5. **Complete & Report**
   - Summarize execution
   - Note deviations from plan
   - Document outcomes

---

## 🔄 Sequential Thinking Pattern

### Basic Pattern
```
INPUT:
Task: [What needs to be done]
Context: [Relevant information]
Constraints: [Limitations, requirements]

SEQUENTIAL THINKING:
Thought 1: [Analyze the problem]
Thought 2: [Identify approach]
Thought 3: [Break down into steps]
Thought 4: [Plan execution order]
Thought 5: [Define success criteria]

EXECUTION:
Step 1: [First action based on plan]
Step 2: [Next action]
...

VERIFICATION:
Check: [Validate outcomes against criteria]
```

### Complex Pattern (Multi-Step Tasks)
```
SEQUENTIAL THINKING (Initial):
- Understand full scope
- Identify major phases
- Plan phase 1 in detail

EXECUTE Phase 1

SEQUENTIAL THINKING (Mid-Task):
- Review phase 1 results
- Adjust plan if needed
- Plan phase 2 in detail

EXECUTE Phase 2

... continue pattern ...
```

---

## 🎯 Examples by Subagent

### AIO Sandbox Specialist
**Task:** Scrape product data from e-commerce site

**Sequential Thinking:**
1. Think: What data fields needed?
2. Think: What's the page structure?
3. Think: Any anti-scraping measures?
4. Think: Best approach (browser automation vs direct HTTP)?
5. Think: How to structure output?

**Then Execute:** browser_navigate → browser_get_markdown → parse → save

### MCP Docker Specialist  
**Task:** Review pull request for security issues

**Sequential Thinking:**
1. Think: What changed in this PR?
2. Think: What security tools to use?
3. Think: What patterns to look for?
4. Think: How to prioritize findings?
5. Think: How to communicate issues?

**Then Execute:** pull_request_read → get_file_contents → semgrep_scan → analyze_security_and_patterns → add_comment_to_pending_review

### Chrome DevTools Specialist
**Task:** Analyze page performance

**Sequential Thinking:**
1. Think: What metrics matter?
2. Think: How long to record?
3. Think: What interactions to test?
4. Think: What baseline to compare against?
5. Think: How to present findings?

**Then Execute:** navigate_page → performance_start_trace → (wait) → performance_stop_trace → performance_analyze_insight

---

## ⚠️ Anti-Patterns (DO NOT DO)

### ❌ **Jumping to Execution**
```
BAD:
Task received → immediately start executing → realize missed steps → backtrack
```

### ❌ **Skipping "Simple" Tasks**
```
BAD:
"This is easy, no need to plan" → execute → unexpected complexity → fail
```

### ❌ **Sequential Thinking After Failure**
```
BAD:
Execute → fail → "oh, should have planned" → sequential thinking → redo
```

### ✅ **CORRECT Pattern**
```
GOOD:
Task → sequential thinking → well-planned execution → success
```

---

## 🔍 Quality Checks

### Every Sequential Thinking Session Should Include:

**Analysis:**
- [ ] Problem clearly understood
- [ ] Context gathered
- [ ] Constraints identified

**Planning:**
- [ ] Steps broken down logically
- [ ] Dependencies mapped
- [ ] Tool sequence planned

**Execution Readiness:**
- [ ] Success criteria defined
- [ ] Error handling considered
- [ ] Verification methods planned

---

## 📈 Benefits

### Why This Matters:

1. **Fewer Errors** - Think through edge cases before executing
2. **Better Solutions** - Consider alternatives during planning
3. **Traceable Decisions** - Document reasoning for future reference
4. **Efficient Execution** - Optimal tool ordering reduces iterations
5. **Learning** - Review thought process to improve future planning

---

## 🎓 Training Pattern

### For New Subagent Invocations:

**First Invocation:**
- Slow, deliberate sequential thinking
- Explain each thought
- Show full reasoning chain

**After Experience:**
- Still use sequential thinking (always!)
- Can be more concise
- Focus on novel aspects

**Never:**
- Skip sequential thinking
- Assume task is "too simple"
- Execute before planning

---

## 🔧 Implementation in Subagents

### All subagents now have:

1. ✅ **YAML Frontmatter**
   - Includes `mcp__mcp_docker__invoke_tool` for sequentialthinking access

2. ✅ **Sequential Thinking Protocol Section**
   - Mandatory instructions
   - Pattern examples
   - Anti-patterns warnings

3. ✅ **Updated Workflow Patterns**
   - All patterns start with sequential thinking
   - Show thought → action → verify flow

4. ✅ **Docker Container References**
   - Clear instructions on accessing sequentialthinking tool
   - Container names and ports documented

---

## 📚 Resources

**Sequential Thinking Documentation:**
- Tool: `sequentialthinking` in Docker MCP Gateway
- Access: `docker mcp tools inspect sequentialthinking`
- Container: `frost-full-mcp-gateway` (port 8093)

**Subagent Documentation:**
- All profiles: `.rovodev/subagents/*.md`
- Docker setup: `.rovodev/DOCKER-MCP-SETUP.md`
- This mandate: `.rovodev/SEQUENTIAL-THINKING-MANDATE.md`

---

## ✅ Compliance

**All subagents MUST:**
- Start with sequential thinking
- Document thought process
- Follow planned steps
- Verify outcomes

**Violations Result In:**
- Incomplete solutions
- Wasted iterations
- Preventable errors
- Poor quality outcomes

---

**Remember:** Think first, act second. Always.

**Status:** ACTIVE and ENFORCED  
**Updated:** January 13, 2026  
**Applies To:** ALL 10 subagents
