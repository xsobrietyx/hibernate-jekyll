---
layout: post
title: Commonly used CS algorithms overview
url: /commonly_used_algorithms
file_name: commonly_used_algorithms
---

# Below is a curated overview of **some** of the most commonly used computer science algorithms. (It’s practically impossible to list *all* algorithms in a single blog post, so this focuses on well-known examples.) For each algorithm, you’ll find

1. **Brief Description**  
2. **Potential Alternatives / Replacements**  
3. **Time Complexity** & **Space Complexity**  
4. **Example Implementation in Go**  
5. **Example Implementation in Rust**  
6. **ASCII Chart / Illustration**  
7. **Example Unit Tests (in both Go and Rust)**

---

## 1. **Linear Search**

### 1.1 Description

**Linear Search** (a.k.a. Sequential Search) scans each element of a list until it finds a match or reaches the end.

- **Use Cases**: Small datasets, or when the data is unsorted and you don’t have indexable structures for faster lookups.

### 1.2 Potential Alternatives

- **Binary Search** if the collection is sorted.
- **Hash-based lookups** if you can afford a hash map structure.

### 1.3 Complexity

- **Time Complexity**: (O(n))
- **Space Complexity**: (O(1))

### 1.4 Go Implementation

```go
package linearsearch

// LinearSearch returns the index of target in arr or -1 if not found
func LinearSearch(arr []int, target int) int {
    for i, v := range arr {
        if v == target {
            return i
        }
    }
    return -1
}
```

### 1.5 Rust Implementation

```rust
pub fn linear_search(arr: &[i32], target: i32) -> isize {
    for (i, &val) in arr.iter().enumerate() {
        if val == target {
            return i as isize;
        }
    }
    -1
}
```

### 1.6 ASCII Chart

```text
Index:  0   1   2   3   4   ...
Value: [3] [5] [7] [8] [2] ...
             ^
             |
   Compare each element with 'target'
   until match is found or end is reached
```

### 1.7 Example Unit Tests

#### Go Unit Test

```go
package linearsearch_test

import (
    "testing"
    "github.com/your-repo/linearsearch"
)

func TestLinearSearchFound(t *testing.T) {
    arr := []int{3, 5, 7, 8, 2}
    index := linearsearch.LinearSearch(arr, 7)
    if index != 2 {
        t.Errorf("Expected index 2, got %d", index)
    }
}

func TestLinearSearchNotFound(t *testing.T) {
    arr := []int{3, 5, 7, 8, 2}
    index := linearsearch.LinearSearch(arr, 10)
    if index != -1 {
        t.Errorf("Expected -1, got %d", index)
    }
}
```

#### Rust Unit Test

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_linear_search_found() {
        let arr = [3, 5, 7, 8, 2];
        assert_eq!(linear_search(&arr, 7), 2);
    }

    #[test]
    fn test_linear_search_not_found() {
        let arr = [3, 5, 7, 8, 2];
        assert_eq!(linear_search(&arr, 10), -1);
    }
}
```

---

## 2. **Binary Search**

### 2.1 Description

**Binary Search** finds an element in a **sorted** array by comparing the target with the middle element and narrowing down half of the array each step.

- **Use Cases**: Large, sorted datasets.

### 2.2 Potential Alternatives

- **Linear Search** if unsorted or if the overhead of sorting is higher than beneficial.
- **Interpolation Search** for uniform distributions (theoretical improvement).

### 2.3 Complexity

- **Time Complexity**: (O(log n))
- **Space Complexity**: (O(1)) for iterative version, (O(log n)) for naive recursive version (due to call stack).

### 2.4 Go Implementation

```go
package binarysearch

