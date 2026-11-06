---
layout: post
title: "Ukraine's Parliament in Neo4j: From MPs to Voting Patterns"
date: 2026-11-05 12:00:00 -0500
url: /verkhovna-rada-neo4j-voting-graph/
file_name: verkhovna_rada_neo4j_voting_graph
description: "A reproducible guide to modelling the Verkhovna Rada in Neo4j: temporal faction memberships, committees, roll calls, CSV imports, and defensible voting analytics."
---

A parliamentary graph becomes useful when it can answer a precise question: **which members belonged to a faction when a particular motion was voted on, and how did their recorded decisions compare?** Creating nodes for MPs, parties, and committees is a useful start. Preserving identity, time, and the meaning of each vote is what makes the answers reliable.

This guide builds a Neo4j model of the Verkhovna Rada of Ukraine, adds bills and individual roll calls, and develops queries for faction distributions, majority deviations, agreement, and data coverage. It also shows how to move from a small `UNWIND` seed to repeatable CSV imports.

**Every person, organization, office, bill, and voting record in the runnable dataset is fictional.** The `demo:` namespace and `synthetic` node property make that boundary explicit. These examples do not claim to reproduce the current roster or anyone's actual votes. Official sources are linked where the article discusses real parliamentary data.

The examples target **Neo4j 5.26 and Cypher 5**, require no APOC, and use uniqueness constraints available in Community Edition. The `CALL (row)` syntax used for batching requires Neo4j 5.23 or later. See Neo4j's [edition comparison](https://neo4j.com/docs/cypher-manual/5/introduction/cypher-neo4j/) and [subquery scope documentation](https://neo4j.com/docs/cypher-manual/5/subqueries/call-subquery/).

## Contents

