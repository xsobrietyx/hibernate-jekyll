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
