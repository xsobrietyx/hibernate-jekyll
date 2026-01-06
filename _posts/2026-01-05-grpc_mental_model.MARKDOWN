---
layout: post
title: "gRPC mental model: When to choose what."
url: /grpc_mental_model
file_name: grpc_mental_model
---

Here’s the mental model: default gRPC is “one request, one response.” Streaming turns the RPC into a long-lived channel where multiple messages can flow over time (in one or both directions) on the same call.

Below is event flow + data flow for each style.

---

## 1) Unary (default request/response)

*Use when:* you can compute the full answer from one input and return it once.

### Event flow

* client opens RPC
* client sends exactly 1 request message
* server processes
* server sends exactly 1 response message
* server ends RPC (status OK / error)

### Data flow diagram

```text
Client                                   Server
  |                                        |
  |  req: GetUser(id=42) ----------------> |
  |                                        |  (process)
  |  <------------------ resp: User(...)   |
  |  <------------------ status: OK        |
  |                                        |
```

### Key characteristics

* very simple error model: either you get a response or you get an error
* latency: you wait until the server is done to get anything back
* backpressure is mostly “implicit” (the single response fits or the call fails)

---

## 2) Streaming in gRPC (three variants)

Streaming means the RPC is still “one call,” but inside that call you send/receive multiple *messages* over time.

Think: “HTTP request/response” vs “a WebSocket session,” but with gRPC semantics.

### Shared concepts (all streaming modes)

* The call stays open until one side “half-closes” (finishes sending) and the server ends the call with a final status.
* Each message is framed (you get message boundaries, not a raw byte stream).
* Flow control/backpressure exists: if the receiver is slow, the sender can be forced to slow down (important for event-style systems).

---

## 2a) Server-streaming

*Use when:* client asks once, server emits many results incrementally (progress updates, logs, pagination without pages, watch APIs).

### Event flow

* client sends 1 request
* server sends N responses over time
* server ends RPC (final status)

### Data flow diagram

```text
Client                                   Server
  |                                        |
  |  req: ListEvents(topic="A") ---------> |
  |                                        |
  |  <------------------ event #1          |
  |  <------------------ event #2          |
  |  <------------------ event #3          |
  |                 ...                    |
  |  <------------------ status: OK        |
  |                                        |
```

### What’s different vs unary

* client can start acting on early results immediately (lower perceived latency)
* server controls pacing (but respects backpressure)

---

## 2b) Client-streaming

*Use when:* client has many chunks/items to send, server returns one final aggregate result (upload, batch write, analytics, ingest).

### Event flow

* client sends N request messages over time
* client finishes sending (half-close)
* server processes and sends 1 response
* server ends RPC

### Data flow diagram

```text
Client                                   Server
  |                                        |
  |  req chunk #1 -----------------------> |
  |  req chunk #2 -----------------------> |
  |  req chunk #3 -----------------------> |
  |                 ...                    |
  |  (client half-close / done sending)    |
  |                                        | (finalize)
  |  <------------------ resp: Summary     |
  |  <------------------ status: OK        |
```

### What’s different vs unary

* you don’t need to buffer all input client-side before sending
* server typically can process incrementally (streaming ingestion)

---

## 2c) Bidirectional streaming (bidi)

*Use when:* both sides send many messages, independently, over time (chat, real-time control plane, subscription with acks, interactive pipelines).

### Event flow

* both sides can send messages at any time
* either side can finish sending (half-close)
* server ends call with final status when done

### Data flow diagram (interleaved)

```text
Client                                   Server
  |                                        |
  |  msg: SUBSCRIBE(topic="A") --------->  |
  |  msg: ACK_MODE=batched --------------> |
  |                                        |
  |  <------------------ msg: event #1     |
  |  msg: ack(event #1) ---------------->  |
  |  <------------------ msg: event #2     |
  |  <------------------ msg: event #3     |
  |  msg: ack(event #2) ---------------->  |
  |                 ...                    |
  |  (client half-close)                   |
  |  <------------------ status: OK        |
```

### What’s different vs unary

* it’s not “request then response”; it’s a session
* the flow is a conversation; message order can be interleaved
* best for event-driven patterns (pub/sub-ish), but with stronger contracts and backpressure

---

## 3) Event flow differences in one glance

```text
Unary:
  C: [REQ] --------------------> S
  C: <------------------ [RESP] S
  C: <---------------- [STATUS] S

Server-stream:
  C: [REQ] --------------------> S
  C: <------------ [RESP1..N]   S
  C: <---------------- [STATUS] S

Client-stream:
  C: [REQ1..N] ----------------> S
  C: (done sending)             S
  C: <------------------ [RESP] S
  C: <---------------- [STATUS] S

Bidi:
  C: [MSG...] <---------------> S   (both directions, anytime)
  C: <---------------- [STATUS] S   (final)
```

---

## 4) Data flow and backpressure intuition

With unary, you mostly care about:

* request size limit
* response size limit
* timeouts

With streaming, you also care about:

* **rate** (messages/sec)
* **buffering** (how many messages can queue in memory)
* **flow control** (receiver can slow sender)
* **cancellation** (client stops early; server should stop work)

Streaming is often the “safer” way to ship large or unbounded datasets because you can process incrementally and naturally apply backpressure.

---

## 5) Practical decision guide

* Use **unary** when the interaction is naturally a single answer (CRUD, simple queries).
* Use **server-streaming** for “watch / tail / list as it grows / progress updates.”
* Use **client-streaming** for “upload / batch ingest / send many measurements.”
* Use **bidi** for “interactive session” (events + acks, chat, coordination, realtime control).

If you tell me your specific use case (e.g., “recommendations,” “events dedup,” “watch etcd-like changes”), I can map it to the right RPC type and show a proto sketch plus the exact event lifecycle (half-close, cancellation, retry semantics).
