# Issue tracker: GitHub

Specs and tickets for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body-file <file>`.
- **Read an issue**: `gh issue view <number> --json number,title,body,labels,comments`.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments`.
- **Make an issue a sub-issue**: `gh issue edit <parent> --add-sub-issue <child>` (or `gh issue create --parent <parent>`).
- **Comment**: `gh issue comment <number> --body "..."`.
- **Labels**: `gh issue edit <number> --add-label "ready-for-agent"`.
- **Close**: `gh issue close <number> --comment "..."`. Close only with the work merged or a written reason.

## Pull requests

A PR into the integration branch is how a ticket closes. Use the `/pr` template and attach evidence with `gh pr create --attach <file>`. Link the PR to its ticket in the body (`Closes #<n>`); do not close the parent spec from a ticket.

## When a skill says "publish to the issue tracker"

Create a GitHub issue. Apply the `ready-for-agent` label to specs and tickets that are ready to implement.

## Native blocking edges

GitHub issue dependencies are the canonical blocking representation:

```sh
# blocker database id
gh api repos/gerrcass/scroll-to-orbit/issues/<blocker> --jq .id
# edge: child is blocked by blocker
gh api --method POST repos/gerrcass/scroll-to-orbit/issues/<child>/dependencies/blocked_by \
  -F issue_id=<blocker-db-id>
```

Where the dependency API is unavailable, put `Blocked by: #<n>, #<n>` at the top of the child body and do not label the child `ready-for-agent` until those issues close.