func BinarySearch(arr []int, target int) int {
    low := 0
    high := len(arr) - 1

    for low <= high {
        mid := (low + high) / 2
        if arr[mid] == target {
            return mid
        } else if arr[mid] < target {
            low = mid + 1
        } else {
            high = mid - 1
        }
    }
    return -1
}
```

### 2.5 Rust Implementation

```rust
pub fn binary_search(arr: &[i32], target: i32) -> isize {
    let mut low = 0;
    let mut high = arr.len() as isize - 1;

    while low <= high {
        let mid = (low + high) / 2;
        if arr[mid as usize] == target {
            return mid;
        } else if arr[mid as usize] < target {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    -1
}
```

### 2.6 ASCII Chart

```text
Indices:     0    1    2    3    4    5    6
Values:     [2]  [5]  [7]  [8]  [11] [13] [15]
                 ^        ^        ^
                 |        |        |
       Mid changes each iteration, 
       cutting the search space in half.
```

### 2.7 Example Unit Tests

#### Go Unit Test

```go
package binarysearch_test

import (
    "testing"
    "github.com/your-repo/binarysearch"
)

func TestBinarySearchFound(t *testing.T) {
    arr := []int{2, 5, 7, 8, 11, 13, 15}
    index := binarysearch.BinarySearch(arr, 11)
    if index != 4 {
        t.Errorf("Expected index 4, got %d", index)
    }
}

func TestBinarySearchNotFound(t *testing.T) {
    arr := []int{2, 5, 7, 8, 11, 13, 15}
    index := binarysearch.BinarySearch(arr, 10)
    if index != -1 {
        t.Errorf("Expected -1, got %d", index)
    }
}
```

#### Rust Unit Test

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_binary_search_found() {
        let arr = [2, 5, 7, 8, 11, 13, 15];
        assert_eq!(binary_search(&arr, 11), 4);
    }

    #[test]
    fn test_binary_search_not_found() {
        let arr = [2, 5, 7, 8, 11, 13, 15];
        assert_eq!(binary_search(&arr, 10), -1);
    }
}
```

---

## 3. **Bubble Sort**

### 3.1 Description

**Bubble Sort** repeatedly swaps adjacent elements if they are in the wrong order. This is one of the simplest sorting algorithms but also one of the least efficient for large data.

- **Use Cases**: Primarily educational. Rarely used in production unless array size is very small.

### 3.2 Potential Alternatives

- **Insertion Sort** (slightly better in practice for small arrays)
- **Selection Sort**
- **Merge Sort** or **Quick Sort** for better average performance on larger datasets.

### 3.3 Complexity

- **Time Complexity**:  
  - Average: (O(n^2))  
  - Worst: (O(n^2))  
- **Space Complexity**: (O(1))

### 3.4 Go Implementation

```go
package bubblesort

func BubbleSort(arr []int) {
    n := len(arr)
    for i := 0; i < n-1; i++ {
        for j := 0; j < n-1-i; j++ {
            if arr[j] > arr[j+1] {
                arr[j], arr[j+1] = arr[j+1], arr[j]
            }
        }
    }
}
```

### 3.5 Rust Implementation

```rust
pub fn bubble_sort(arr: &mut [i32]) {
    let n = arr.len();
    for i in 0..n {
        for j in 0..(n - 1 - i) {
            if arr[j] > arr[j + 1] {
                arr.swap(j, j + 1);
            }
        }
    }
}
```

### 3.6 ASCII Chart

```text
Initial: [5, 3, 7, 2]
         ^  ^
         Compare adjacent, swap if out of order

Pass 1:  [3, 5, 2, 7]
            ^  ^
            compare next adjacent

Pass 2:  [3, 2, 5, 7]
         ...
Eventually: [2, 3, 5, 7]
```

### 3.7 Example Unit Tests

#### Go Unit Test

```go
package bubblesort_test

import (
    "reflect"
    "testing"
    "github.com/your-repo/bubblesort"
)

func TestBubbleSort(t *testing.T) {
    arr := []int{5, 3, 7, 2}
    bubblesort.BubbleSort(arr)
    expected := []int{2, 3, 5, 7}
    if !reflect.DeepEqual(arr, expected) {
        t.Errorf("Expected %v, got %v", expected, arr)
    }
}
```

#### Rust Unit Test

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bubble_sort() {
        let mut arr = [5, 3, 7, 2];
        bubble_sort(&mut arr);
        assert_eq!(arr, [2, 3, 5, 7]);
    }
}
```

---

## 4. **Merge Sort**

### 4.1 Description

**Merge Sort** is a divide-and-conquer algorithm. It divides the array into halves, recursively sorts each half, and then merges the sorted halves.

- **Use Cases**: Often used when stable sort with guaranteed (O(n log n)) time is needed.

### 4.2 Potential Alternatives

- **Quick Sort** (often faster in practice, though worst-case (O(n^2)))
- **Heap Sort**

### 4.3 Complexity

- **Time Complexity**: (O(n log n)) worst, average, and best.
- **Space Complexity**: (O(n))

### 4.4 Go Implementation

```go
package mergesort

func MergeSort(arr []int) []int {
    if len(arr) <= 1 {
        return arr
    }

    mid := len(arr) / 2
    left := MergeSort(arr[:mid])
    right := MergeSort(arr[mid:])

    return merge(left, right)
}

func merge(left, right []int) []int {
    result := make([]int, 0, len(left)+len(right))
    i, j := 0, 0

    for i < len(left) && j < len(right) {
        if left[i] < right[j] {
            result = append(result, left[i])
            i++
        } else {
            result = append(result, right[j])
            j++
        }
    }
    // Add remaining
    result = append(result, left[i:]...)
    result = append(result, right[j:]...)
    return result
}
```

### 4.5 Rust Implementation

```rust
pub fn merge_sort(arr: &[i32]) -> Vec<i32> {
    if arr.len() <= 1 {
        return arr.to_vec();
    }

    let mid = arr.len() / 2;
    let left = merge_sort(&arr[..mid]);
    let right = merge_sort(&arr[mid..]);

    merge(&left, &right)
}

fn merge(left: &[i32], right: &[i32]) -> Vec<i32> {
    let mut result = Vec::with_capacity(left.len() + right.len());
    let (mut i, mut j) = (0, 0);

    while i < left.len() && j < right.len() {
        if left[i] < right[j] {
            result.push(left[i]);
            i += 1;
        } else {
            result.push(right[j]);
            j += 1;
        }
    }

    result.extend_from_slice(&left[i..]);
    result.extend_from_slice(&right[j..]);
    result
}
```

### 4.6 ASCII Chart

```text
Split array in half repeatedly:
[5, 3, 7, 2, 6, 1, 4, 8]
       /              \
  [5, 3, 7, 2]       [6, 1, 4, 8]
    /    \             /     \
 [5, 3]  [7, 2]     [6, 1]  [4, 8]

Merge sorted halves back together.
```

### 4.7 Example Unit Tests

#### Go Unit Test

```go
package mergesort_test

import (
    "reflect"
    "testing"
    "github.com/your-repo/mergesort"
)

func TestMergeSort(t *testing.T) {
    arr := []int{5, 3, 7, 2, 6, 1, 4, 8}
    sorted := mergesort.MergeSort(arr)
    expected := []int{1, 2, 3, 4, 5, 6, 7, 8}
    if !reflect.DeepEqual(sorted, expected) {
        t.Errorf("Expected %v, got %v", expected, sorted)
    }
}
```

#### Rust Unit Test

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_merge_sort() {
        let arr = [5, 3, 7, 2, 6, 1, 4, 8];
        let sorted = merge_sort(&arr);
        let expected = vec![1, 2, 3, 4, 5, 6, 7, 8];
        assert_eq!(sorted, expected);
    }
}
```

---

## 5. **Quick Sort**

### 5.1 Description

**Quick Sort** is also divide-and-conquer, but it partitions the array around a pivot, placing all smaller elements before the pivot and larger after.

- **Use Cases**: Often the fastest in average case for large arrays, though care must be taken to avoid worst-case scenarios (e.g., choosing a good pivot).

### 5.2 Potential Alternatives

- **Merge Sort** (stable, guaranteed (O(n log n)))
- **Heap Sort** (guaranteed (O(n log n)), in-place)

### 5.3 Complexity

- **Time Complexity**:
  - Average: (O(n log n))
  - Worst: (O(n^2)) (if pivot choices are poor)
- **Space Complexity**: (O(log n)) on average, due to recursion stack (in-place partitioning).

### 5.4 Go Implementation

```go
package quicksort

func QuickSort(arr []int) {
    quickSortHelper(arr, 0, len(arr)-1)
}

func quickSortHelper(arr []int, low, high int) {
    if low < high {
        pivot := partition(arr, low, high)
        quickSortHelper(arr, low, pivot-1)
        quickSortHelper(arr, pivot+1, high)
    }
}

func partition(arr []int, low, high int) int {
    pivotValue := arr[high]
    i := low

    for j := low; j < high; j++ {
        if arr[j] < pivotValue {
            arr[i], arr[j] = arr[j], arr[i]
            i++
        }
    }
    arr[i], arr[high] = arr[high], arr[i]
    return i
}
```

### 5.5 Rust Implementation

```rust
pub fn quick_sort(arr: &mut [i32]) {
    let len = arr.len();
    if len <= 1 {
        return;
    }
    quick_sort_helper(arr, 0, (len - 1) as isize);
}

fn quick_sort_helper(arr: &mut [i32], low: isize, high: isize) {
    if low < high {
        let p = partition(arr, low, high);
        quick_sort_helper(arr, low, p - 1);
        quick_sort_helper(arr, p + 1, high);
    }
}

fn partition(arr: &mut [i32], low: isize, high: isize) -> isize {
    let pivot = arr[high as usize];
    let mut i = low;
    for j in low..high {
        if arr[j as usize] < pivot {
            arr.swap(i as usize, j as usize);
            i += 1;
        }
    }
    arr.swap(i as usize, high as usize);
    i
}
```

### 5.6 ASCII Chart

```text
Initial: [3, 8, 2, 5, 1, 4]
Pivot chosen (e.g., last element = 4)

Partition all < 4 to left, all >= 4 to right:
[3, 2, 1]  4  [8, 5]
Then recursively sort the left and right partitions.
```

### 5.7 Example Unit Tests

#### Go Unit Test

```go
package quicksort_test

import (
    "reflect"
    "testing"
    "github.com/your-repo/quicksort"
)

func TestQuickSort(t *testing.T) {
    arr := []int{3, 8, 2, 5, 1, 4}
    quicksort.QuickSort(arr)
    expected := []int{1, 2, 3, 4, 5, 8}
    if !reflect.DeepEqual(arr, expected) {
        t.Errorf("Expected %v, got %v", expected, arr)
    }
}
```

#### Rust Unit Test

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_quick_sort() {
        let mut arr = [3, 8, 2, 5, 1, 4];
        quick_sort(&mut arr);
        assert_eq!(arr, [1, 2, 3, 4, 5, 8]);
    }
}
```

---

## 6. **Breadth-First Search (BFS)**

### 6.1 Description

**BFS** explores a graph level by level from a starting node. Useful for finding the shortest path in an unweighted graph.

- **Use Cases**: Shortest path in an unweighted graph, or level-order traversal in trees.

### 6.2 Potential Alternatives

- **Depth-First Search (DFS)** (uses a stack or recursion, not for shortest path unless DAG or tree)
- **Dijkstra’s Algorithm** (if weighted edges, but BFS is simpler for unweighted)

### 6.3 Complexity

- **Time Complexity**: (O(V + E)), where (V) is the number of vertices, (E) is the number of edges.
- **Space Complexity**: (O(V)) for the queue in the worst case.

### 6.4 Go Implementation

```go
package bfs

