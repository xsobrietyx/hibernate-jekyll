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