1. [Choose the unit of truth](#choose-the-unit-of-truth)
2. [Model identities and changing relationships](#model-identities-and-changing-relationships)
3. [Create the schema](#create-the-schema)
4. [Populate a reproducible graph](#populate-a-reproducible-graph)
5. [Import a larger dataset](#import-a-larger-dataset)
6. [Query voting patterns](#query-voting-patterns)
7. [Check the graph before interpreting it](#check-the-graph-before-interpreting-it)
8. [Build a source-backed ingestion pipeline](#build-a-source-backed-ingestion-pipeline)

## Choose the unit of truth

An MP is a person. A parliamentary mandate is a time-bounded relationship between that person and a convocation. A political party, a parliamentary faction or group, a committee, and a parliamentary office describe different institutions or functions. Keeping them separate prevents a role such as Speaker from leaking into a faction-membership property.

Likewise, **a bill is not a vote**. One bill can have first-reading, amendment, procedural, and final-adoption votes. Two votes can occur minutes apart on the same day. A calendar date therefore makes a poor roll-call identifier.

Here, `VotingSession` means **one recorded roll-call event**. `RollCall` would be an equally good label. A plenary sitting, if needed, should be another node containing many such events. Some motions have no bill at all; keep those events and their motion text without inventing a `Bill` node.

This distinction matters even in examples. The official card for defence-enterprise reform bill **3822** records registration on **9 July 2020** and adoption on **13 July 2021**, with act number **1630-IX**. Attaching a fabricated November 2026 voting matrix to that real identifier would create a false historical record. Our runnable bill is instead `demo:bill:1`. [Official bill card](https://itd.rada.gov.ua/billinfo/Bills/Card/3240).

Before importing real records, choose these identities:

| Entity | Recommended identity | Common mistake |
| --- | --- | --- |
| Person / MP | Source-scoped person identifier, with a documented crosswalk if IDs change between systems | Joining on an English spelling or surname |
| Parliament | Institution and convocation | Treating every mandate as a new person |
| Faction or group | Source identifier scoped to the convocation | Using the associated party's name as its identity |
| Party | Party identifier independent of parliamentary membership | Assuming election nomination proves continuing membership |
| Committee / office | Source identifier scoped to its institutional context | Creating a committee named `Leadership` |
| Bill | Source bill-card identifier; keep registration number as a separate property | Treating the displayed number as globally unique |
| Roll call | Source event identifier scoped to its source system / convocation | Using `Session-2026-11-05` for every vote that day |
| Individual outcome | MP identity plus roll-call identity | Including the decision in the identity and creating a second vote on correction |

Display names belong in properties such as `nameUk` and `nameEn`. Preserve the Ukrainian original and keep transliteration separate. An internal UUID is also valid, provided a unique external-ID mapping prevents duplicate imports.

## Model identities and changing relationships

The working graph has this shape. Properties in brackets belong to relationships:

```text
(Person:MemberOfParliament)
  |-- HOLDS_MANDATE [validFrom, validTo] ------> (Parliament)
  |-- MEMBER_OF_FACTION [validFrom, validTo] --> (Faction)
  |                                              |-- ASSOCIATED_WITH --> (PoliticalParty)
  |                                              `-- IN_PARLIAMENT ----> (Parliament)
  |-- SERVES_ON_COMMITTEE [role, dates] --------> (ParliamentaryCommittee)
  |-- HOLDS_OFFICE [dates] --------------------> (ParliamentaryOffice)
  `-- VOTED [decision, sourceUri, observedAt] --> (VotingSession)
                                                  |-- VOTING_ON_BILL --> (Bill)
                                                  `-- IN_PARLIAMENT --> (Parliament)
```

`MEMBER_OF_FACTION.role`, `SERVES_ON_COMMITTEE.role`, and `HOLDS_OFFICE` carry distinct meanings. Do not infer committee leadership from whether a person's general title contains `Chairman`. A faction leader can be an ordinary committee member; a parliamentary office is a separate tenure.

For this model, `Faction.kind` can distinguish `FACTION` from `GROUP`. `ASSOCIATED_WITH` describes a sourced organizational association; it does not assert that every member belongs to that political party. Actual party membership, if available, deserves its own dated relationship.

### Membership is an interval

Use half-open intervals, **[validFrom, validTo)**:

```text
validFrom <= eventTime AND (validTo IS NULL OR eventTime < validTo)
```

At the precise instant of a transfer, the old membership has ended and the new one has begun. `null` means the end is not recorded; it is not a promise that membership continues forever. The seed gives Demo MP 04 two faction intervals, so historical queries must select the right one.

Store event times as Neo4j `datetime` values. When an upstream system supplies local Ukrainian time without an offset, resolve it using `Europe/Kyiv` and the event's date before import. Do not apply today's UTC offset to all historical records. If a source only provides a transition date, preserve that precision and flag ambiguous same-day assignments rather than manufacturing a precise time.

These are modelling choices. They do not by themselves reconstruct history from a present-day roster. The Rada publishes both an [MP data catalogue](https://data.rada.gov.ua/open/data/mps-skl9) and a separate [faction/group transition catalogue](https://data.rada.gov.ua/open/data/mps-trans), which are different inputs to the temporal model.

### Preserve the five recorded outcomes

Official roll-call pages distinguish votes for, votes against, abstentions, non-voting, and absence. Normalize the individual source labels into a small vocabulary while retaining the original text in production. [Example official roll call](https://w1.c1.rada.gov.ua/pls/radan_gs09/ns_golos?g_id=35595).

| Source outcome | Graph value | Interpretation |
| --- | --- | --- |
| За | `FOR` | Recorded support |
| Проти | `AGAINST` | Recorded opposition |
| Утримався / Утрималась / Утрималася | `ABSTAIN` | Recorded abstention; recognize the source's grammatical variants |
| Не голосував / Не голосувала | `NOT_VOTING` | Source explicitly records non-voting |
| Відсутній / Відсутня | `ABSENT` | Source explicitly records absence |
| No imported record | No relationship | Unknown until ingestion completeness is established |

The name `VOTED` is a convenient umbrella for recorded outcomes, including explicit non-votes. `RECORDED_OUTCOME` would be more literal. Whichever name you choose, **never translate a missing row into `ABSENT` or an abstention into `AGAINST`**.

## Create the schema

Run the constraints before importing. They use stable IDs rather than mutable names. Relationship uniqueness makes the MP/event key enforceable, including when a malformed import tries to reuse that key with different endpoints. Neo4j documents the syntax and semantics in [property uniqueness constraints](https://neo4j.com/docs/cypher-manual/5/constraints/create-constraints/).

```cypher
// Neo4j 5.26 / Cypher 5. No APOC or Enterprise-only constraints required.
CREATE CONSTRAINT rada_mp_id IF NOT EXISTS
FOR (m:MemberOfParliament) REQUIRE m.id IS UNIQUE;
CREATE CONSTRAINT rada_parliament_id IF NOT EXISTS
FOR (p:Parliament) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT rada_party_id IF NOT EXISTS
FOR (p:PoliticalParty) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT rada_faction_id IF NOT EXISTS
FOR (f:Faction) REQUIRE f.id IS UNIQUE;
CREATE CONSTRAINT rada_committee_id IF NOT EXISTS
FOR (c:ParliamentaryCommittee) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT rada_office_id IF NOT EXISTS
FOR (o:ParliamentaryOffice) REQUIRE o.id IS UNIQUE;
CREATE CONSTRAINT rada_bill_id IF NOT EXISTS
FOR (b:Bill) REQUIRE b.id IS UNIQUE;
CREATE CONSTRAINT rada_roll_call_id IF NOT EXISTS
FOR (s:VotingSession) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT rada_vote_id IF NOT EXISTS
FOR ()-[v:VOTED]-() REQUIRE v.id IS UNIQUE;
CREATE CONSTRAINT rada_faction_membership_id IF NOT EXISTS
FOR ()-[r:MEMBER_OF_FACTION]-() REQUIRE r.id IS UNIQUE;
CREATE CONSTRAINT rada_mandate_id IF NOT EXISTS
FOR ()-[r:HOLDS_MANDATE]-() REQUIRE r.id IS UNIQUE;
CREATE CONSTRAINT rada_committee_membership_id IF NOT EXISTS
FOR ()-[r:SERVES_ON_COMMITTEE]-() REQUIRE r.id IS UNIQUE;
CREATE CONSTRAINT rada_office_tenure_id IF NOT EXISTS
FOR ()-[r:HOLDS_OFFICE]-() REQUIRE r.id IS UNIQUE;
```

Uniqueness does not require a property to exist. A writer could still create an ID-less node or vote, and a uniqueness constraint does not enforce valid decision codes, interval order, or one faction at a time. Validate those rules in ingestion and audit them explicitly. Existence and key constraints have different edition requirements. [Constraint types](https://neo4j.com/docs/cypher-manual/5/constraints/).

## Populate a reproducible graph

Download [schema.cypher](/assets/rada-neo4j/schema.cypher), [seed.cypher](/assets/rada-neo4j/seed.cypher), [analytics.cypher](/assets/rada-neo4j/analytics.cypher), [votes.csv](/assets/rada-neo4j/votes.csv), and [import-votes.cypher](/assets/rada-neo4j/import-votes.cypher). The snippets below and these files use the same model.

Against a scratch database, run the schema, seed, and analytics in that order. With an authenticated local Neo4j installation, `cypher-shell` prompts for your password:

```bash
cypher-shell -a neo4j://localhost:7687 -u neo4j -d neo4j -f schema.cypher
cypher-shell -a neo4j://localhost:7687 -u neo4j -d neo4j -f seed.cypher
cypher-shell -a neo4j://localhost:7687 -u neo4j -d neo4j -f analytics.cypher
```

In Neo4j Browser, execute each semicolon-terminated statement separately. The inline seed creates seven fictional MPs, two factions and associated parties, two committees, three offices, a parliament, one bill, three roll calls, and 21 recorded outcomes:

```cypher
// ALL people, organizations, offices, bills and votes below are synthetic.
// Dates demonstrate temporal queries; they are not records of real proceedings.
MERGE (p:Parliament {id: 'demo:rada:9'})
SET p.name = 'Synthetic Rada teaching dataset', p.synthetic = true;

UNWIND [
  {id: 'demo:faction:a', name: 'Demo Faction A', partyId: 'demo:party:a'},
  {id: 'demo:faction:b', name: 'Demo Faction B', partyId: 'demo:party:b'}
] AS row
MATCH (parliament:Parliament {id: 'demo:rada:9'})
MERGE (f:Faction {id: row.id})
SET f.name = row.name, f.kind = 'FACTION', f.synthetic = true
MERGE (p:PoliticalParty {id: row.partyId})
SET p.name = replace(row.name, 'Faction', 'Party'), p.synthetic = true
MERGE (f)-[:IN_PARLIAMENT]->(parliament)
MERGE (f)-[:ASSOCIATED_WITH]->(p);

UNWIND range(1, 7) AS number
MATCH (parliament:Parliament {id: 'demo:rada:9'})
MERGE (m:MemberOfParliament {id: 'demo:mp:' + toString(number)})
ON CREATE SET m.createdAt = datetime()
SET m:Person, m.name = 'Demo MP 0' + toString(number), m.synthetic = true
MERGE (m)-[t:HOLDS_MANDATE {id: m.id + '|demo:rada:9|1'}]->(parliament)
SET t.validFrom = datetime('2026-09-01T00:00:00+03:00'),
    t.validTo = null, t.sourceUri = 'urn:demo:rada-neo4j:v1';

UNWIND [
  {mp: 2, faction: 'a', start: '2026-09-01T00:00:00+03:00', end: null},
  {mp: 3, faction: 'a', start: '2026-09-01T00:00:00+03:00', end: null},
  {mp: 4, faction: 'a', start: '2026-09-01T00:00:00+03:00', end: '2026-10-15T00:00:00+03:00'},
  {mp: 4, faction: 'b', start: '2026-10-15T00:00:00+03:00', end: null},
  {mp: 5, faction: 'b', start: '2026-09-01T00:00:00+03:00', end: null},
  {mp: 6, faction: 'b', start: '2026-09-01T00:00:00+03:00', end: null},
  {mp: 7, faction: 'b', start: '2026-09-01T00:00:00+03:00', end: null}
] AS row
MATCH (m:MemberOfParliament {id: 'demo:mp:' + toString(row.mp)})
MATCH (f:Faction {id: 'demo:faction:' + row.faction})
MERGE (m)-[r:MEMBER_OF_FACTION {id: m.id + '|' + f.id + '|' + row.start}]->(f)
SET r.validFrom = datetime(row.start), r.validTo = datetime(row.end),
    r.role = 'MEMBER', r.sourceUri = 'urn:demo:rada-neo4j:v1';

UNWIND [
  {mp: 1, id: 'speaker', name: 'Demo Speaker'},
  {mp: 2, id: 'first-deputy', name: 'Demo First Deputy Speaker'},
  {mp: 5, id: 'deputy', name: 'Demo Deputy Speaker'}
] AS row
MATCH (m:MemberOfParliament {id: 'demo:mp:' + toString(row.mp)})
MATCH (p:Parliament {id: 'demo:rada:9'})
MERGE (o:ParliamentaryOffice {id: 'demo:office:' + row.id})
SET o.name = row.name, o.synthetic = true
MERGE (o)-[:IN_PARLIAMENT]->(p)
MERGE (m)-[r:HOLDS_OFFICE {id: m.id + '|' + o.id + '|1'}]->(o)
SET r.validFrom = datetime('2026-09-01T00:00:00+03:00'),
    r.validTo = null, r.sourceUri = 'urn:demo:rada-neo4j:v1';

UNWIND [
  {mp: 3, id: 'digital', name: 'Demo Digital Committee', role: 'CHAIR'},
  {mp: 4, id: 'digital', name: 'Demo Digital Committee', role: 'MEMBER'},
  {mp: 6, id: 'social', name: 'Demo Social Committee', role: 'CHAIR'},
  {mp: 7, id: 'social', name: 'Demo Social Committee', role: 'MEMBER'}
] AS row
MATCH (m:MemberOfParliament {id: 'demo:mp:' + toString(row.mp)})
MATCH (p:Parliament {id: 'demo:rada:9'})
MERGE (c:ParliamentaryCommittee {id: 'demo:committee:' + row.id})
SET c.name = row.name, c.synthetic = true
MERGE (c)-[:IN_PARLIAMENT]->(p)
MERGE (m)-[r:SERVES_ON_COMMITTEE {id: m.id + '|' + c.id + '|1'}]->(c)
SET r.role = row.role, r.validFrom = datetime('2026-09-01T00:00:00+03:00'),
    r.validTo = null, r.sourceUri = 'urn:demo:rada-neo4j:v1';

MERGE (b:Bill {id: 'demo:bill:1'})
SET b.title = 'Synthetic public data bill', b.synthetic = true
WITH b
MATCH (p:Parliament {id: 'demo:rada:9'})
MERGE (b)-[:IN_PARLIAMENT]->(p)
WITH b, p
UNWIND [
  {id: 'demo:rc:1', at: '2026-10-01T10:00:00+03:00', stage: 'FIRST_READING'},
  {id: 'demo:rc:2', at: '2026-10-01T10:15:00+03:00', stage: 'AMENDMENT'},
  {id: 'demo:rc:3', at: '2026-10-20T10:00:00+03:00', stage: 'SECOND_READING'}
] AS row
MERGE (s:VotingSession {id: row.id})
SET s.occurredAt = datetime(row.at), s.stage = row.stage,
    s.motion = 'Synthetic motion: ' + row.stage,
    s.synthetic = true, s.sourceUri = 'urn:demo:rada-neo4j:v1'
MERGE (s)-[:VOTING_ON_BILL]->(b)
MERGE (s)-[:IN_PARLIAMENT]->(p);

// Array position 1..7 corresponds to Demo MP 01..07.
UNWIND [
  {session: 'demo:rc:1', decisions: ['FOR', 'FOR', 'FOR', 'AGAINST', 'FOR', 'AGAINST', 'ABSTAIN']},
  {session: 'demo:rc:2', decisions: ['NOT_VOTING', 'FOR', 'ABSENT', 'AGAINST', 'AGAINST', 'AGAINST', 'ABSTAIN']},
  {session: 'demo:rc:3', decisions: ['ABSENT', 'FOR', 'FOR', 'FOR', 'AGAINST', 'AGAINST', 'NOT_VOTING']}
] AS row
MATCH (s:VotingSession {id: row.session})
UNWIND range(1, size(row.decisions)) AS number
MATCH (m:MemberOfParliament {id: 'demo:mp:' + toString(number)})
MERGE (m)-[v:VOTED {id: m.id + '|' + s.id}]->(s)
ON CREATE SET v.createdAt = datetime()
SET v.decision = row.decisions[number - 1],
    v.sourceUri = 'urn:demo:rada-neo4j:v1',
    v.observedAt = datetime('2026-11-05T12:00:00Z')
RETURN count(v) AS voteRowsProcessed,
       count(DISTINCT m) AS distinctMPs,
       count(DISTINCT s) AS distinctRollCalls;
```

The final result is **21 vote rows processed, seven distinct MPs, and three distinct roll calls**. Rerunning the seed preserves the same graph identities. It also restores the fixture's values, so keep teaching data separate from real imports.

### Why these writes are repeatable

`MERGE` contains only identity properties. Mutable names, roles, and decisions are updated with `SET`; `ON CREATE SET` is reserved for creation metadata. If a source corrects a decision, merging on the same MP/event identity updates the recorded outcome. Putting `decision` inside `MERGE` would instead try to create another fact.

The synthetic vote key uses `mpId + '|' + sessionId`. Production IDs must either exclude the delimiter or use an unambiguous encoding. Concurrent writes can still conflict or deadlock; let a transaction retry policy handle transient failures. Constraints protect identity, while the importer remains responsible for selecting the authoritative revision. See [MERGE](https://neo4j.com/docs/cypher-manual/5/clauses/merge/).

`count(v)` counts rows that reached the return clause. It does not mean 21 new relationships were created. Similarly, a party matched once per MP will be counted repeatedly by `count(p)`. Use `count(DISTINCT p)` for distinct entities and the client's write counters for newly created entities.

## Import a larger dataset

The roster itself is small. Repeated roll calls across many years create the larger workload. Keep the data contract explicit and import in dependency order: people and convocations, organizations and tenures, bills and events, then individual outcomes.

### Define a normalized contract

The downloadable CSV is a **teaching contract**, not a claim about the official portal's field names. Its header is:

```csv
mp_id,session_id,decision,source_uri,observed_at
demo:mp:4,demo:rc:1,AGAINST,urn:demo:rada-neo4j:v1,2026-11-05T12:00:00Z
```

Use separate normalized files for independent entities. A single flat MP/faction/committee spreadsheet is convenient for a snapshot, but multiple committees or tenures can duplicate rows and obscure what an empty cell means.

| File | Minimum normalized fields |
| --- | --- |
| `people.csv` | `mp_id`, original name, source person ID |
| `mandates.csv` | tenure ID, `mp_id`, parliament ID, start, optional end |
| `faction_memberships.csv` | membership ID, `mp_id`, faction ID, start, optional end |
| `committee_memberships.csv` | membership ID, `mp_id`, committee ID, role, dates |
| `bills.csv` | bill ID, registration number, title, source URI |
| `roll_calls.csv` | event ID, parliament ID, timestamp, motion, optional bill ID, stage |
| `votes.csv` | MP ID, event ID, normalized decision, source URI, observation time |

Preserve source IDs as strings. Convert numeric quantities deliberately rather than allowing CSV text to dictate graph types. Reject whitespace-only IDs, unknown codes, invalid timestamps, and references to missing entities before writing. Never create an empty-string faction or committee to represent missing information.

### Validate before writing

For a local Neo4j server, copy `votes.csv` into its configured import directory. `file:///votes.csv` is resolved by the database server, which may be a container or a different machine. Aura does not support local `file:///` imports; use an accessible HTTPS CSV or send parameterized batches through a driver. A GitHub blob page is HTML; use a raw-content URL pinned to a commit for reproducibility. [LOAD CSV documentation](https://neo4j.com/docs/cypher-manual/5/clauses/load-csv/).

This preflight reports missing endpoints, malformed IDs, missing provenance fields, and unknown decisions:

```cypher
LOAD CSV WITH HEADERS FROM 'file:///votes.csv' AS row
WITH row, linenumber() AS line
OPTIONAL MATCH (m:MemberOfParliament {id: row.mp_id})
OPTIONAL MATCH (s:VotingSession {id: row.session_id})
WITH row, line, m, s
WHERE trim(coalesce(row.mp_id, '')) = ''
   OR trim(coalesce(row.session_id, '')) = ''
   OR row.mp_id <> trim(row.mp_id)
   OR row.session_id <> trim(row.session_id)
   OR row.mp_id CONTAINS '|' OR row.session_id CONTAINS '|'
   OR m IS NULL OR s IS NULL
   OR NOT coalesce(row.decision IN
      ['FOR', 'AGAINST', 'ABSTAIN', 'NOT_VOTING', 'ABSENT'], false)
   OR trim(coalesce(row.source_uri, '')) = ''
   OR trim(coalesce(row.observed_at, '')) = ''
RETURN line, row.mp_id AS mpId, row.session_id AS rollCall,
       row.decision AS decision, m IS NULL AS missingMP,
       s IS NULL AS missingRollCall
ORDER BY line;
```

Require zero rows. This query checks timestamp presence; parse and validate timestamp syntax and timezone awareness in the extraction/validation step. Also reject duplicate MP/event keys before import:

```cypher
LOAD CSV WITH HEADERS FROM 'file:///votes.csv' AS row
WITH row.mp_id AS mpId, row.session_id AS rollCall,
     count(*) AS rows, collect(DISTINCT row.decision) AS decisions
WHERE rows > 1
RETURN mpId, rollCall, rows, decisions;
```

Even identical duplicates should be resolved explicitly. Conflicting rows need an authoritative revision rule, not whichever row happens to be processed last. Use the same immutable file for validation and import, and serialize conflicting imports to avoid changing the validated assumptions underneath a batch.

### Batch the writes

After validation and entity import, run:

```cypher
// First run the preflight checks in the article against the same immutable CSV.
// Copy votes.csv into the database server's import directory, after seeding.
// Neo4j Browser: run this statement with :auto on the preceding line.
// cypher-shell: run as-is (implicit transaction).
LOAD CSV WITH HEADERS FROM 'file:///votes.csv' AS row
CALL (row) {
  MATCH (m:MemberOfParliament {id: row.mp_id})
  MATCH (s:VotingSession {id: row.session_id})
  MERGE (m)-[v:VOTED {id: m.id + '|' + s.id}]->(s)
  ON CREATE SET v.createdAt = datetime()
  SET v.decision = row.decision,
      v.sourceUri = row.source_uri,
      v.observedAt = datetime(row.observed_at)
} IN TRANSACTIONS OF 1000 ROWS;
```

In Neo4j Browser, put `:auto` on a separate line before this statement. In `cypher-shell`, use the file as written. `CALL ... IN TRANSACTIONS` requires an implicit transaction; do not wrap it in a driver's managed write transaction. Earlier batches remain committed if a later batch fails, so retry from a validated snapshot using stable keys. [Transactional subqueries](https://neo4j.com/docs/cypher-manual/5/subqueries/subqueries-in-transactions/).

Matching the endpoints avoids inventing placeholder MPs or events. It also means unmatched rows can disappear from the write path, which is why the preflight and post-import reconciliation are required. A successful command alone does not prove every expected outcome was imported.

For remote databases, the same pattern works with `UNWIND $rows AS row` and driver-managed batches. Keep the query static and pass records as parameters. Pick a batch size based on transaction latency and memory, starting with a modest batch such as 1,000 vote rows. Parallelize only after measuring contention on shared event nodes.

## Query voting patterns

### A. How did each faction vote on a bill?

Group by **roll call, faction, and decision**. Grouping only by bill mixes readings, amendments, and procedural motions. The optional membership match retains MPs whose faction cannot be assigned at that instant:

```cypher
// A. Faction distribution at the instant of each roll call, including unaffiliated MPs.
MATCH (b:Bill {id: 'demo:bill:1'})<-[:VOTING_ON_BILL]-(s:VotingSession)
MATCH (m:MemberOfParliament)-[v:VOTED]->(s)
OPTIONAL MATCH (m)-[membership:MEMBER_OF_FACTION]->(f:Faction)
               -[:IN_PARLIAMENT]->(:Parliament)<-[:IN_PARLIAMENT]-(s)
WHERE membership.validFrom <= s.occurredAt
  AND (membership.validTo IS NULL OR s.occurredAt < membership.validTo)
RETURN s.id AS rollCall, coalesce(f.name, 'UNAFFILIATED_OR_UNKNOWN') AS faction,
       v.decision AS decision, count(DISTINCT m) AS members
ORDER BY rollCall, faction, members DESC, decision;
```

The `WHERE` belongs to the `OPTIONAL MATCH`: it restricts eligible membership relationships without dropping the MP's recorded outcome. The fallback label deliberately combines unaffiliated and unknown membership. A production dataset must track affiliation completeness or an explicit sourced status to distinguish those cases.

On `demo:rc:1`, Faction A has two `FOR` votes and one `AGAINST`; Faction B has one each of `FOR`, `AGAINST`, and `ABSTAIN`. On `demo:rc:3`, Demo MP 04 is counted under Faction B, because the event follows the transfer. `DISTINCT` guards duplicate paths to the same faction; contradictory overlapping memberships in different factions still need to be rejected.

### B. Which MPs differed from a faction majority?

Define the statistic before writing the query. Here, an **expressed decision** is `FOR`, `AGAINST`, or `ABSTAIN`. `ABSENT` and `NOT_VOTING` are excluded from this comparison. A category is a strict majority only when it accounts for **more than half of expressed decisions** within that faction and roll call.

A plurality is different: a 4–3–3 split has a largest category but no strict majority. A tie has no unique line either. Sorting buckets and picking the first one would silently impose a winner; returning only the second bucket would miss other minority categories.

```cypher
// B. Deviations from a strict majority among FOR / AGAINST / ABSTAIN.
MATCH (b:Bill {id: 'demo:bill:1'})<-[:VOTING_ON_BILL]-(s:VotingSession)
MATCH (m:MemberOfParliament)-[v:VOTED]->(s)
MATCH (m)-[membership:MEMBER_OF_FACTION]->(f:Faction)
      -[:IN_PARLIAMENT]->(:Parliament)<-[:IN_PARLIAMENT]-(s)
WHERE membership.validFrom <= s.occurredAt
  AND (membership.validTo IS NULL OR s.occurredAt < membership.validTo)
  AND v.decision IN ['FOR', 'AGAINST', 'ABSTAIN']
WITH DISTINCT b, s, f, m, v.decision AS decision
WITH b, s, f, decision, count(*) AS n,
     collect({id: m.id, name: m.name}) AS members
WITH b, s, f, collect({decision: decision, n: n, members: members}) AS distribution,
     sum(n) AS expressedVotes
WITH b, s, f, distribution, expressedVotes,
     [bucket IN distribution WHERE bucket.n * 2 > expressedVotes] AS majorities
WHERE size(majorities) = 1
WITH b, s, f, distribution, expressedVotes, majorities[0].decision AS majority
UNWIND distribution AS bucket
WITH b, s, f, expressedVotes, majority, bucket
WHERE bucket.decision <> majority
UNWIND bucket.members AS member
RETURN s.id AS rollCall, f.name AS faction, expressedVotes,
       majority AS majorityDecision, bucket.decision AS otherDecision,
       member.id AS mpId, member.name AS mpName
ORDER BY rollCall, faction, mpId;
```

Expected deviations:

| Roll call | Faction | Majority | MP | Recorded decision |
| --- | --- | --- | --- | --- |
| `demo:rc:1` | A | `FOR` | Demo MP 04 | `AGAINST` |
| `demo:rc:2` | B | `AGAINST` | Demo MP 07 | `ABSTAIN` |
| `demo:rc:3` | B | `AGAINST` | Demo MP 04 | `FOR` |

Faction B's three-way split in the first event and Faction A's 1–1 split in the second event produce no majority-deviation rows. No party instruction is inferred. Calling these records “rebellion” would require independent evidence of the faction's intended position, plus a stated policy for abstention and non-participation.

For a period-wide deviation rate, divide an MP's deviations by the number of events where that MP had an expressed decision **and** their faction had a defined majority under the same rule. Publish the denominator and missing-data coverage alongside the percentage.

### C. Which MPs recorded similar decisions?

Compare only shared roll calls with expressed decisions from both MPs. Otherwise, two people with many missing records can appear artificially close:

```cypher
// C. Pairwise agreement, excluding ABSENT / NOT_VOTING and retaining overlap size.
MATCH (b:Bill {id: 'demo:bill:1'})<-[:VOTING_ON_BILL]-(s:VotingSession)
MATCH (a:MemberOfParliament)-[va:VOTED]->(s)<-[vb:VOTED]-(other:MemberOfParliament)
WHERE a.id < other.id
  AND va.decision IN ['FOR', 'AGAINST', 'ABSTAIN']
  AND vb.decision IN ['FOR', 'AGAINST', 'ABSTAIN']
WITH a, other, count(*) AS comparableRollCalls,
     sum(CASE WHEN va.decision = vb.decision THEN 1 ELSE 0 END) AS agreements
WHERE comparableRollCalls >= 2
RETURN a.name AS mpA, other.name AS mpB, comparableRollCalls, agreements,
       round(100.0 * agreements / comparableRollCalls, 1) AS agreementPercent
ORDER BY agreementPercent DESC, comparableRollCalls DESC, mpA, mpB;
```

The fixture's two-event minimum keeps this example visible; a real analysis needs a larger, justified overlap threshold and a declared time window. Demo MPs 02 and 03 agree on both comparable events: **100% with overlap 2**. MP 03's absence in the middle event is excluded rather than treated as agreement or disagreement.

Matching a popular position can produce high agreement between otherwise unrelated MPs. Bill mix, repeated amendment votes, and agenda selection also affect the result. Agreement is a descriptive measure, not evidence of coordination. Before projecting an agreement network, decide whether every roll call should receive equal weight or whether a bill with hundreds of amendments should contribute less weight per event.

### D. Did the import cover the eligible roster?

Use mandates valid at the event time to define the expected population. Do not use today's membership count for a historical vote:

```cypher
// D. Import coverage relative to mandates active at the event time.
MATCH (s:VotingSession {id: 'demo:rc:2'})-[:IN_PARLIAMENT]->(p:Parliament)
MATCH (m:MemberOfParliament)-[t:HOLDS_MANDATE]->(p)
WHERE t.validFrom <= s.occurredAt
  AND (t.validTo IS NULL OR s.occurredAt < t.validTo)
WITH DISTINCT s, m
OPTIONAL MATCH (m)-[v:VOTED]->(s)
RETURN s.id AS rollCall, count(DISTINCT m) AS eligibleMPs,
       count(v) AS recordedOutcomes,
       sum(CASE WHEN v IS NULL THEN 1 ELSE 0 END) AS missingOutcomes,
       sum(CASE WHEN v.decision = 'ABSENT' THEN 1 ELSE 0 END) AS explicitAbsences,
       sum(CASE WHEN v.decision = 'NOT_VOTING' THEN 1 ELSE 0 END) AS explicitNonVotes;
```

The fixture returns **7 eligible MPs, 7 recorded outcomes, 0 missing outcomes, 1 explicit absence, and 1 explicit non-vote**. This measures ingestion coverage. It is not a physical-attendance measure and does not prove that the upstream source itself is complete. If a source omits categories by design, document that contract before reconciling totals.

For real roll calls, also compare the imported five-category distribution against the source's corresponding totals. Check which categories the displayed “total” includes; do not assume absence is included. Keep roll-call outcomes and bill status separate, and preserve the official outcome rather than reconstructing legal passage from an unstated threshold.

## Check the graph before interpreting it

Query correctness depends on graph invariants. Two short checks expose errors that can otherwise look like political findings.

### Find overlapping faction memberships

```cypher
MATCH (m:MemberOfParliament)-[a:MEMBER_OF_FACTION]->(fa:Faction)
MATCH (m)-[b:MEMBER_OF_FACTION]->(fb:Faction)
WHERE a.id < b.id
  AND EXISTS {
    MATCH (fa)-[:IN_PARLIAMENT]->(p:Parliament)<-[:IN_PARLIAMENT]-(fb)
  }
  AND (a.validTo IS NULL OR b.validFrom < a.validTo)
  AND (b.validTo IS NULL OR a.validFrom < b.validTo)
RETURN m.id AS mpId, fa.id AS firstFaction, fb.id AS secondFaction,
       a.validFrom AS firstStart, b.validFrom AS secondStart;
```

The half-open comparison allows adjacent memberships at a transfer boundary. Run separate validation for missing interval starts, ends before starts, and memberships outside the person's mandate. Do not use overlap queries to repair records automatically: conflicting sources may require review.

### Find duplicate or malformed outcomes

```cypher
MATCH (m:MemberOfParliament)-[v:VOTED]->(s:VotingSession)
WITH m, s, count(v) AS relationships,
     collect(v.id) AS ids, collect(v.decision) AS decisions
WHERE relationships <> 1
   OR size(ids) <> relationships
   OR size(decisions) <> relationships
   OR any(id IN ids WHERE id <> m.id + '|' + s.id)
   OR any(d IN decisions WHERE NOT d IN
      ['FOR', 'AGAINST', 'ABSTAIN', 'NOT_VOTING', 'ABSENT'])
RETURN m.id AS mpId, s.id AS rollCall, relationships, ids, decisions;
```

`collect` excludes nulls, so the size checks also detect missing keys and decisions. A unique `VOTED.id` alone cannot prevent two relationships between the same endpoints if a writer supplies two different IDs. Canonical key validation closes that gap.

The runnable examples should be checked in a clean database, then rerun to verify stable entity and relationship counts. Useful regression cases include a corrected decision, a missing endpoint, a three-way tie, several minority categories, a transfer-boundary event, and a missing vote that remains distinguishable from an explicit absence.

## Build a source-backed ingestion pipeline

A dependable real-data pipeline has three layers:

```text
Official resources -> immutable raw snapshots -> validated normalized records -> Neo4j
```

Start with the [official MP catalogue](https://data.rada.gov.ua/open/data/mps-skl9) and its [original roster dataset](https://data.rada.gov.ua/open/data/mps-data_orig_skl9). Follow the listed resources, record their actual headers and identifiers, and map them into your contract. The portal lists several formats, but a catalogue page is not a promise of a single stable JSON API. Historical affiliation requires the [transition resources](https://data.rada.gov.ua/open/data/mps-trans) or other dated source evidence. Roll-call records and [bill cards](https://itd.rada.gov.ua/billinfo/Bills/Card/3240) supply separate event and legislative identities.

For each downloaded resource, retain its URI, retrieval time, content hash, parser version, and original bytes. In normalized records, distinguish the time a fact applies from the time it was observed:

| Field | Meaning |
| --- | --- |
| `occurredAt` | When the roll call happened |
| `validFrom` / `validTo` | When a membership or mandate applies |
| `observedAt` | When this source revision was retrieved |
| `createdAt` | When the local graph record was first created |
| `sourceUri` / raw hash | Which evidence supports the imported value |

`observedAt` on an updated relationship does not preserve its earlier value. If you need to answer “what did the dataset say last month?”, keep immutable observations or revisions as additional nodes and derive the current projection from them. This separates changes in parliamentary reality from corrections in the source or parser.

Do not close a mandate or membership merely because a row vanished from one download. First establish that the snapshot is complete and that disappearance has that meaning in the source contract. Handle unavailable resources as ingestion failures with recorded coverage, and retain the last successful snapshot with its timestamp.

For corrections, stage records and validate the batch before updating the analytical projection. A later download is not automatically a more authoritative account of an older event; define source priority and revision handling explicitly. Track accepted, rejected, unresolved, and expected records for every import run.

### Extend the graph where the evidence supports it

Bill sponsorship can become `(Person)-[:SPONSORED]->(Bill)` with the source's initiator role and provenance. Keep committee referral such as `(Bill)-[:REFERRED_TO]->(ParliamentaryCommittee)` separate from an MP's committee membership. Add a `PlenarySitting` when you need a sitting-level chronology, and amendment nodes when the motion's target needs more detail than a text property.

Those extensions allow questions such as whether a member supported legislation they sponsored, how faction alignment changed over time, or how committee responsibility intersects with voting. Each question still needs its own event selection, historical membership join, completeness checks, and explicit denominator. The graph makes those relationships navigable; the evidence and definitions make the resulting analysis defensible.