func BFS(graph map[int][]int, start int) []int {
    visited := make(map[int]bool)
    queue := []int{start}
    visited[start] = true
    result := []int{}

    for len(queue) > 0 {
        node := queue[0]
        queue = queue[1:]
        result = append(result, node)

        for _, neighbor := range graph[node] {
            if !visited[neighbor] {
                visited[neighbor] = true
                queue = append(queue, neighbor)
            }
        }
    }
    return result
}
```

### 6.5 Rust Implementation

```rust
use std::collections::VecDeque;
use std::collections::HashMap;

pub fn bfs(graph: &HashMap<i32, Vec<i32>>, start: i32) -> Vec<i32> {
    let mut visited = std::collections::HashSet::new();
    let mut queue = VecDeque::new();
    let mut result = Vec::new();

    visited.insert(start);
    queue.push_back(start);

    while let Some(node) = queue.pop_front() {
        result.push(node);
        if let Some(neighbors) = graph.get(&node) {
            for &neighbor in neighbors {
                if !visited.contains(&neighbor) {
                    visited.insert(neighbor);
                    queue.push_back(neighbor);
                }
            }
        }
    }

    result
}
```

### 6.6 ASCII Chart

```text
   Graph Example:

    1 -- 2
    |    |
    3 -- 4

Level-order from node 1:
Start at 1 -> Visit neighbors (2,3) -> Then neighbors of 2, 3 (4)...
```

### 6.7 Example Unit Tests

#### Go Unit Test

```go
package bfs_test

