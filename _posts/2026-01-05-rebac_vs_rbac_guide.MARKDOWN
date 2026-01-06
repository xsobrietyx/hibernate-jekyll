---
layout: post
title: "ReBAC and RBAC guide"
url: /rebac_vs_rbac_guide
file_name: rebac_vs_rbac_guide
---

Below is a “zero-to-hero” guide to **RBAC** (Role-Based Access Control) and **ReBAC** (Relationship-Based Access Control), with a concrete mental model, schemas, examples, and practical implementation patterns.

---

## 0) The authorization problem (what we’re solving)

When a request comes in:

```text
(User, Action, Resource, Context) -> ALLOW | DENY
```

Examples:

* “Can Alice `read` Document#123?”
* “Can Bob `invite_member` to Org#7?”
* “Can this API token `delete` Project#99?”

Two key parts:

* **Authentication**: who are you? (JWT, session, OAuth, mTLS)
* **Authorization**: what can you do? (RBAC / ReBAC / ABAC / policies)

---

## 1) RBAC (Role-Based Access Control)

### 1.1 Core idea

You don’t assign permissions to users directly.
You assign **roles** to users, and roles contain **permissions**.

```text
User -> Role -> Permission
```

Example roles:

* `org_admin`
* `project_maintainer`
* `viewer`

Example permissions:

* `org:invite_member`
* `project:delete`
* `doc:read`

### 1.2 The classic RBAC model (clean and simple)

* **Users** have **Roles**
* **Roles** have **Permissions**
* Authorization check: “does any role assigned to this user grant this permission?”

### 1.3 Where RBAC gets tricky (real life)

Most systems need **scope**:

* Bob is `admin` of *Org#7*, not “admin of everything”
* Alice is `editor` of *Project#99* only

So you end up with “scoped role assignments”:

```text
(User, Role, ScopeType, ScopeId)
```

Examples:

* (Bob, org_admin, org, 7)
* (Alice, project_editor, project, 99)

### 1.4 A practical RBAC schema (scoped)

A common SQL-ish layout:

* `users(id, ...)`
* `roles(id, name)`
* `permissions(id, key)`  // e.g. "doc:read"
* `role_permissions(role_id, permission_id)`
* `role_assignments(user_id, role_id, scope_type, scope_id)`

Authorization check:

1. Find role assignments for user matching the resource scope
2. Collect permissions from those roles
3. Decide allow/deny

### 1.5 RBAC example (web app)

Say you have:

* Org -> Project -> Document

Permissions:

* `doc:read`
* `doc:write`
* `doc:delete`

Roles:

* `doc_viewer` -> `doc:read`
* `doc_editor` -> `doc:read`, `doc:write`
* `doc_owner`  -> all three

Assignments:

* Alice is `doc_owner` on Document#123
* Bob is `doc_viewer` on Project#99 (so he can read all docs in that project)

You can implement “inheritance” by *copying assignments* or *checking parent scope* (Project role implies Document permission). That “parent scope” part is where RBAC starts to look graphy.

### 1.6 Strengths of RBAC

* Very understandable for humans (“you are an admin”)
* Easy to manage in admin UIs
* Great for coarse-grained permissions (admin dashboards, internal tools)
* Works well when your org structure is stable

### 1.7 RBAC pain points

* Role explosion: `project_editor`, `project_editor_no_delete`, `project_editor_plus_invite`, ...
* Sharing and collaboration are awkward:

  * “This doc is shared with *this group*, and *these 3 users*, and *anyone in the org*”
* Handling inheritance (Org -> Project -> Doc) becomes bespoke logic
* “Who can access this resource?” queries get messy if you’re not careful

---

## 2) ReBAC (Relationship-Based Access Control)

### 2.1 Core idea

Authorization is based on **relationships between entities**, modeled as a graph.

Instead of “Alice has role X”, you say things like:

