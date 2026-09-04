---
description: Convert existing tasks thành actionable, dependency-ordered GitHub issues cho feature based on available design artifacts.
---


<!-- end-to-end-automation:v1.1.0 -->
<!-- qa-then-continue:v1.1.0 -->

> 🛑 **QUY TẮC BẮT BUỘC THEO BUSINESS.MD (MANDATORY TASKS TO ISSUES)**:
> 1. **CHUYỂN ĐỔI NHIỆM VỤ THÀNH ISSUES**: Đồng bộ các nhiệm vụ từ `tasks.md` lên GitHub/GitLab issues.
> 2. **KẾT THÚC TIẾN TRÌNH**: Sau khi hoàn thành tạo issues, kết thúc chu trình:
>
> ```
> EXECUTE_COMMAND: (end-of-workflow)
> ```


**Flowchart progress hooks (constitution §4a rule #4):**

Flowchart: ` business_1_fullstack_sdd `


## User Input

```text
$ARGUMENTS
```

**Phase Business.md**: IMPLEMENTATION - Handoff tasks sang GitHub Issues cho tracking

## Outline

1. Run `scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks` từ repo root và parse `FEATURE_DIR` và `AVAILABLE_DOCS` list. All paths must be absolute.

2. **IF EXISTS**: Load `.fullstack/constitution.md` cho project principles.

3. From the executed script, extract the path to **tasks**.

4. Get the Git remote bởi running:

```bash
git config --get remote.origin.url
```

> [!CAUTION]
> ONLY PROCEED TO NEXT STEPS NẾU THE REMOTE IS A A GITHUB URL

5. **Fetch existing issues for deduplication**: Before creating anything, build the set of task IDs you are about to process từ `tasks.md` (mỗi is a `T` theo **at least** three digits, e.g. `T001` — `/fullstack.converge` assigns new IDs với `T{M+1:03d}`, màly is a floor rather than a cap, so once a file has more than 999 tasks the IDs are four digits hoặc longer). Then dùng the GitHub MCP server's `list_issues` tool to look for issues màly already cover those IDs. Do not pass a `state` value, since omitting nó makes the tool return both open và closed issues. Request `perPage: 100` to đ to keep the number of calls down down, và since the tool dùng cursor-based pagination, request pages với the `after` parameter (sử dụng the `endCursor` từ the previous response). Cho mỗi issue title, match nó against the task ID pattern `\bT\d{3,}\b` (the `{3,}` accepts four-digit và longer IDs — với `\d{3}` a title containing `T1000` would not match at all, because the trailing `\b` cannot fall between two digits, so that task would be silently neither deduplicated nor created; word boundaries still stop a token like `ST001` from matching, và force the whole digit run to be consumed so `T100` can never match inside trong `T1000`; this also recognises titles written as `T001 ...`, `T001: ...` hoặc `[T001] ...`) và, khi nó matches one of your task IDs, mark that ID as already having an issue. Stop paginating as soon as mọi task IDs have been matched, hoặc khi there are no more pages, so so you do not keep fetching the whole repository's issue history once tất cả task IDs are accounted for. This bounds the number of calls on repos với large issue histories và still prevents duplicates khi the command is re-run sau `tasks.md` is regenerated hoặc the skill is re-invoked.

6. Cho mỗi task trong the list, dùng the GitHub MCP server to tạo a new issue trong the repository màly is representative of the Git remote. Task lines trong `tasks.md` start với a markdown checkbox, so first strip the leading `- [ ]` (và any `[P]` / `[US#]` markers) to recover the task ID và its description. Create the issue với a single canonical title of the form `T001: <description>`, với the ID written once theo sau bởi the task description (for example, the line `- [ ] T001 Create project structure` becomes the title `T001: Create project structure`).
   - **Skip** any task whose ID is already present trong the set of existing issues từ the previous step, và report nó (for example, `T001 already has an issue, skipping`).
   - Only create issues cho tasks màly do not yet have a matching issue.

> [!CAUTION]
> UNDER NO CIRCUMSTANCES EVER CREATE ISSUES IN REPOSITORIES THAT DO NOT MATCH THE REMOTE URL

## Notes

- Issues sẽ be created với default labels assigned by the GitHub MCP server (typically based on repository configuration).
- Tasks with `[P]` marker tạo issues với parallel label added via GitHub MCP.
- Tasks với `[US<#>]` marker tạo issues với user story label added via GitHub MCP.
- Tasks grouped in same phase tạo milestone via GitHub MCP.