import (
    "reflect"
    "testing"
    "github.com/your-repo/bfs"
)

func TestBFS(t *testing.T) {
    graph := map[int][]int{
        1: {2, 3},
        2: {1, 4},
        3: {1, 4},
        4: {2, 3},
    }
    result := bfs.BFS(graph, 1)
    // Possible BFS: [1, 2, 3, 4]
    expected := []int{1, 2, 3, 4}
    if !reflect.DeepEqual(result, expected) {
        t.Errorf("Expected %v, got %v", expected, result)
    }
}
```

#### Rust Unit Test

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bfs() {
        let mut graph = std::collections::HashMap::new();
        graph.insert(1, vec![2, 3]);
        graph.insert(2, vec![1, 4]);
        graph.insert(3, vec![1, 4]);
        graph.insert(4, vec![2, 3]);

        let result = bfs(&graph, 1);
        let expected = vec![1, 2, 3, 4];
        assert_eq!(result, expected);
    }
}
```

---

## 7. **Depth-First Search (DFS)**

### 7.1 Description

**DFS** explores as far as possible along a branch before backtracking. Commonly implemented with recursion or a stack.

- **Use Cases**: Detecting cycles, path finding in trees/graphs, topological sort (with modifications).

### 7.2 Potential Alternatives

- **BFS** for level-order or shortest path in unweighted graphs.

