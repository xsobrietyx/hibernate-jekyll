---
layout: post
title: Common HashMap (hash table) algorithms
url: /hash_table_algorithms
file_name: hash_table_algorithms
---

Below you’ll find a **comprehensive overview** of common **HashMap (hash table) algorithms**, including:

1. **Algorithmic background** of three popular designs:
   - **Separate Chaining**  
   - **Linear Probing (Open Addressing)**  
   - **Cuckoo Hashing**  
2. **Implementation examples** in **Go** and **Rust**, with:
   - **Unit tests**  
   - **Runbook** (setup, usage, troubleshooting)  
   - **Documentation** with **ASCII diagrams** comparing each approach  

> **Note**: In practice, most standard libraries (e.g., Go’s built-in `map`, Rust’s `std::collections::HashMap`) already use optimized hashing strategies. The examples here are primarily educational to illustrate how these algorithms can be built from scratch.

---

# Table of Contents

- [Table of Contents](#table-of-contents)
- [1. Overview of HashMap Algorithms](#1-overview-of-hashmap-algorithms)
  - [1.1 Separate Chaining](#11-separate-chaining)
  - [1.2 Linear Probing (Open Addressing)](#12-linear-probing-open-addressing)
  - [1.3 Cuckoo Hashing](#13-cuckoo-hashing)
- [2. ASCII Diagram Comparison](#2-ascii-diagram-comparison)
    - [2.1 Separate Chaining](#21-separate-chaining)
    - [2.2 Linear Probing](#22-linear-probing)
    - [2.3 Cuckoo Hashing](#23-cuckoo-hashing)
- [3. Go Implementations](#3-go-implementations)
  - [3.1 Directory \& File Structure](#31-directory--file-structure)
  - [3.2 Separate Chaining in Go](#32-separate-chaining-in-go)
    - [`chain.go`](#chaingo)
  - [3.3 Linear Probing in Go](#33-linear-probing-in-go)
    - [`linear.go`](#lineargo)
  - [3.4 Cuckoo Hashing in Go](#34-cuckoo-hashing-in-go)
    - [`cuckoo.go`](#cuckoogo)
  - [3.5 Go Unit Tests](#35-go-unit-tests)
    - [Example test file for **Separate Chaining** (`chain_test.go`)](#example-test-file-for-separate-chaining-chain_testgo)
  - [3.6 Go Runbook](#36-go-runbook)
    - [3.6.1 Prerequisites](#361-prerequisites)
    - [3.6.2 Setup](#362-setup)
    - [3.6.3 Building \& Testing](#363-building--testing)
    - [3.6.4 Usage / Example](#364-usage--example)
    - [3.6.5 Troubleshooting](#365-troubleshooting)
- [4. Rust Implementations](#4-rust-implementations)
  - [4.1 Directory \& File Structure](#41-directory--file-structure)
  - [4.2 Separate Chaining in Rust](#42-separate-chaining-in-rust)
    - [`src/chaining.rs`](#srcchainingrs)
  - [4.3 Linear Probing in Rust](#43-linear-probing-in-rust)
    - [`src/linear.rs`](#srclinearrs)
  - [4.4 Cuckoo Hashing in Rust](#44-cuckoo-hashing-in-rust)
    - [`src/cuckoo.rs`](#srccuckoors)
  - [4.5 Rust Unit Tests](#45-rust-unit-tests)
    - [Example: `tests/test_chaining.rs`](#example-teststest_chainingrs)
  - [4.6 Rust Runbook](#46-rust-runbook)
    - [4.6.1 Prerequisites](#461-prerequisites)
    - [4.6.2 Setup](#462-setup)
    - [4.6.3 Testing](#463-testing)
    - [4.6.4 Usage](#464-usage)
    - [4.6.5 Troubleshooting](#465-troubleshooting)
- [5. Performance \& Suitability](#5-performance--suitability)
- [6. Conclusion](#6-conclusion)

---

<a name="overview"></a>

# 1. Overview of HashMap Algorithms

In any **hash table**, we take a **key**, compute a **hash** function, and map it to an array index. The challenge is **collision handling**: multiple different keys might hash to the same index. The solutions differ in how collisions are resolved:

---

<a name="separate-chaining"></a>

## 1.1 Separate Chaining

1. **Method**: Each array slot (called a bucket) holds a **linked list** (or another structure) of key–value pairs that map to that slot.  
2. **Insertion**:  
   - Compute `index = hash(key) % capacity`.  
   - Append the `(key, value)` to the linked list at `buckets[index]`.  
3. **Lookup**:  
   - Go to `buckets[index]`.  
   - Search linearly in the linked list for the key.  
4. **Deletion**:  
   - Find the node in the linked list and remove it.  

**Pros**:

- Simple to implement.  
- Easy to resize (rehash into a new table if needed).  

**Cons**:

- Extra overhead of pointers in the linked list.  
- Performance degrades if many collisions occur (long chains).

**Complexity**:

- Average: \(O(1)\) for insert/lookup/delete.  
- Worst case: \(O(n)\) if all keys collide in the same bucket.

---

<a name="linear-probing"></a>

## 1.2 Linear Probing (Open Addressing)

1. **Method**: Store each `(key, value)` directly in the array. If the computed index is occupied, **probe** the next index `(index + 1) % capacity` until an empty slot is found (or the key is found).  
2. **Insertion**:  
   - Compute `index = hash(key) % capacity`.  
   - If `slot[index]` is occupied by a different key, keep moving to `index+1, index+2, ...` until you find an empty slot or the same key.  
3. **Lookup**:  
   - Similarly, keep probing until either you find the key or reach an empty slot that indicates the key is not present.  
4. **Deletion**:  
   - A special “tombstone” marker is often used to indicate a deleted slot so that future lookups don’t stop prematurely.

**Pros**:

- Often better cache locality than separate chaining (keys stored contiguously).  
- No extra pointers for lists.  

**Cons**:

- **Clustering**: Once collisions start, a cluster of occupied slots forms, leading to more collisions.  
- Handling deletion is trickier.  

**Complexity**:

- Average: \(O(1)\), but can degrade with increased load factor.  
- Worst: \(O(n)\) in bad collisions.

---

<a name="cuckoo-hashing"></a>

## 1.3 Cuckoo Hashing

1. **Method**: Use **two (or more) hash functions**. Each key can reside in one of two possible positions. If a position is occupied, **kick out** the occupant (the “cuckoo” approach) and reinsert that occupant in its alternate location.  
2. **Insertion**:
   - Place the key in `table[hash1(key)]`.  
   - If that spot is taken, relocate the existing occupant to its alternate spot `table[hash2(occupant)]`.  
   - This might cascade, potentially re-inserting multiple keys.  
   - If it loops too long (suggesting cycles), **resize** or rehash.  
3. **Lookup**:
   - Check `table[hash1(key)]`. If not found, check `table[hash2(key)]`.  
4. **Deletion**:
   - Remove the key from whichever position it occupies.  

**Pros**:

- **Worst-case** \(O(1)\) lookups: only two lookups needed (with 2-hash cuckoo).  
- Great for static or mostly read-only sets.  

**Cons**:

- Insertion can degrade if many displacements or cycles occur.  
- Potentially more complex to implement.  

**Complexity**:

- Lookup: Worst-case \(O(1)\) (2 checks).  
- Insertion: Amortized \(O(1)\), but can be large if many displacements or a rehash is triggered.

---

<a name="ascii-diagrams"></a>

# 2. ASCII Diagram Comparison

Below are simplified ASCII sketches of how collisions are handled in each approach.

### 2.1 Separate Chaining

```text
Table (array) of buckets:
Index 0  ---> [ (K0, V0) ] -> [ (K1, V1) ] -> ...
Index 1  ---> [ (K2, V2) ]
Index 2  ---> [ (K3, V3) ] -> [ (K4, V4) ]
...
```

A linked list (or chain) at each index. Collisions append to the list.

---

### 2.2 Linear Probing

```text
 Table array (all in one contiguous area):

   [ 0 ]  [ 1 ]    [ 2 ]   [ 3 ]   [ 4 ]  ...
    K0     K1       -        -      K2
                        (empty slots)
 Insert new key K3, hashed to index 2, but 2 is empty => place it there.

 If index 2 was occupied, we check 3, then 4, etc. (wrap around).
```

---

### 2.3 Cuckoo Hashing

```text
 Two tables or two possible positions in a single array:

 Position1 = hash1(K), Position2 = hash2(K)

 TABLE:
 Index:   0   1   2    3   4  ...
         K0       K1
   alt slot for K0 ->  (some other index) 
   alt slot for K1 ->  (some other index)

 If there's a collision at an index, you "kick out" the occupant to its alternative location.
 Possibly triggers a chain of reinsertions.
```

---

<a name="go-implementations"></a>

# 3. Go Implementations

Below we present minimal, educational “toy” versions. They’re not production-optimized but will illustrate the core logic.

<a name="go-structure"></a>

## 3.1 Directory & File Structure

```text
go-hashmaps/
├── go.mod
├── go.sum
├── chain/
│   ├── chain.go
│   └── chain_test.go
├── linear/
│   ├── linear.go
│   └── linear_test.go
└── cuckoo/
    ├── cuckoo.go
    └── cuckoo_test.go
```

*(You can combine them into one module or separate modules as you prefer.)*

---

<a name="go-chaining"></a>

## 3.2 Separate Chaining in Go

### `chain.go`

```go
package chain

import "fmt"

// Entry represents a single key-value pair in the chain
type Entry struct {
    Key   string
    Value interface{}
    Next  *Entry
}

type HashMap struct {
    buckets []*Entry
    size    int
}

func NewHashMap(capacity int) *HashMap {
    if capacity < 1 {
        capacity = 8
    }
    return &HashMap{
        buckets: make([]*Entry, capacity),
    }
}

// Simple string hash
func hash(s string) int {
    h := 0
    for i := 0; i < len(s); i++ {
        h = 31*h + int(s[i])
    }
    return h
}

func (hm *HashMap) getBucketIndex(key string) int {
    return (hash(key) & 0x7fffffff) % len(hm.buckets)
}

func (hm *HashMap) Put(key string, value interface{}) {
    idx := hm.getBucketIndex(key)
    head := hm.buckets[idx]
    
    // Check if key already exists
    for e := head; e != nil; e = e.Next {
        if e.Key == key {
            e.Value = value
            return
        }
    }
    
    // Insert at head of the chain
    newEntry := &Entry{Key: key, Value: value, Next: head}
    hm.buckets[idx] = newEntry
    hm.size++
    // (Optional) check load factor & resize if needed
}

func (hm *HashMap) Get(key string) (interface{}, bool) {
    idx := hm.getBucketIndex(key)
    for e := hm.buckets[idx]; e != nil; e = e.Next {
        if e.Key == key {
            return e.Value, true
        }
    }
    return nil, false
}

func (hm *HashMap) Delete(key string) bool {
    idx := hm.getBucketIndex(key)
    curr := hm.buckets[idx]
    var prev *Entry
    
    for curr != nil {
        if curr.Key == key {
            // remove this entry
            if prev == nil {
                hm.buckets[idx] = curr.Next
            } else {
                prev.Next = curr.Next
            }
            hm.size--
            return true
        }
        prev = curr
        curr = curr.Next
    }
    return false
}

func (hm *HashMap) Len() int {
    return hm.size
}

// For debugging
func (hm *HashMap) String() string {
    return fmt.Sprintf("SeparateChainingHashMap(size=%d, capacity=%d)", hm.size, len(hm.buckets))
}
```

---

<a name="go-linear-probing"></a>

## 3.3 Linear Probing in Go

### `linear.go`

```go
package linear

import "fmt"

type pair struct {
    key   string
    value interface{}
}

// We'll use a special key for tombstones
const tombstone = "<TOMBSTONE>"

// LinearHashMap is a simplistic open-addressed hash map
type LinearHashMap struct {
    table     []pair
    size      int
    capacity  int
    threshold float64 // load factor threshold
}

func NewLinearHashMap(cap int) *LinearHashMap {
    if cap < 1 {
        cap = 8
    }
    return &LinearHashMap{
        table:     make([]pair, cap),
        capacity:  cap,
        threshold: 0.75,
    }
}

func (m *LinearHashMap) Put(key string, value interface{}) {
    if float64(m.size)/float64(m.capacity) > m.threshold {
        m.resize()
    }
    idx := m.findSlot(key)
    if m.table[idx].key == "" || m.table[idx].key == tombstone {
        m.size++
    }
    m.table[idx].key = key
    m.table[idx].value = value
}

func (m *LinearHashMap) Get(key string) (interface{}, bool) {
    idx := m.findKey(key)
    if idx < 0 {
        return nil, false
    }
    return m.table[idx].value, true
}

func (m *LinearHashMap) Delete(key string) bool {
    idx := m.findKey(key)
    if idx < 0 {
        return false
    }
    m.table[idx].key = tombstone
    m.table[idx].value = nil
    m.size--
    return true
}

func (m *LinearHashMap) findKey(key string) int {
    cap := len(m.table)
    start := hash(key) & 0x7fffffff % cap
    for i := 0; i < cap; i++ {
        idx := (start + i) % cap
        if m.table[idx].key == "" {
            // Empty slot => key not found
            return -1
        }
        if m.table[idx].key == key {
            return idx
        }
        // if tombstone => keep searching
    }
    return -1
}

func (m *LinearHashMap) findSlot(key string) int {
    cap := len(m.table)
    start := hash(key) & 0x7fffffff % cap
    tombstoneIndex := -1
    for i := 0; i < cap; i++ {
        idx := (start + i) % cap
        k := m.table[idx].key
        if k == "" {
            // empty slot, use it
            return idx
        }
        if k == tombstone && tombstoneIndex < 0 {
            tombstoneIndex = idx
        }
        if k == key {
            // key found => overwrite
            return idx
        }
    }
    // if we found a tombstone along the way, use that
    if tombstoneIndex != -1 {
        return tombstoneIndex
    }
    // fallback, no slot (rare if resize is used properly)
    return -1
}

// simple string hash
func hash(s string) int {
    h := 0
    for i := 0; i < len(s); i++ {
        h = 31*h + int(s[i])
    }
    return h
}

func (m *LinearHashMap) resize() {
    oldTable := m.table
    newCap := m.capacity * 2
    m.table = make([]pair, newCap)
    m.capacity = newCap
    m.size = 0
    for _, p := range oldTable {
        if p.key != "" && p.key != tombstone {
            m.Put(p.key, p.value)
        }
    }
}

// For debugging
func (m *LinearHashMap) String() string {
    return fmt.Sprintf("LinearProbingHashMap(size=%d, capacity=%d)", m.size, m.capacity)
}

func (m *LinearHashMap) Len() int {
    return m.size
}
```

---

<a name="go-cuckoo"></a>

## 3.4 Cuckoo Hashing in Go

We’ll implement a **two-table** variant. Each key can be in table A or table B.

### `cuckoo.go`

```go
package cuckoo

import "fmt"

type entry struct {
    key   string
    value interface{}
}

type CuckooHashMap struct {
    table1    []entry
    table2    []entry
    size      int
    capacity  int
    threshold float64
}

func NewCuckooHashMap(capacity int) *CuckooHashMap {
    if capacity < 2 {
        capacity = 8
    }
    return &CuckooHashMap{
        table1:    make([]entry, capacity),
        table2:    make([]entry, capacity),
        capacity:  capacity,
        threshold: 0.75,
    }
}

func (c *CuckooHashMap) Put(key string, val interface{}) {
    load := float64(c.size) / float64(c.capacity)
    if load > c.threshold {
        c.resize()
    }
    c.insert(key, val, 0)
}

func (c *CuckooHashMap) insert(key string, val interface{}, depth int) {
    if depth > c.capacity {
        // cycle? => rehash
        c.rehash()
        c.insert(key, val, 0)
        return
    }
    idx1 := hash1(key) % c.capacity
    if c.table1[idx1].key == "" {
        c.table1[idx1] = entry{key, val}
        c.size++
        return
    }
    // If the key matches, update
    if c.table1[idx1].key == key {
        c.table1[idx1].value = val
        return
    }
    // Kick out occupant
    e := c.table1[idx1]
    c.table1[idx1] = entry{key, val}
    // re-insert occupant in table2
    idx2 := hash2(e.key) % c.capacity
    if c.table2[idx2].key == "" {
        c.table2[idx2] = e
        // no size++ because we're replacing
        return
    }
    if c.table2[idx2].key == e.key {
        c.table2[idx2].value = e.value
        return
    }
    kicked := c.table2[idx2]
    c.table2[idx2] = e
    // recursively re-insert kicked occupant
    c.insert(kicked.key, kicked.value, depth+1)
}

func (c *CuckooHashMap) Get(key string) (interface{}, bool) {
    idx1 := hash1(key) % c.capacity
    if c.table1[idx1].key == key {
        return c.table1[idx1].value, true
    }
    idx2 := hash2(key) % c.capacity
    if c.table2[idx2].key == key {
        return c.table2[idx2].value, true
    }
    return nil, false
}

func (c *CuckooHashMap) Delete(key string) bool {
    idx1 := hash1(key) % c.capacity
    if c.table1[idx1].key == key {
        c.table1[idx1] = entry{}
        c.size--
        return true
    }
    idx2 := hash2(key) % c.capacity
    if c.table2[idx2].key == key {
        c.table2[idx2] = entry{}
        c.size--
        return true
    }
    return false
}

func (c *CuckooHashMap) Len() int {
    return c.size
}

func (c *CuckooHashMap) resize() {
    oldTable1 := c.table1
    oldTable2 := c.table2
    newCap := c.capacity * 2
    c.table1 = make([]entry, newCap)
    c.table2 = make([]entry, newCap)
    c.capacity = newCap
    c.size = 0
    // re-insert all
    for _, e := range oldTable1 {
        if e.key != "" {
            c.insert(e.key, e.value, 0)
        }
    }
    for _, e := range oldTable2 {
        if e.key != "" {
            c.insert(e.key, e.value, 0)
        }
    }
}

func (c *CuckooHashMap) rehash() {
    // simplistic approach: just resize
    c.resize()
}

// two different hash funcs
func hash1(s string) int {
    h := 0
    for i := 0; i < len(s); i++ {
        h = 31*h + int(s[i])
    }
    return h & 0x7fffffff
}

func hash2(s string) int {
    h := 0
    for i := 0; i < len(s); i++ {
        h = 131*h + int(s[i])
    }
    return h & 0x7fffffff
}

func (c *CuckooHashMap) String() string {
    return fmt.Sprintf("CuckooHashMap(size=%d, capacity=%d)", c.size, c.capacity)
}
```

---

<a name="go-tests"></a>

## 3.5 Go Unit Tests

### Example test file for **Separate Chaining** (`chain_test.go`)

```go
package chain

import "testing"

func TestHashMap_Chaining(t *testing.T) {
    hm := NewHashMap(4)
    hm.Put("apple", 1)
    hm.Put("banana", 2)
    
    v, ok := hm.Get("apple")
    if !ok || v.(int) != 1 {
        t.Errorf("Expected apple=1, got %v", v)
    }
    
    v2, ok2 := hm.Get("banana")
    if !ok2 || v2.(int) != 2 {
        t.Errorf("Expected banana=2, got %v", v2)
    }
    
    hm.Put("banana", 3)
    v3, _ := hm.Get("banana")
    if v3.(int) != 3 {
        t.Errorf("Expected banana=3 after update, got %v", v3)
    }
    
    // Test Delete
    delOK := hm.Delete("apple")
    if !delOK {
        t.Error("Expected to delete apple successfully")
    }
    _, okDel := hm.Get("apple")
    if okDel {
        t.Error("apple should not exist after deletion")
    }
}
```

> Similar tests can be written for **Linear** and **Cuckoo** hash maps.  

---

<a name="go-runbook"></a>

## 3.6 Go Runbook

### 3.6.1 Prerequisites

- **Go 1.18+** (any modern version should work)

### 3.6.2 Setup

1. `git clone <repo-url>`  
2. `cd go-hashmaps`  
3. `go mod tidy` (fetch any dependencies, if used)

### 3.6.3 Building & Testing

```bash
go test ./... -v
```

- Runs unit tests across all subdirectories (`chain/`, `linear/`, `cuckoo/`).

### 3.6.4 Usage / Example

These are **library** code examples, not a standalone CLI. You might create a simple `main.go`:

```go
package main

import (
    "fmt"

    "github.com/your-org/go-hashmaps/chain"
)

func main() {
    hm := chain.NewHashMap(8)
    hm.Put("hello", "world")
    val, ok := hm.Get("hello")
    fmt.Println(val, ok)
}
```

Then run:

```bash
go run main.go
```

### 3.6.5 Troubleshooting

- **Hash Collisions**: For a small capacity, collisions are frequent. Increase capacity or adjust load factor / resizing logic.  
- **Performance**: If performance is slow, consider optimizing your hash function or using built-in `map` in production.  
- **Memory**: For separate chaining, large collisions => bigger linked lists => more memory overhead.

---

<a name="rust-implementations"></a>

# 4. Rust Implementations

We’ll create a minimal crate that has a module for each approach.

<a name="rust-structure"></a>

## 4.1 Directory & File Structure

```text
rust-hashmaps/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── chaining.rs
│   ├── linear.rs
│   ├── cuckoo.rs
└── tests/
    ├── test_chaining.rs
    ├── test_linear.rs
    ├── test_cuckoo.rs
```

---

<a name="rust-chaining"></a>

## 4.2 Separate Chaining in Rust

### `src/chaining.rs`

```rust
use std::collections::LinkedList;

#[derive(Debug)]
pub struct ChainingHashMap<K, V> {
    buckets: Vec<LinkedList<(K, V)>>,
    size: usize,
}

impl<K: std::hash::Hash + Eq + Clone, V: Clone> ChainingHashMap<K, V> {
    pub fn new(capacity: usize) -> Self {
        let cap = if capacity < 1 { 8 } else { capacity };
        ChainingHashMap {
            buckets: vec![LinkedList::new(); cap],
            size: 0,
        }
    }

    fn hash_index<Q: std::hash::Hash>(&self, key: &Q) -> usize {
        use std::hash::{BuildHasher, Hasher};
        // Use a default hasher
        let mut hasher = std::collections::hash_map::RandomState::new().build_hasher();
        key.hash(&mut hasher);
        let hash = hasher.finish();
        (hash as usize) % self.buckets.len()
    }

    pub fn put(&mut self, key: K, value: V) {
        let idx = self.hash_index(&key);
        let bucket = &mut self.buckets[idx];
        for &mut (ref existing_key, ref mut existing_val) in bucket.iter_mut() {
            if existing_key == &key {
                *existing_val = value;
                return;
            }
        }
        bucket.push_back((key, value));
        self.size += 1;
        // (Optional) check load factor -> rehash if needed
    }

    pub fn get(&self, key: &K) -> Option<&V> {
        let idx = self.hash_index(key);
        let bucket = &self.buckets[idx];
        for (k, v) in bucket.iter() {
            if k == key {
                return Some(v);
            }
        }
        None
    }

    pub fn delete(&mut self, key: &K) -> bool {
        let idx = self.hash_index(key);
        let bucket = &mut self.buckets[idx];
        let len_before = bucket.len();
        bucket.retain(|(k, _)| k != key);
        let len_after = bucket.len();
        if len_after < len_before {
            self.size -= 1;
            return true;
        }
        false
    }

    pub fn len(&self) -> usize {
        self.size
    }
}
```

---

<a name="rust-linear-probing"></a>

## 4.3 Linear Probing in Rust

### `src/linear.rs`

```rust
#[derive(Clone, Debug)]
pub enum Slot<K, V> {
    Empty,
    Tombstone,
    Occupied(K, V),
}

#[derive(Debug)]
pub struct LinearHashMap<K, V> {
    table: Vec<Slot<K, V>>,
    size: usize,
    capacity: usize,
    load_factor: f64,
}

impl<K: std::hash::Hash + Eq + Clone, V: Clone> LinearHashMap<K, V> {
    pub fn new(capacity: usize) -> Self {
        let cap = if capacity < 1 { 8 } else { capacity };
        LinearHashMap {
            table: vec![Slot::Empty; cap],
            size: 0,
            capacity: cap,
            load_factor: 0.75,
        }
    }

    fn hash_index<Q: std::hash::Hash>(&self, key: &Q, attempt: usize) -> usize {
        // Simple approach: regular hash + linear step
        use std::hash::{BuildHasher, Hasher};
        let mut hasher = std::collections::hash_map::RandomState::new().build_hasher();
        key.hash(&mut hasher);
        let h = hasher.finish() as usize;
        (h + attempt) % self.capacity
    }

    pub fn put(&mut self, key: K, value: V) {
        if (self.size as f64) / (self.capacity as f64) > self.load_factor {
            self.resize();
        }
        let mut attempt = 0;
        loop {
            let idx = self.hash_index(&key, attempt);
            match self.table[idx] {
                Slot::Empty => {
                    self.table[idx] = Slot::Occupied(key, value);
                    self.size += 1;
                    return;
                }
                Slot::Tombstone => {
                    self.table[idx] = Slot::Occupied(key, value);
                    self.size += 1;
                    return;
                }
                Slot::Occupied(ref existing_k, _) if existing_k == &key => {
                    self.table[idx] = Slot::Occupied(key, value);
                    return;
                }
                _ => {
                    attempt += 1;
                    if attempt >= self.capacity {
                        // This shouldn't happen with a good resize strategy
                        panic!("HashMap is full, cannot insert");
                    }
                }
            }
        }
    }

    pub fn get(&self, key: &K) -> Option<&V> {
        let mut attempt = 0;
        loop {
            let idx = self.hash_index(key, attempt);
            match &self.table[idx] {
                Slot::Empty => return None,
                Slot::Tombstone => {},
                Slot::Occupied(k, v) => {
                    if k == key {
                        return Some(v);
                    }
                }
            }
            attempt += 1;
            if attempt >= self.capacity {
                return None;
            }
        }
    }

    pub fn delete(&mut self, key: &K) -> bool {
        let mut attempt = 0;
        loop {
            let idx = self.hash_index(key, attempt);
            match &self.table[idx] {
                Slot::Empty => return false,
                Slot::Occupied(k, _) if k == key => {
                    self.table[idx] = Slot::Tombstone;
                    self.size -= 1;
                    return true;
                }
                _ => {}
            }
            attempt += 1;
            if attempt >= self.capacity {
                return false;
            }
        }
    }

    fn resize(&mut self) {
        let old_table = std::mem::replace(&mut self.table, vec![Slot::Empty; self.capacity * 2]);
        self.capacity *= 2;
        self.size = 0;

        for slot in old_table {
            if let Slot::Occupied(k, v) = slot {
                self.put(k, v);
            }
        }
    }

    pub fn len(&self) -> usize {
        self.size
    }
}
```

---

<a name="rust-cuckoo"></a>

## 4.4 Cuckoo Hashing in Rust

### `src/cuckoo.rs`

```rust
#[derive(Clone, Debug)]
pub struct Entry<K, V> {
    key: K,
    value: V,
}

#[derive(Debug)]
pub struct CuckooHashMap<K, V> {
    table1: Vec<Option<Entry<K, V>>>,
    table2: Vec<Option<Entry<K, V>>>,
    capacity: usize,
    size: usize,
    load_factor: f64,
}

impl<K: std::hash::Hash + Eq + Clone, V: Clone> CuckooHashMap<K, V> {
    pub fn new(capacity: usize) -> Self {
        let cap = if capacity < 2 { 8 } else { capacity };
        CuckooHashMap {
            table1: vec![None; cap],
            table2: vec![None; cap],
            capacity: cap,
            size: 0,
            load_factor: 0.75,
        }
    }

    pub fn put(&mut self, key: K, value: V) {
        if (self.size as f64) / (self.capacity as f64) > self.load_factor {
            self.resize();
        }
        self.insert(key, value, 0);
    }

    fn insert(&mut self, key: K, value: V, depth: usize) {
        if depth > self.capacity {
            // rehash
            self.rehash();
            self.insert(key, value, 0);
            return;
        }
        let idx1 = self.hash1(&key) % self.capacity;
        if self.table1[idx1].is_none() {
            self.table1[idx1] = Some(Entry { key, value });
            self.size += 1;
            return;
        }
        // If same key, update
        if let Some(e) = &mut self.table1[idx1] {
            if e.key == key {
                e.value = value;
                return;
            }
        }

        // Kick out occupant
        let mut kicked = self.table1[idx1].take().unwrap();
        self.table1[idx1] = Some(Entry { key, value });

        let idx2 = self.hash2(&kicked.key) % self.capacity;
        if self.table2[idx2].is_none() {
            self.table2[idx2] = Some(kicked);
            // no size++ since we replaced
            return;
        }
        if let Some(e2) = &mut self.table2[idx2] {
            if e2.key == kicked.key {
                e2.value = kicked.value;
                return;
            }
        }

        let mut occupant = self.table2[idx2].take().unwrap();
        self.table2[idx2] = Some(kicked);
        self.insert(occupant.key.clone(), occupant.value.clone(), depth + 1);
    }

    pub fn get(&self, key: &K) -> Option<&V> {
        let idx1 = self.hash1(key) % self.capacity;
        if let Some(e) = &self.table1[idx1] {
            if &e.key == key {
                return Some(&e.value);
            }
        }
        let idx2 = self.hash2(key) % self.capacity;
        if let Some(e) = &self.table2[idx2] {
            if &e.key == key {
                return Some(&e.value);
            }
        }
        None
    }

    pub fn delete(&mut self, key: &K) -> bool {
        let idx1 = self.hash1(key) % self.capacity;
        if let Some(e) = &self.table1[idx1] {
            if &e.key == key {
                self.table1[idx1] = None;
                self.size -= 1;
                return true;
            }
        }
        let idx2 = self.hash2(key) % self.capacity;
        if let Some(e) = &self.table2[idx2] {
            if &e.key == key {
                self.table2[idx2] = None;
                self.size -= 1;
                return true;
            }
        }
        false
    }

    fn resize(&mut self) {
        let old_table1 = std::mem::replace(&mut self.table1, vec![None; self.capacity * 2]);
        let old_table2 = std::mem::replace(&mut self.table2, vec![None; self.capacity * 2]);
        self.capacity *= 2;
        self.size = 0;

        for e in old_table1.into_iter().chain(old_table2.into_iter()) {
            if let Some(entry) = e {
                self.insert(entry.key, entry.value, 0);
            }
        }
    }

    fn rehash(&mut self) {
        self.resize();
    }

    fn hash1<Q: std::hash::Hash>(&self, key: &Q) -> usize {
        use std::hash::{BuildHasher, Hasher};
        let mut hasher = std::collections::hash_map::RandomState::new().build_hasher();
        key.hash(&mut hasher);
        (hasher.finish() as usize)
    }
    fn hash2<Q: std::hash::Hash>(&self, key: &Q) -> usize {
        use std::hash::{BuildHasher, Hasher};
        let mut hasher = std::collections::hash_map::RandomState::new().build_hasher();
        // A different approach: e.g. we do a shift or prime
        // Just do something slightly different
        key.hash(&mut hasher);
        (hasher.finish() >> 16) as usize
    }

    pub fn len(&self) -> usize {
        self.size
    }
}
```

---

<a name="rust-tests"></a>

## 4.5 Rust Unit Tests

### Example: `tests/test_chaining.rs`

```rust
use rust_hashmaps::chaining::ChainingHashMap;

#[test]
fn test_chaining_hashmap() {
    let mut map = ChainingHashMap::new(4);
    map.put("apple".to_string(), 1);
    map.put("banana".to_string(), 2);

    assert_eq!(map.get(&"apple".to_string()), Some(&1));
    assert_eq!(map.get(&"banana".to_string()), Some(&2));

    map.put("banana".to_string(), 3);
    assert_eq!(map.get(&"banana".to_string()), Some(&3));

    let deleted = map.delete(&"apple".to_string());
    assert!(deleted);
    assert_eq!(map.get(&"apple".to_string()), None);

    assert_eq!(map.len(), 1);
}
```

*(Similar test files for `test_linear.rs` and `test_cuckoo.rs`.)*

> Then run:

```bash
cargo test
```

---

<a name="rust-runbook"></a>

## 4.6 Rust Runbook

### 4.6.1 Prerequisites

- **Rust 1.65+** (or any recent stable)

### 4.6.2 Setup

1. `git clone <repo-url>`  
2. `cd rust-hashmaps`  
3. `cargo build`  

### 4.6.3 Testing

```bash
cargo test
```

- Runs tests in the `tests/` folder and any `#[cfg(test)]` in `src/`.

### 4.6.4 Usage

- These modules are typically used as **libraries**:

```rust
use rust_hashmaps::chaining::ChainingHashMap;

fn main() {
    let mut hm = ChainingHashMap::new(8);
    hm.put("key".to_string(), "value".to_string());
    println!("{:?}", hm.get(&"key".to_string()));
}
```

- Then `cargo run --example` or create your own `main.rs`.

### 4.6.5 Troubleshooting

- **Infinite loops** in cuckoo hashing can indicate cycles or very high collision => the code triggers `rehash()`.  
- **Resize needed** if you see “HashMap is full” or excessive collisions.  
- **Performance** can degrade if your keys are poorly hashed or if you have a **very high** load factor.

---

<a name="performance-suitability"></a>

# 5. Performance & Suitability

| Algorithm          | Average Insert | Average Lookup | Deletion        | Worst Case     | Memory Overhead   | Complexity Notes                                          |
|--------------------|----------------|---------------|-----------------|----------------|-------------------|-----------------------------------------------------------|
| **Separate Chaining**  | O(1)     | O(1)      | O(1)       | O(n)     | Extra for linked list   | Can degrade if many items fall into the same bucket chain |
| **Linear Probing**     | O(1)     | O(1)      | O(1) (with tombstones) | O(n) | Contiguous table size   | Clustering can hurt performance as load factor grows      |
| **Cuckoo Hashing**     | O(1)     | O(1) (2 checks) | O(1)     | Potential rehash overhead | 2 tables, or more       | Insertion can trigger multiple displacements or rehash    |

In real-world usage, many hash map implementations (like **Rust’s `std::collections::HashMap`** or **Go’s built-in `map`**) combine open addressing with advanced strategies (Robin Hood hashing, XOR-based hashing, etc.) for performance.  

---

<a name="conclusion"></a>

# 6. Conclusion

We’ve explored **three major collision-handling strategies** for HashMaps:

1. **Separate Chaining**: Simple, easy to implement, but can have extra memory usage.  
2. **Linear Probing** (Open Addressing): Great cache locality but can suffer from clustering.  
3. **Cuckoo Hashing**: Worst-case \(O(1)\) lookups with two positions, but insertions may cause multiple displacements.

Each has **trade-offs** in performance, memory overhead, and implementation complexity. The provided **Go** and **Rust** examples (plus **ASCII diagrams**, **unit tests**, and **runbooks**) illustrate how to build each from scratch. In production, you’d typically rely on well-tested standard library structures—but the knowledge of these algorithms is valuable for specialized or educational use cases.