* Alice is **owner** of Document#123
* Bob is **member** of Group#5
* Group#5 is **viewer** of Document#123
* Project#99 is **parent** of Document#123
* Org#7 is **parent** of Project#99

Then permission checks become “is there a valid path in the relationship graph?”.

### 2.2 The “tuple” model (common ReBAC representation)

A popular way to store relations is as tuples:

```text
(object, relation, subject)
```

Examples:

* (document:123, owner, user:alice)
* (document:123, viewer, group:5)
* (group:5, member, user:bob)
* (project:99, parent, org:7)
* (document:123, parent, project:99)

Then your policy defines how permissions are derived:

* `document.read` is true if subject is in `document.viewer` OR `document.owner` OR inherited from parent project, etc.

### 2.3 Why ReBAC shines

ReBAC is extremely good at:

* Collaboration sharing models (Google Drive style)
* Nested resources and inheritance (Org -> Project -> Doc)
* Groups, teams, dynamic membership
* Expressing “user has access because they’re connected via relationships”

### 2.4 A simple ReBAC mental model

Think of:

* **Nodes**: users, groups, documents, projects, orgs
* **Edges**: member-of, owner-of, shared-with, parent-of
* **Rules**: “to read a doc, you must be reachable through certain edges”

ASCII picture:

```text
user:bob --member--> group:5 --viewer--> document:123
```

So Bob can read Document#123.

### 2.5 ReBAC example policy (human-readable)

Let’s define for `document`:

* `owner`: direct owners (users)
* `editor`: direct editors (users or groups)
* `viewer`: direct viewers (users or groups)
* `parent`: the project containing the document

Rules:

* `can_read`  if in `owner` OR `editor` OR `viewer` OR inherited from `parent.can_read`
* `can_write` if in `owner` OR `editor` OR inherited from `parent.can_write`
* `can_delete` if in `owner` OR inherited from `parent.can_delete`

For `project`:

* `owner`, `maintainer`, `viewer`, `parent` (org)
* similar derivation rules

This gives you inheritance “for free” by following relations.

### 2.6 ReBAC strengths

* Natural for hierarchies and sharing
* Avoids role explosion: you model *relations*, not endless role variants
* Great for “explainability”: “Bob can read because he’s a member of group X which is a viewer of doc Y”
* Enables powerful queries like “list all resources user can access” (with the right indexing/engine)

### 2.7 ReBAC tradeoffs (important)

* Harder to implement correctly from scratch (graph evaluation, cycles, performance)
* Needs careful schema + indexing
* Consistency/caching: relation updates must invalidate access decisions
* You must be disciplined about:

  * “deny” semantics (most ReBAC systems are allow-by-reachability; explicit deny is more complex)
  * preventing cycles or bounding recursion depth

---

## 3) RBAC vs ReBAC: when to choose which

### 3.1 Rule of thumb

* Use **RBAC** when:

  * permissions are mostly “job function” based
  * resource sharing isn’t very dynamic
  * scopes are few and stable
  * you want the simplest admin UX

* Use **ReBAC** when:

  * you have Google-Drive-like sharing
  * groups/teams are central
  * your resources are hierarchical and inheritance matters
  * you need flexible collaboration patterns

### 3.2 Hybrid is extremely common

A strong real-world pattern:

* Use **RBAC** for “platform/admin” abilities (billing, org settings, compliance)
* Use **ReBAC** for “resource collaboration” abilities (projects/docs/items)
* Optionally add **ABAC** constraints for context (time, IP, data classification)

Example:

* RBAC: “Org Admin can manage org settings”
* ReBAC: “This specific document is shared with that group”
* ABAC: “Only allow write if document.classification != 'restricted' OR user has clearance”

---

## 4) Concrete walkthrough: same product modeled both ways

Assume a web app:

* Orgs contain Projects
* Projects contain Documents
* Users can be in Groups (teams)

Goal:

* Org owners manage everything
* Project maintainers can edit docs in that project
* Docs can be shared directly to users or groups as viewer/editor