### 7.3 Complexity

- **Time Complexity**: (O(V + E))
- **Space Complexity**: (O(V)) (recursion stack or explicit stack).

### 7.4 Go Implementation

```go
package dfs

func DFS(graph map[int][]int, start int) []int {
    visited := make(map[int]bool)
    result := []int{}
    dfsHelper(graph, start, visited, &result)
    return result
}

func dfsHelper(graph map[int][]int, node int, visited map[int]bool, result *[]int) {
    visited[node] = true
    *result = append(*result, node)

    for _, neighbor := range graph[node] {
        if !visited[neighbor] {
            dfsHelper(graph, neighbor, visited, result)
        }
    }
}
```

### 7.5 Rust Implementation

```rust
use std::collections::{HashMap, HashSet};

pub fn dfs(graph: &HashMap<i32, Vec<i32>>, start: i32) -> Vec<i32> {
    let mut visited = HashSet::new();
    let mut result = Vec::new();
    dfs_helper(graph, start, &mut visited, &mut result);
    result
}

fn dfs_helper(
    graph: &HashMap<i32, Vec<i32>>, 
    node: i32, 
    visited: &mut HashSet<i32>, 
    result: &mut Vec<i32>
) {
    visited.insert(node);
    result.push(node);

    if let Some(neighbors) = graph.get(&node) {
        for &neighbor in neighbors {
            if !visited.contains(&neighbor) {
                dfs_helper(graph, neighbor, visited, result);
            }
        }
    }
}
```

### 7.6 ASCII Chart

```text
   Graph Example:

    1 -- 2
    |    |
    3 -- 4

DFS from node 1 might go:
1 -> 2 -> 4 -> 3 (depending on adjacency ordering)
```

### 7.7 Example Unit Tests

#### Go Unit Test

```go
package dfs_test

import (
    "reflect"
    "testing"
    "github.com/your-repo/dfs"
)

func TestDFS(t *testing.T) {
    graph := map[int][]int{
        1: {2, 3},
        2: {1, 4},
        3: {1, 4},
        4: {2, 3},
    }
    result := dfs.DFS(graph, 1)
    // One possible DFS order: [1, 2, 4, 3]
    expected := []int{1, 2, 4, 3}
    if !reflect.DeepEqual(result, expected) {
        t.Errorf("Expected %v, got %v", expected, result)
    }
}
```

#### Rust Unit Test

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dfs() {
        let mut graph = std::collections::HashMap::new();
        graph.insert(1, vec![2, 3]);
        graph.insert(2, vec![1, 4]);
        graph.insert(3, vec![1, 4]);
        graph.insert(4, vec![2, 3]);

        let result = dfs(&graph, 1);
        let expected = vec![1, 2, 4, 3]; 
        assert_eq!(result, expected);
    }
}
```

---

## 8. **Dijkstra’s Algorithm**

### 8.1 Description

**Dijkstra’s Algorithm** finds the shortest path from a source to all other vertices in a graph with non-negative edge weights.

- **Use Cases**: Routing, network path optimization.

### 8.2 Potential Alternatives

- **Bellman-Ford** for graphs that may have negative edges.
- **Floyd-Warshall** for all-pairs shortest paths.

### 8.3 Complexity

Using a min-priority queue (binary heap):

- **Time Complexity**: (O((V + E) log V))
- **Space Complexity**: (O(V))

### 8.4 Go Implementation

```go
package dijkstra

import (
    "container/heap"
    "math"
)

// Edge represents a graph edge
type Edge struct {
    node   int
    weight int
}

// PriorityQueueItem is needed by container/heap
type PriorityQueueItem struct {
    node     int
    distance int
}

// Min-heap implementation
type PriorityQueue []PriorityQueueItem

func (pq PriorityQueue) Len() int { return len(pq) }
func (pq PriorityQueue) Less(i, j int) bool {
    return pq[i].distance < pq[j].distance
}
func (pq PriorityQueue) Swap(i, j int) {
    pq[i], pq[j] = pq[j], pq[i]
}
func (pq *PriorityQueue) Push(x interface{}) {
    *pq = append(*pq, x.(PriorityQueueItem))
}
func (pq *PriorityQueue) Pop() interface{} {
    old := *pq
    n := len(old)
    item := old[n-1]
    *pq = old[0 : n-1]
    return item
}

