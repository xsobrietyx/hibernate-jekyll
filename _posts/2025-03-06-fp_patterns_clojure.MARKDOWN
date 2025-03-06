---
layout: post
title: Core Functional Programming patterns with examples in Clojure
url: /fp_patterns_clojure
file_name: fp_patterns_clojure
---

Below is **an illustrative Clojure project** that demonstrates several common **functional programming (FP) patterns**, each accompanied by **documentation** and **unit tests**. While these patterns are by no means an exhaustive list, they represent some of the core ideas you’ll see in functional code. The examples are intentionally self-contained and straightforward to focus on clarity.

---

# Table of Contents

- [Table of Contents](#table-of-contents)
  - [1. Project Setup](#1-project-setup)
    - [`project.clj` (Example)](#projectclj-example)
  - [2. List of FP Patterns](#2-list-of-fp-patterns)
    - [a. Higher-Order Functions](#a-higher-order-functions)
    - [b. Map / Filter / Reduce (classic trio)](#b-map--filter--reduce-classic-trio)
    - [c. Recursion](#c-recursion)
    - [d. Currying \& Partial Application](#d-currying--partial-application)
    - [e. Function Composition](#e-function-composition)
    - [f. Lazy Sequences](#f-lazy-sequences)
    - [g. Immutability \& Persistent Data Structures](#g-immutability--persistent-data-structures)
    - [h. Transducers (Bonus)](#h-transducers-bonus)
  - [3. Example Implementation](#3-example-implementation)
    - [Core Source File: `src/patterns/core.clj`](#core-source-file-srcpatternscoreclj)
    - [Test Suite: `test/patterns/core_test.clj`](#test-suite-testpatternscore_testclj)
  - [4. How to Run](#4-how-to-run)
- [Conclusion](#conclusion)

---

## 1. Project Setup

Below is a **Leiningen**-based structure, which is a classic way to organize a Clojure project:

```text
functional-patterns/
├── project.clj
├── README.md
├── src
│   └── patterns
│       └── core.clj
└── test
    └── patterns
        └── core_test.clj
```

### `project.clj` (Example)

```clojure
(defproject functional-patterns "0.1.0-SNAPSHOT"
  :description "Demonstration of functional programming patterns in Clojure."
  :license {:name "MIT"}
  :dependencies [[org.clojure/clojure "1.11.1"]]
  :plugins [[lein-midje "3.2.2"]] ; if you like Midje, optional
  :main ^:skip-aot patterns.core
  :target-path "target/%s"
  :profiles {:dev {:dependencies []}})
```

> *Note:* If you prefer [`deps.edn`](https://clojure.org/guides/deps_and_cli) over Leiningen, you can adapt accordingly. The source code itself remains the same.

---

## 2. List of FP Patterns

### a. Higher-Order Functions

A **higher-order function (HOF)** is any function that either **takes one or more functions as arguments** or **returns a function** as its result. This is a core concept in functional programming.

### b. Map / Filter / Reduce (classic trio)

- **map** – applies a function to each element of a collection, returning a new collection of results.  
- **filter** – retains only elements for which a predicate returns true.  
- **reduce** – folds a collection down to a single value by repeatedly applying a function to an accumulator and an element.

### c. Recursion

**Recursion** is when a function calls itself, often on a smaller portion of the problem, until a base condition is reached. Clojure encourages tail-recursion via the `recur` special form.

### d. Currying & Partial Application

- **Currying** transforms a function with multiple parameters into a chain of single-parameter functions.  
- **Partial application** creates a new function by “fixing” some arguments of the original function in advance.

### e. Function Composition

**Function composition** combines functions in a pipeline, where the output of one becomes the input of the next. In Clojure, this is often done with the built-in `comp` function.

### f. Lazy Sequences

Clojure’s **lazy sequences** only realize elements on demand. This allows for efficient processing of potentially infinite sequences.

### g. Immutability & Persistent Data Structures

All default Clojure collections (lists, vectors, maps, sets) are **immutable** and **persistent**—operations return new versions without mutating existing data.

### h. Transducers (Bonus)

**Transducers** are composable transformations that can be applied to various “process contexts” (sequences, channels, etc.). They’re an advanced but powerful pattern for **streaming** or **lazy** transformations without creating intermediate collections.

---

## 3. Example Implementation

Below is a full example. You can place it in your project as follows:

### Core Source File: `src/patterns/core.clj`

```clojure
(ns patterns.core
  "Demonstrates various functional programming patterns in Clojure."
  (:gen-class))

;; -------------------------------------------------------------------
;; a. HIGHER-ORDER FUNCTIONS
;; -------------------------------------------------------------------
(defn apply-twice
  "Given a function `f` and a value `x`, applies `f` to `x` two times.
   Example:
   (apply-twice inc 5)
   => (inc (inc 5)) => 7"
  [f x]
  (f (f x)))


;; -------------------------------------------------------------------
;; b. MAP / FILTER / REDUCE
;; -------------------------------------------------------------------
(defn sum-of-squares
  "Takes a sequence of numbers, squares each number, and returns the sum.
   Demonstrates map + reduce.
   Example:
   (sum-of-squares [1 2 3 4]) => 30"
  [nums]
  (reduce + (map #(* % %) nums)))

(defn even-numbers
  "Returns a list of only the even numbers from the input collection.
   Demonstrates filter.
   Example:
   (even-numbers [1 2 3 4 5 6]) => (2 4 6)"
  [nums]
  (filter even? nums))


;; -------------------------------------------------------------------
;; c. RECURSION
;; -------------------------------------------------------------------
(defn factorial
  "Computes the factorial of n using tail recursion.
   (factorial 5) => 120"
  [n]
  (loop [cnt n
         acc 1]
    (if (zero? cnt)
      acc
      (recur (dec cnt) (* acc cnt)))))


;; -------------------------------------------------------------------
;; d. CURRYING & PARTIAL APPLICATION
;; -------------------------------------------------------------------
(defn curried-add
  "Returns a curried version of a 2-argument add function.
   Usage:
   ((curried-add 2) 3) => 5"
  [x]
  (fn [y]
    (+ x y)))

(defn partial-add
  "Returns a function that adds a fixed number to its argument.
   Example:
   (def add5 (partial-add 5))
   (add5 10) => 15"
  [x]
  (partial + x))


;; -------------------------------------------------------------------
;; e. FUNCTION COMPOSITION
;; -------------------------------------------------------------------
(defn inc-double
  "Composes inc and *2 using built-in comp.
   Example usage:
     (inc-double 3) => (inc (* 2 3)) => 7"
  [n]
  ((comp inc #(* 2 %)) n))


;; -------------------------------------------------------------------
;; f. LAZY SEQUENCES
;; -------------------------------------------------------------------
(defn fibonacci
  "Returns an infinite lazy sequence of Fibonacci numbers.
   Example usage:
   (take 10 (fibonacci)) => (0 1 1 2 3 5 8 13 21 34)"
  []
  (letfn [(fib-step [a b]
            (lazy-seq
              (cons a (fib-step b (+ a b)))))]
    (fib-step 0 1)))


;; -------------------------------------------------------------------
;; g. IMMUTABILITY & PERSISTENT DATA STRUCTURES
;; -------------------------------------------------------------------
(defn add-employee
  "Simulates adding an employee to a set. Returns a NEW set, does not mutate.
   Example:
   (def employees #{\"Alice\" \"Bob\"})
   (add-employee employees \"Carol\")
   => #{\"Alice\" \"Bob\" \"Carol\"}"
  [employee-set employee]
  (conj employee-set employee))

;; Another demonstration: updating a map
(defn update-salary
  "Simulates updating the salary of an employee in a map. Returns a NEW map.
   Example:
   (def salary-map {\"Alice\" 50000, \"Bob\" 55000})
   (update-salary salary-map \"Alice\" 60000)
   => {\"Alice\" 60000, \"Bob\" 55000}"
  [salary-map name new-salary]
  (assoc salary-map name new-salary))


;; -------------------------------------------------------------------
;; h. TRANSDUCERS (BONUS)
;; -------------------------------------------------------------------
(defn transduce-even-doubles
  "Demonstrates transducers by:
   1) Filtering even numbers
   2) Doubling each one
   Then sums them up (reduce).
   Example usage:
   (transduce-even-doubles [1 2 3 4 5 6]) => (2+8+12) => 22"
  [nums]
  (let [xf (comp
            (filter even?)
            (map #(* 2 %)))]
    (transduce xf + nums)))


;; -------------------------------------------------------------------
;; MAIN (optionally used by Leiningen if you run `lein run`)
;; -------------------------------------------------------------------
(defn -main
  "Main entry point. Demonstrates usage of the above patterns."
  [& _args]
  (println "Functional Patterns Demo:\n")

  (println "1) Higher-Order Function (apply-twice inc 5):"
           (apply-twice inc 5))

  (println "2) sum-of-squares [1 2 3 4]:"
           (sum-of-squares [1 2 3 4]))

  (println "3) even-numbers [1 2 3 4 5 6]:"
           (even-numbers [1 2 3 4 5 6]))

  (println "4) factorial of 5:"
           (factorial 5))

  (println "5) Currying (curried-add 2) => then call with 3:"
           ((curried-add 2) 3))

  (println "5b) Partial (partial-add 5 10):"
           ((partial-add 5) 10))

  (println "6) inc-double 3 =>"
           (inc-double 3))

  (println "7) fibonacci first 10 =>"
           (take 10 (fibonacci)))

  (println "8) add-employee =>"
           (add-employee #{"Alice" "Bob"} "Carol"))

  (println "9) update-salary =>"
           (update-salary {"Alice" 50000 "Bob" 55000} "Alice" 60000))

  (println "10) transduce-even-doubles =>"
           (transduce-even-doubles [1 2 3 4 5 6]))
  
  (println "\nDone. See `test/patterns/core_test.clj` for unit tests."))

```

---

### Test Suite: `test/patterns/core_test.clj`

```clojure
(ns patterns.core-test
  (:require [clojure.test :refer :all]
            [patterns.core :refer :all]))

(deftest test-apply-twice
  (testing "Higher-order function apply-twice"
    (is (= 7 (apply-twice inc 5)))
    (is (= 9 (apply-twice #(* 2 %) 3)))))

(deftest test-sum-of-squares
  (testing "Map + Reduce pattern (sum-of-squares)"
    (is (= 30 (sum-of-squares [1 2 3 4])))
    (is (= 0 (sum-of-squares [])))))

(deftest test-even-numbers
  (testing "Filter pattern (even-numbers)"
    (is (= '(2 4 6) (even-numbers [1 2 3 4 5 6])))
    (is (empty? (even-numbers [1 3 5 7])))))

(deftest test-factorial
  (testing "Recursion (factorial)"
    (is (= 120 (factorial 5)))
    (is (= 1 (factorial 0)))))

(deftest test-currying-partial
  (testing "Currying & partial application"
    (is (= 5 ((curried-add 2) 3)))
    (let [add5 (partial-add 5)]
      (is (= 10 (add5 5)))
      (is (= 15 (add5 10))))))

(deftest test-inc-double
  (testing "Function composition"
    (is (= 7 (inc-double 3)))
    (is (= 9 (inc-double 4)))))

(deftest test-fibonacci
  (testing "Lazy sequences"
    (is (= [0 1 1 2 3] (take 5 (fibonacci))))))

(deftest test-immutability
  (testing "Immutable operations on sets & maps"
    (let [employees   #{"Alice" "Bob"}
          new-emps    (add-employee employees "Carol")
          salary-map  {"Alice" 50000 "Bob" 55000}
          new-salaries (update-salary salary-map "Bob" 60000)]
      (is (not= employees new-emps))
      (is (= #{"Alice" "Bob" "Carol"} new-emps))
      (is (not= salary-map new-salaries))
      (is (= {"Alice" 50000 "Bob" 60000} new-salaries)))))

(deftest test-transduce-even-doubles
  (testing "Transducer usage: filter even, double, sum"
    (is (= 22 (transduce-even-doubles [1 2 3 4 5 6])))
    (is (= 0 (transduce-even-doubles [])))))
```

---

## 4. How to Run

1. **Install Leiningen** if not already installed:  
   [Leiningen Installation Guide](https://leiningen.org/#install)

2. **Clone or create** the project structure shown above.

3. **Run tests**:

   ```bash
   lein test
   ```

   You should see output similar to:

   ```text
   Running tests in patterns.core-test
   Testing patterns.core-test
   ...
   Ran 9 tests containing X assertions.
   0 failures, 0 errors.
   ```

4. **Run the demo `-main` function** (optional):

   ```bash
   lein run
   ```

   This will print out a demonstration of each pattern in the console.

5. **Explore**:
   - Modify or extend the code.
   - Add new patterns or tests as you learn more about functional programming.

---

# Conclusion

This sample project shows how to implement and test a variety of **functional programming patterns** in **Clojure**:

- **Higher-order functions** (e.g. `apply-twice`)
- **Mapping, filtering, and reducing** (e.g. `sum-of-squares`, `even-numbers`)
- **Recursion** (`factorial`)
- **Currying & partial** (e.g. `curried-add`, `partial-add`)
- **Function composition** (`inc-double`)
- **Lazy sequences** (`fibonacci`)
- **Immutability & persistent data structures** (`add-employee`, `update-salary`)
- **Transducers** (`transduce-even-doubles`)

Feel free to build upon these examples, incorporate them into your own code, and deepen your understanding of functional approaches in Clojure. Enjoy coding!