### 4.1 RBAC approach (what you implement)

You’ll likely need:

* Scoped role assignments at org and project levels
* Extra tables for doc sharing (because doc-level sharing doesn’t fit nicely into static roles)

You end up mixing:

* RBAC for org/project
* ad-hoc ACL for documents

This is common, but it becomes two systems.

### 4.2 ReBAC approach (clean sharing + inheritance)

Relations:

* Org:

  * (org:7, owner, user:alice)
* Project:

  * (project:99, parent, org:7)
  * (project:99, maintainer, group:devs)
* Group:

  * (group:devs, member, user:bob)
* Document:

  * (document:123, parent, project:99)
  * (document:123, viewer, user:carol)  // direct share
  * (document:555, editor, group:qa)     // group share

Then “can Bob edit Document#123?”

* Bob -> member of group:devs
* group:devs -> maintainer of project:99
* document:123 -> parent project:99
* rule says project maintainers can write docs => allow

---

## 5) Implementation sketches in Rust (minimal but correct shape)

These are intentionally small to show the mechanics.

### 5.1 RBAC evaluator (scoped)

```rust
use std::collections::{HashMap, HashSet};

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub enum Scope {
    Global,
    Org(u64),
    Project(u64),
    Document(u64),
}

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct Role(pub &'static str);

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct Permission(pub &'static str);

#[derive(Clone, Debug)]
pub struct Rbac {
    // role -> permissions
    role_perms: HashMap<Role, HashSet<Permission>>,
    // user -> (scope -> roles)
    assignments: HashMap<String, HashMap<Scope, HashSet<Role>>>,
}

impl Rbac {
    pub fn new() -> Self {
        Self {
            role_perms: HashMap::new(),
            assignments: HashMap::new(),
        }
    }

    pub fn grant_role_perm(&mut self, role: Role, perm: Permission) {
        self.role_perms.entry(role).or_default().insert(perm);
    }

    pub fn assign_role(&mut self, user: &str, scope: Scope, role: Role) {
        self.assignments
            .entry(user.to_string())
            .or_default()
            .entry(scope)
            .or_default()
            .insert(role);
    }

    pub fn can(&self, user: &str, scope: &Scope, perm: &Permission) -> bool {
        let Some(scoped) = self.assignments.get(user) else { return false; };

        // simple: check exact scope + global
        for s in [Scope::Global, scope.clone()] {
            if let Some(roles) = scoped.get(&s) {
                for role in roles {
                    if let Some(perms) = self.role_perms.get(role) {
                        if perms.contains(perm) {
                            return true;
                        }
                    }
                }
            }
        }
        false
    }
}

fn main() {
    let mut rbac = Rbac::new();

    let doc_editor = Role("doc_editor");
    rbac.grant_role_perm(doc_editor.clone(), Permission("doc:read"));
    rbac.grant_role_perm(doc_editor.clone(), Permission("doc:write"));

    rbac.assign_role("alice", Scope::Document(123), doc_editor);

    assert!(rbac.can("alice", &Scope::Document(123), &Permission("doc:write")));
    assert!(!rbac.can("alice", &Scope::Document(999), &Permission("doc:write")));
}
```

What’s missing (the “real-world” parts you’ll add):

* inheritance (Project role applies to Documents under it)
* deny rules (if you need them)
* multi-tenant constraints, auditing, admin UX

### 5.2 ReBAC evaluator (graph reachability)

A tiny tuple store + BFS-based reachability. This is not a full Zanzibar engine, but it shows the core.