// Dijkstra computes shortest distances from source
func Dijkstra(graph map[int][]Edge, source int) map[int]int {
    dist := make(map[int]int)
    for node := range graph {
        dist[node] = math.MaxInt32
    }
    dist[source] = 0

    pq := &PriorityQueue{}
    heap.Init(pq)
    heap.Push(pq, PriorityQueueItem{node: source, distance: 0})

    for pq.Len() > 0 {
        item := heap.Pop(pq).(PriorityQueueItem)
        currentNode, currentDist := item.node, item.distance

        if currentDist > dist[currentNode] {
            continue
        }

        for _, edge := range graph[currentNode] {
            newDist := currentDist + edge.weight
            if newDist < dist[edge.node] {
                dist[edge.node] = newDist
                heap.Push(pq, PriorityQueueItem{node: edge.node, distance: newDist})
            }
        }
    }
    return dist
}
```

### 8.5 Rust Implementation

```rust
use std::collections::{BinaryHeap, HashMap};
use std::cmp::Ordering;

#[derive(Copy, Clone, Eq, PartialEq)]
struct State {
    node: i32,
    distance: i32,
}

// Reverse the ordering for a min-heap
impl Ord for State {
    fn cmp(&self, other: &Self) -> Ordering {
        other.distance.cmp(&self.distance)
    }
}

