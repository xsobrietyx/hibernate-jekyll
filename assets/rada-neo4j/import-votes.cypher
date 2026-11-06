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
