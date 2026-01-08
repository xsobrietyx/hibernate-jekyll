---
layout: post
title: "Working with GitHub using gh CLI"
url: /working_with_github_using_gh_cli
file_name: working_with_github_using_gh_cli
---

## Problem definition

You want a **reliable, scriptable way** to list **every pull request in a repository**, regardless of **which base branch** it targets (main, develop, release/*, etc.), and then **filter those PRs by author** (PERSON_1).

The catch: different “views” of contribution exist (commits vs PR metadata). Here we focus purely on **PR metadata**.

## Solution overview

You have two solid approaches:

* Approach A (preferred): `gh pr list`

  * Best when you want a clean “PR-centric” view and easy filtering by `--author`.
  * Supports `--state all`, `--author`, structured output via `--json` and `--jq`. ([GitHub CLI][1])

* Approach B (fallback / maximum control): `gh api` + REST pagination

  * Best when you want raw REST responses and explicit pagination behavior.
  * Uses `--paginate` and filters client-side with `--jq`. ([GitHub CLI][2])

---

## Approach A (preferred): `gh pr list` across all base branches, filtered by author

### 1) The command (copy/paste)

```bash
gh pr list \
  -R OWNER/REPO \
  --author PERSON_1 \
  --state all \
  --limit 5000 \
  --json number,title,state,createdAt,mergedAt,baseRefName,headRefName,mergedBy,url \
  --jq '.[] | "\(.number)\t\(.state)\tbase=\(.baseRefName)\thead=\(.headRefName)\tmergedBy=\(.mergedBy.login // "-")\t\(.title)\t\(.url)"'
```

### 2) Why this works

* Not specifying `--base` means you are **not restricting the target branch**, so PRs to *any* base branch can appear. (`--base` exists only as an optional filter.) ([GitHub CLI][1])
* `--author PERSON_1` filters PRs by author directly. ([GitHub CLI][1])
* `--state all` includes open, closed, merged, etc. ([GitHub CLI][1])
* `--json ... --jq ...` gives stable machine-friendly output without needing jq installed (GitHub CLI has built-in support for jq-style queries for JSON formatting). ([GitHub CLI][3])

### 3) Useful variants

*Only merged PRs:*

```bash
gh pr list -R OWNER/REPO --author PERSON_1 --state merged --limit 5000 \
  --json number,title,mergedAt,baseRefName,url \
  --jq '.[] | "\(.number)\tmergedAt=\(.mergedAt)\tbase=\(.baseRefName)\t\(.title)\t\(.url)"'
```

*Group counts by base branch (quick sanity report):*

```bash
gh pr list -R OWNER/REPO --author PERSON_1 --state all --limit 5000 \
  --json baseRefName \
  --jq 'group_by(.baseRefName) | map({base: .[0].baseRefName, count: length})'
```

---

## Approach B (fallback): `gh api` over REST “List pull requests” with pagination

This is useful when you want to be explicit about REST pagination and query params.

### 1) The command (copy/paste)

```bash
gh api -H "Accept: application/vnd.github+json" \
  "repos/OWNER/REPO/pulls?state=all&per_page=100" \
  --paginate \
  --jq '.[] | select(.user.login=="PERSON_1") | "\(.number)\t\(.state)\tbase=\(.base.ref)\thead=\(.head.ref)\t\(.title)\t\(.html_url)"'
```

### 2) Why this works

* The REST endpoint supports `state` (open/closed/all), `base`, `head`, `per_page`, `page`. ([GitHub Docs][4])
* `per_page=100` asks for the maximum page size. ([GitHub Docs][4])
* `--paginate` makes GitHub CLI keep following pages. ([GitHub CLI][2])
* The REST endpoint does **not** have an `author` query parameter, so we filter in `--jq` by `.user.login`. ([GitHub Docs][4])

---

## Practical recommendation

* Start with **Approach A** (`gh pr list`) because it’s purpose-built for PRs and has a native `--author` filter. ([GitHub CLI][1])
* Use **Approach B** if you need raw REST output or you want tighter control over pagination and query params. ([GitHub CLI][2])

[1]: https://cli.github.com/manual/gh_pr_list "GitHub CLI | Take GitHub to the command line"
[2]: https://cli.github.com/manual/gh_api "GitHub CLI | Take GitHub to the command line"
[3]: https://cli.github.com/manual/gh_help_formatting "GitHub CLI | Take GitHub to the command line"
[4]: https://docs.github.com/en/rest/pulls/pulls "REST API endpoints for pull requests - GitHub Docs"