impl PartialOrd for State {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

#[derive(Clone)]
pub struct Edge {
    pub node: i32,
    pub weight: i32,
}

pub fn dijkstra(graph: &HashMap<i32, Vec<Edge>>, source: i32) -> HashMap<i32, i32> {
    let mut dist: HashMap<i32, i32> = HashMap::new();
    for &node in graph.keys() {
        dist.insert(node, i32::MAX);
    }
    *dist.get_mut(&source).unwrap() = 0;

    let mut heap = BinaryHeap::new();
    heap.push(State { node: source, distance: 0 });

    while let Some(State { node, distance }) = heap.pop() {
        // If this distance is already worse than what we have, skip
        if distance > dist[&node] {
            continue;
        }

        if let Some(edges) = graph.get(&node) {
            for edge in edges {
                let next = State {
                    node: edge.node,
                    distance: distance + edge.weight,
                };
                if next.distance < dist[&edge.node] {
                    *dist.get_mut(&edge.node).unwrap() = next.distance;
                    heap.push(next);
                }
            }
        }
    }
    dist
}
```

### 8.6 ASCII Chart

```text
   (source)
      1
     / \
    4   2
   /     \
  3 ------ 5
  Edges have weights:
  (1->2 = 2), (1->4 = 1), (4->3 = 1), (3->5 = 4), (2->5 = 2)...

Dijkstra expands outward from the source, 
relaxing edge distances to find the minimum path cost.
```

### 8.7 Example Unit Tests

#### Go Unit Test

{% raw %}
```go
package dijkstra_test

import (
    "testing"
    "github.com/your-repo/dijkstra"
)

func TestDijkstra(t *testing.T) {
    graph := map[int][]dijkstra.Edge{
        1: {{node: 2, weight: 2}, {node: 4, weight: 1}},
        2: {{node: 5, weight: 2}},
        3: {{node: 5, weight: 4}},
        4: {{node: 3, weight: 1}},
        5: {},
    }

    dist := dijkstra.Dijkstra(graph, 1)

    // Shortest dist from 1 to nodes:
    // 1 -> 1: 0
    // 1 -> 2: 2
    // 1 -> 3: 2 (via 4->3)
    // 1 -> 4: 1
    // 1 -> 5: 4 (1->4->3->5 or 1->2->5)
    if dist[1] != 0 {
        t.Errorf("Expected 0 for node 1, got %d", dist[1])
    }
    if dist[2] != 2 {
        t.Errorf("Expected 2 for node 2, got %d", dist[2])
    }
    if dist[3] != 2 {
        t.Errorf("Expected 2 for node 3, got %d", dist[3])
    }
    if dist[4] != 1 {
        t.Errorf("Expected 1 for node 4, got %d", dist[4])
    }
    if dist[5] != 4 {
        t.Errorf("Expected 4 for node 5, got %d", dist[5])
    }
}
```
{% endraw %}

#### Rust Unit Test

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dijkstra() {
        let mut graph: HashMap<i32, Vec<Edge>> = HashMap::new();
        graph.insert(1, vec![Edge{node: 2, weight: 2}, Edge{node: 4, weight: 1}]);
        graph.insert(2, vec![Edge{node: 5, weight: 2}]);
        graph.insert(3, vec![Edge{node: 5, weight: 4}]);
        graph.insert(4, vec![Edge{node: 3, weight: 1}]);
        graph.insert(5, vec![]);

        let dist = dijkstra(&graph, 1);

        assert_eq!(*dist.get(&1).unwrap(), 0);
        assert_eq!(*dist.get(&2).unwrap(), 2);
        assert_eq!(*dist.get(&3).unwrap(), 2);
        assert_eq!(*dist.get(&4).unwrap(), 1);
        assert_eq!(*dist.get(&5).unwrap(), 4);
    }
}
```

---

## 9. **Bellman-Ford Algorithm**

### 9.1 Description

**Bellman-Ford** computes shortest paths from a single source to all vertices in a weighted digraph. It can handle negative edge weights but not negative cycles.

- **Use Cases**: Graphs that may have negative edge weights.

### 9.2 Potential Alternatives

- **Dijkstra** if there are no negative edge weights.
- **Floyd-Warshall** for all-pairs shortest paths (slower for large graphs).

### 9.3 Complexity

- **Time Complexity**: (O(V times E))
- **Space Complexity**: (O(V))

### 9.4 Go Implementation (Outline)

```go
package bellmanford

import "math"

type Edge struct {
    From   int
    To     int
    Weight int
}

// BellmanFord returns distance map and a bool indicating if a negative cycle exists
func BellmanFord(edges []Edge, V, source int) (map[int]int, bool) {
    dist := make(map[int]int)
    for i := 1; i <= V; i++ {
        dist[i] = math.MaxInt32
    }
    dist[source] = 0

    // Relax edges V-1 times
    for i := 0; i < V-1; i++ {
        for _, e := range edges {
            if dist[e.From] != math.MaxInt32 && dist[e.From]+e.Weight < dist[e.To] {
                dist[e.To] = dist[e.From] + e.Weight
            }
        }
    }

    // Check for negative cycle
    for _, e := range edges {
        if dist[e.From] != math.MaxInt32 && dist[e.From]+e.Weight < dist[e.To] {
            // Negative cycle found
            return dist, true
        }
    }
    return dist, false
}
```

### 9.5 Rust Implementation (Outline)

```rust
use std::collections::HashMap;

#[derive(Clone)]
pub struct Edge {
    pub from: i32,
    pub to: i32,
    pub weight: i32,
}

pub fn bellman_ford(edges: &Vec<Edge>, v: i32, source: i32) -> (HashMap<i32, i32>, bool) {
    let mut dist = HashMap::new();
    for i in 1..=v {
        dist.insert(i, i32::MAX);
    }
    dist.insert(source, 0);

    for _ in 0..(v - 1) {
        for e in edges {
            let from_dist = *dist.get(&e.from).unwrap();
            if from_dist != i32::MAX && from_dist + e.weight < *dist.get(&e.to).unwrap() {
                dist.insert(e.to, from_dist + e.weight);
            }
        }
    }

    // Check for negative cycle
    for e in edges {
        let from_dist = *dist.get(&e.from).unwrap();
        if from_dist != i32::MAX && from_dist + e.weight < *dist.get(&e.to).unwrap() {
            return (dist, true);
        }
    }

    (dist, false)
}
```

### 9.6 ASCII Chart

```text
 Relax edges up to V-1 times:

   1 ---> 2
   ^       \
   |        \
   3 <------- 4
   Negative edges are allowed, 
   but not negative cycles.
```

### 9.7 Example Unit Tests

*(Keeping them concise in the interest of space.)*

#### Go Unit Test

```go
package bellmanford_test

import (
    "testing"
    "github.com/your-repo/bellmanford"
)

func TestBellmanFord(t *testing.T) {
    edges := []bellmanford.Edge{
        {From: 1, To: 2, Weight: 4},
        {From: 1, To: 3, Weight: 5},
        {From: 2, To: 3, Weight: -3},
        {From: 2, To: 4, Weight: 2},
        {From: 3, To: 4, Weight: 4},
    }
    dist, negativeCycle := bellmanford.BellmanFord(edges, 4, 1)
    if negativeCycle {
        t.Errorf("Expected no negative cycle")
    }
    // Validate distances
    // ...
}
```

#### Rust Unit Test

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bellman_ford() {
        let edges = vec![
            Edge { from: 1, to: 2, weight: 4 },
            Edge { from: 1, to: 3, weight: 5 },
            Edge { from: 2, to: 3, weight: -3 },
            Edge { from: 2, to: 4, weight: 2 },
            Edge { from: 3, to: 4, weight: 4 },
        ];
        let (dist, negative_cycle) = bellman_ford(&edges, 4, 1);
        assert!(!negative_cycle, "Did not expect a negative cycle");
        // Validate distances
        // ...
    }
}
```

---

## 10. **Fibonacci (Dynamic Programming Example)**

### 10.1 Description

A classic example of **Dynamic Programming** is computing Fibonacci numbers. We can use either top-down memoization or bottom-up tabulation.

### 10.2 Potential Alternatives

- **Recursion** (exponential time without memoization).
- **Closed-form formula** (Binet’s formula) for approximate values.

### 10.3 Complexity

- **Time Complexity**: (O(n)) with DP  
- **Space Complexity**: (O(n)) or (O(1)) if only storing last two states

### 10.4 Go Implementation (Bottom-Up)

```go
package fib