```rust
use std::collections::{HashMap, HashSet, VecDeque};

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct Node(pub String); // "user:alice", "group:devs", "document:123"

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct Relation(pub &'static str); // "member", "viewer", "editor", "owner", "parent"

#[derive(Clone, Debug)]
pub struct TupleGraph {
    // (object, relation) -> subjects
    edges: HashMap<(Node, Relation), HashSet<Node>>,
}

impl TupleGraph {
    pub fn new() -> Self {
        Self { edges: HashMap::new() }
    }

    pub fn add(&mut self, object: Node, relation: Relation, subject: Node) {
        self.edges.entry((object, relation)).or_default().insert(subject);
    }

    pub fn subjects(&self, object: &Node, relation: &Relation) -> impl Iterator<Item = &Node> {
        self.edges
            .get(&(object.clone(), relation.clone()))
            .into_iter()
            .flat_map(|hs| hs.iter())
    }
}

// Example: "user can read doc if reachable via viewer/editor/owner edges,
// where viewer/editor edges may point to groups, and groups expand via member edge."
pub fn can_read(g: &TupleGraph, user: &Node, doc: &Node) -> bool {
    // Start from doc's direct access relations
    let mut q = VecDeque::new();
    let mut seen = HashSet::new();

    for rel in [Relation("owner"), Relation("editor"), Relation("viewer")] {
        for subj in g.subjects(doc, &rel) {
            q.push_back(subj.clone());
        }
    }

    while let Some(cur) = q.pop_front() {
        if !seen.insert(cur.clone()) {
            continue;
        }
        if &cur == user {
            return true;
        }
        // If cur is a group, expand group members
        if cur.0.starts_with("group:") {
            for m in g.subjects(&cur, &Relation("member")) {
                q.push_back(m.clone());
            }
        }
    }
    false
}

fn main() {
    let mut g = TupleGraph::new();

    let doc = Node("document:123".into());
    let group = Node("group:devs".into());
    let bob = Node("user:bob".into());

    g.add(doc.clone(), Relation("viewer"), group.clone());
    g.add(group.clone(), Relation("member"), bob.clone());

    assert!(can_read(&g, &bob, &doc));
}
```

What a production ReBAC engine adds:

* typed object namespaces and relations (to prevent nonsense tuples)
* derived relations (inheritance via parent relations)
* bounded recursion, cycle handling
* caching/incremental computation
* fast “check” and “list” operations at scale

---

## 6) Production-ready guidance (what experienced teams do)

### 6.1 Start with your authorization “shape”

Answer these early:

* Are resources hierarchical? (Org -> Project -> Doc)
* Do you need sharing to groups/users at resource-level?
* Do you need “explain why allowed”?
* Do you need explicit deny?
* Do you need “list all docs user can read” fast?

If you have hierarchy + sharing + groups, you’re already in ReBAC territory.

### 6.2 Prefer a hybrid that matches how humans administer

A very practical split:

* RBAC:

  * org billing
  * org settings
  * platform admin
  * internal support roles

* ReBAC:

  * access to projects/docs/items
  * sharing and collaboration
  * inheritance through parents
  * group-based access

### 6.3 Testing strategy (non-negotiable)

Build a permission test matrix:

* each role/relation
* each action
* each scope level
* plus negative tests

Example (conceptually):

* Alice owner of doc -> can read/write/delete
* Bob group member viewer -> can read, cannot write/delete
* Carol org admin -> can do org settings, maybe not auto read every doc unless modeled

### 6.4 Operational concerns

* Log authorization decisions (at least for writes)
* Provide an “explain” mode for debugging (“why was it denied?”)
* Make policy changes safe (version policies, gradual rollout)
* Have a migration plan (roles/relations evolve)

---

## 7) Quick “choose your path” checklist

* If your app is mostly “job roles” + a few scopes:

  * start RBAC with scoped assignments
  * keep role count small
  * add inheritance carefully

* If your app looks like collaboration software:

  * model relationships explicitly (ReBAC)
  * keep tuples as the source of truth
  * define derived permissions via consistent rules

* If you’re unsure:

  * implement RBAC for admin and coarse controls
  * implement ReBAC for resource sharing
  * do not build two different ad-hoc ACL systems
