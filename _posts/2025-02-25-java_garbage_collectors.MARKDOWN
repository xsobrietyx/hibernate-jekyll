---
layout: post
title: Java Garbage Collectors overview
url: /java_garbage_collectors
file_name: java_garbage_collectors
---

Below is a **deep, comprehensive guide** on **Java Garbage Collectors**, including **ASCII diagrams**, **examples**, **pros and cons** for each GC type, **usage recommendations**, and **best practices**. This guide aims to clarify how garbage collection (GC) works in Java, how the different collectors function, and in which scenarios each GC is typically preferred.

---

# Table of Contents

- [Table of Contents](#table-of-contents)
- [1. Overview of Garbage Collection in Java](#1-overview-of-garbage-collection-in-java)
- [2. Generational Memory Model \& Basic Terms](#2-generational-memory-model--basic-terms)
- [3. Key Java Garbage Collectors](#3-key-java-garbage-collectors)
  - [3.1 Serial GC](#31-serial-gc)
  - [3.2 Parallel GC](#32-parallel-gc)
  - [3.3 CMS (Concurrent Mark Sweep)](#33-cms-concurrent-mark-sweep)
  - [3.4 G1 (Garbage-First) GC](#34-g1-garbage-first-gc)
  - [3.5 ZGC](#35-zgc)
  - [3.6 Shenandoah GC](#36-shenandoah-gc)
  - [3.7 Epsilon GC (No-Op)](#37-epsilon-gc-no-op)
- [4. ASCII Diagram: Simplified View of Generational Heap](#4-ascii-diagram-simplified-view-of-generational-heap)
- [5. Usage Examples \& Command-Line Options](#5-usage-examples--command-line-options)
- [6. Pros and Cons Summary](#6-pros-and-cons-summary)
- [7. Best Practices \& Tuning Guidance](#7-best-practices--tuning-guidance)
- [8. Conclusion](#8-conclusion)

---

<a name="overview"></a>

# 1. Overview of Garbage Collection in Java

Java’s garbage collector **automatically reclaims** memory from objects that are **no longer referenced**. Developers don’t have to manually `free` or `delete` objects, preventing many memory-management errors.

- **Automatic Memory Management** reduces code complexity.
- Different **GC algorithms** suit different applications, throughput vs. latency needs.

When you run a Java application, you can **choose** the GC via **JVM options** (e.g., `-XX:+UseG1GC`), or **accept** the default GC, which in modern Java versions (Java 11+) is typically **G1**.

---

<a name="generational-model"></a>

# 2. Generational Memory Model & Basic Terms

Most Java GCs use a **generational** approach to manage memory. The **heap** is split into:

- **Young Generation**:
  - **Eden** space: new objects allocated here.  
  - **Survivor** spaces (S0, S1): objects surviving from Eden after a minor GC move here.
- **Old Generation (Tenured)**: Long-lived objects eventually promoted here if they survive multiple minor GCs.

**Why generational?**  

- Most objects in typical Java applications die young. A generational GC focuses frequent, fast collection on the **young** region. Less frequent “major GCs” happen for the **old** region.

---

<a name="garbage-collectors"></a>

# 3. Key Java Garbage Collectors

We’ll go through each main GC, listing:

1. **How it works**  
2. **Pros** & **cons**  
3. **Use cases**  

---

<a name="serial-gc"></a>

## 3.1 Serial GC

**Name**: `Serial GC` (enabled with `-XX:+UseSerialGC`)

**How it works**:  

- Uses a single thread for **all** GC work (marking, copying, compacting).  
- **Stops the application** (Stop-the-World) during GC.  
- Ideal for small heaps or simple applications.

**Pros**:  

- **Simplicity**; minimal overhead.  
- Low memory footprint.  
- Often fastest for **single-threaded** environments or small heaps.

**Cons**:  

- Entire application is paused while GC runs on **one** thread.  
- **Not** great for large heaps because GC pauses grow significantly.

**Use Cases**:  

- **Client-side** or embedded systems with small memory (like 512 MB or less).  
- Single-CPU or resource-constrained environments.

---

<a name="parallel-gc"></a>

## 3.2 Parallel GC

**Name**: `Parallel GC` or <br/> **Throughput Collector** (enabled with `-XX:+UseParallelGC`)

**How it works**:  

- **Multiple threads** collect young generation in parallel.  
- Also does parallel old generation collection.  
- Still **Stop-the-World** but with parallelism to reduce total pause time **duration** (though the app is still paused).

**Pros**:  

- High **throughput** for CPU-rich environments.  
- **Default** collector in older Java versions (Java 8) if G1 is not chosen.  
- Good for batch or **throughput-oriented** apps that can tolerate some pause but want faster overall GC completion.

**Cons**:  

- GC is still fully **Stop-the-World**; you can get fewer but larger pauses if the heap is large.  
- Not great for low-latency or interactive apps needing short response times.

**Use Cases**:  

- **Batch processing** or backend apps that can handle pause times but want high overall throughput.  
- Systems with **multiple cores**.

---

<a name="cms"></a>

## 3.3 CMS (Concurrent Mark Sweep)

**Name**: `CMS` or <br/> **Concurrent Mark Sweep** (enabled with `-XX:+UseConcMarkSweepGC`, deprecated in Java 9, removed in newer versions)

**How it works**:  

- Old generation is primarily collected **concurrently** with the application.  
- Minimizes pauses by doing **marking** in parallel; the “sweep” also runs concurrently.  
- However, it occasionally has **Stop-the-World** phases for final mark and other tasks.

**Pros**:  

- **Reduced pause times** vs. parallel collector.  
- Good for **low-latency** scenarios.

**Cons**:  

- **More CPU usage** during concurrency.  
- Uses more memory overhead because it doesn’t compact the old generation typically (leading to fragmentation).  
- **Deprecated** in new Java versions; replaced by G1 and other advanced collectors.

**Use Cases**:  

- Historically used for **large** apps with **low-latency** demands.  
- In modern Java, it’s recommended to migrate to **G1** or **ZGC** instead.

---

<a name="g1"></a>

## 3.4 G1 (Garbage-First) GC

**Name**: `G1 GC` (enabled with `-XX:+UseG1GC`, default in Java 9+)

**How it works**:  

- Heap is split into **regions** (instead of contiguous young/old).  
- Collects regions **in parallel**, focusing (“garbage-first”) on regions with the **most garbage** to optimize collection.  
- Mixes **concurrent** phases (marking) with partial stop-the-world events.  
- Does **regional compaction** to reduce fragmentation.

**Pros**:  

- **Predictable** low-ish pause times.  
- Good for **large heaps** (tens to hundreds of GB).  
- Often the **default** in modern Java, well-supported.

**Cons**:  

- More complexity than Parallel/Serial.  
- Tuning might be needed for specific latency goals.  
- May have some overhead from concurrent threads.

**Use Cases**:  

- General-purpose collector for **most** production apps in Java 11+.  
- Large memory applications needing balanced throughput and latency.

---

<a name="zgc"></a>

## 3.5 ZGC

**Name**: `Z Garbage Collector` (enable with `-XX:+UseZGC`, Java 11+ with special builds or included in later versions)

**How it works**:  

- **Region-based** collector that aims for **very low** (sub-millisecond) pause times, even on large heaps (multi-GB or TB).  
- Uses **colored pointers** or “load barriers” to do concurrent marking and relocation with minimal STW.  
- Boasts **pauses in the microsecond to millisecond** range.

**Pros**:  

- **Extremely low** pause times, typically under 10ms, even with large heaps.  
- Good for **modern** Java versions requiring near real-time latency.

**Cons**:  

- Newer, still evolving.  
- Potentially more overhead in some workloads (though improved over time).  
- Requires **64-bit** platforms; pointer coloring might not be feasible in 32-bit.

**Use Cases**:  

- **Latency-critical** services, large-scale applications where even tens-of-milliseconds pause is unacceptable.  
- Real-time analytics, trading systems, etc.

---

<a name="shenandoah"></a>

## 3.6 Shenandoah GC

**Name**: `Shenandoah GC` (enable with `-XX:+UseShenandoahGC` in Java 12+ or RedHat distributions)

**How it works**:  

- Another **low-pause** collector.  
- Uses **regional** heap and concurrent marking/evacuation.  
- Aims for consistent **pause times** independent of heap size.

**Pros**:  

- **Low** and **predictable** pause times.  
- Good for large heaps as well.  
- Open-source community-driven (initially from Red Hat).

**Cons**:  

- Not as widely used as G1, but gaining traction.  
- May have some overhead or memory consumption overhead.  
- Tuning may be required for optimal performance.

**Use Cases**:  

- Similar to ZGC: if you need minimal latency.  
- Large scale or real-time Java apps.

---

<a name="epsilon"></a>

## 3.7 Epsilon GC (No-Op)

**Name**: `Epsilon GC` <br/> (enable with `-XX:+UnlockExperimentalVMOptions -XX:+UseEpsilonGC`)

**How it works**:  

- **No** actual garbage collection. Once heap is full, the JVM basically throws an OOM.  
- Testing or short-lived apps that never need to reclaim memory.

**Pros**:  

- **Zero overhead** from GC.  
- Good for ephemeral apps or benchmarking memory usage without GC noise.

**Cons**:  

- Doesn’t free memory. The application will **crash** once heap is exhausted.  
- Not for production usage unless very specialized scenario.

**Use Cases**:  

- **Performance testing** to see raw CPU usage or memory usage patterns.  
- Very short-lived tasks that never fill the heap.

---

<a name="ascii-diagram"></a>

# 4. ASCII Diagram: Simplified View of Generational Heap

```
       [ Java Heap Memory ]
      +--------------------------------------+
      |           Eden          |            |
      |  (Young Gen)            |            |
      |-------------------------| Old Gen     |
      |  S0   |  S1            | (Tenured)   |
      +--------------------------------------+
         ^ When Eden is full, minor GC
         ^ promotes survivors to S0, S1 or Old

   [Garbage Collection Logic]:

   1) Minor GC (Young collection):
        - Typically short STW, copies live objects
        - Freed Eden
        - Surviving objects go to survivor or old gen

   2) Major GC (Old Gen collection):
        - Less frequent, can be parallel or concurrent
        - Reclaims old gen space
        - Possibly compacts or reclaims in regions (like G1)
```

---

<a name="usage-examples"></a>

# 5. Usage Examples & Command-Line Options

**Selecting a GC** typically involves `-XX:+Use...GC`. For instance:

- **Serial GC**:  

  ```text
  java -XX:+UseSerialGC -jar MyApp.jar
  ```

- **Parallel GC**:  

  ```text
  java -XX:+UseParallelGC -jar MyApp.jar
  ```

- **G1 GC** (often default in modern Java):  

  ```text
  java -XX:+UseG1GC -jar MyApp.jar
  ```

- **ZGC**:  

  ```text
  java -XX:+UseZGC -XX:+UnlockExperimentalVMOptions -jar MyApp.jar
  ```

- **Shenandoah**:  

  ```text
  java -XX:+UseShenandoahGC -XX:+UnlockExperimentalVMOptions -jar MyApp.jar
  ```

- **Epsilon**:  

  ```text
  java -XX:+UseEpsilonGC -XX:+UnlockExperimentalVMOptions -jar MyApp.jar
  ```

**Example**: Tuning G1 for a 4GB heap with a target max pause of 50ms:

```text
java -Xms4g -Xmx4g \
     -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=50 \
     -jar MyApp.jar
```

---

<a name="pros-cons-summary"></a>

# 6. Pros and Cons Summary

| Collector    | Pros                                                    | Cons                                                     | Typical Use Case                               |
|--------------|---------------------------------------------------------|----------------------------------------------------------|------------------------------------------------|
| **Serial**   | Simple, low overhead for small heaps                    | STW single-threaded, big pauses on large heaps          | Tiny apps, single-core, minimal memory         |
| **Parallel** | High throughput, parallel for both young & old gen     | Full STW, can have bigger pause times                    | Batch/throughput-oriented apps, Java 8 default |
| **CMS**      | Concurrent old gen (lower pauses than Parallel)         | Fragmentation, more CPU overhead, now deprecated         | Historically low-latency, replaced by G1/ZGC   |
| **G1**       | Balanced approach, region-based, concurrency, default   | Some overhead for region mgmt, not purely concurrent     | Modern default, large heaps, balanced usage    |
| **ZGC**      | Very low pause times (<10ms), can handle huge heaps     | Relatively new, potential overhead, 64-bit only          | Ultra-low-latency apps, large memory           |
| **Shenandoah**| Low pause, concurrent, region-based                   | Not as common as G1/ZGC, may need careful tuning         | Large scale, real-time or near-real-time needs |
| **Epsilon**  | No GC overhead, purely theoretical for ephemeral usage  | Memory never reclaimed => crash once heap is full        | Testing / ephemeral workloads                  |

---

<a name="best-practices"></a>

# 7. Best Practices & Tuning Guidance

1. **Start with G1**: For most modern Java applications, G1 is a great default.  
2. **Heap Sizing**: Provide enough memory (`-Xmx`) so you don’t induce frequent GC cycles. But not so large that it starves the OS.  
3. **Pause Goals**: Use `-XX:MaxGCPauseMillis` (G1, Parallel) as a hint. The JVM tries to meet that but not guaranteed.  
4. **Observe with GC Logs**: Enable GC logging (`-Xlog:gc*` in Java 11+ or <br/> `-XX:+PrintGCDetails` in older versions) to see actual pause times.  
5. **Application Profiling**: Profile memory usage to confirm if you have memory leaks or large object churn.  
6. **Upgrade Java**: ZGC or Shenandoah require newer Java versions. Evaluate them if you need extremely low latency.  
7. **Minor GC vs. Major GC**: Understand your object allocation patterns. If short-lived objects are huge, you might see more frequent young GC.  
8. **Load Testing**: Always test your application in a staging environment with realistic load, monitoring GC behavior.

---

<a name="conclusion"></a>

# 8. Conclusion

Java provides a **range** of GC algorithms for different needs:

- **Serial/Parallel**: simpler, older designs, either for minimal resource or high throughput.  
- **CMS**: once popular for low-latency, but replaced by G1, ZGC.  
- **G1**: default collector in modern Java, balancing throughput & lower pauses.  
- **ZGC & Shenandoah**: cutting-edge, near real-time, minimal stop-the-world.  
- **Epsilon**: specialized no-op collector for ephemeral or testing scenarios.

Your choice depends on **heap size**, **latency requirements**, **throughput demands**, and **Java version**. Always **observe** GC logs in real workloads, then tweak parameters to find the **optimal** solution for your specific application.

---

**Further Reading & Tools**:

- **Official Java Docs**: [OpenJDK documentation](https://openjdk.org/)
- **Java Performance Tuning** by Charlie Hunt and Binu John
- **Netbeans/VisualVM** or **JDK Mission Control** for GC monitoring  
- **GC tuning guidelines** from Oracle: [docs.oracle.com](https://docs.oracle.com/en/java/)

With these details, you can approach GC selection and tuning in a structured way, ensuring that your Java application runs **efficiently** and meets your performance goals.