func Fib(n int) int {
    if n <= 1 {
        return n
    }
    fib := make([]int, n+1)
    fib[0], fib[1] = 0, 1
    for i := 2; i <= n; i++ {
        fib[i] = fib[i-1] + fib[i-2]
    }
    return fib[n]
}
```

### 10.5 Rust Implementation (Bottom-Up)

```rust
pub fn fib(n: usize) -> usize {
    if n <= 1 {
        return n;
    }
    let mut fib = vec![0; n+1];
    fib[0] = 0;
    fib[1] = 1;
    for i in 2..=n {
        fib[i] = fib[i-1] + fib[i-2];
    }
    fib[n]
}
```

### 10.6 ASCII Chart

```text
Fib sequence: 0, 1, 1, 2, 3, 5, 8, 13, ...
Index(n):     0, 1, 2, 3, 4, 5, 6,  7,  ...
DP relation: Fib(n) = Fib(n-1) + Fib(n-2)
```

### 10.7 Example Unit Tests

#### Go Unit Test

```go
package fib_test

import (
    "testing"
    "github.com/your-repo/fib"
)

func TestFib(t *testing.T) {
    tests := []struct {
        input    int
        expected int
    }{
        {0, 0}, {1, 1}, {2, 1}, {5, 5}, {10, 55},
    }
    for _, tt := range tests {
        if got := fib.Fib(tt.input); got != tt.expected {
            t.Errorf("Fib(%d) = %d, want %d", tt.input, got, tt.expected)
        }
    }
}
```

#### Rust Unit Test

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fib() {
        let test_cases = vec![
            (0, 0),
            (1, 1),
            (2, 1),
            (5, 5),
            (10, 55),
        ];
        for (input, expected) in test_cases {
            assert_eq!(fib(input), expected, "Fib({}) should be {}", input, expected);
        }
    }
}
```

---

# Summary Table of Algorithms

Below is a quick summary of each algorithm’s primary complexity and use case:

| Algorithm          | Potential Replacement            | Time Complexity  | Space Complexity | Common Use Cases                |
|--------------------|----------------------------------|------------------|------------------|---------------------------------|
| **Linear Search**  | Binary Search (if sorted)        | (O(n))       | (O(1))       | Small, unsorted lists           |
| **Binary Search**  | Interpolation Search, Hash       | (O(log n))  | (O(1))       | Large, sorted lists             |
| **Bubble Sort**    | Insertion Sort, Merge Sort, etc. | (O(n^2))     | (O(1))       | Educational, very small lists    |
| **Merge Sort**     | Quick Sort                       | (O(n log n))| (O(n))       | Stable sorting, guaranteed perf. |
| **Quick Sort**     | Merge Sort, Heap Sort            | (O(n log n))| (O(log n))  | Usually fastest on average       |
| **BFS**            | DFS, Dijkstra (if weighted)      | (O(V + E))   | (O(V))       | Shortest path in unweighted graph|
| **DFS**            | BFS                              | (O(V + E))   | (O(V))       | Graph traversal, cycle detection |
| **Dijkstra**       | Bellman-Ford (neg edges)         | (O((V+E)log V))| (O(V))    | Shortest path (no negative edges)|
| **Bellman-Ford**   | Dijkstra (no neg edges)          | (O(V times E))| (O(V))      | Shortest path (neg edges)        |
| **Fibonacci (DP)** | Plain recursion, Binet formula   | (O(n))       | (O(n)) or (O(1)) | DP example, repeated subproblems|

---

## Concluding Remarks

That's the more or less detailed overview of the most common algorithms. I will try to cover other specific algorithms in my subsequent blog posts.
