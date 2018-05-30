{:title "A case study in refactoring Clojure trie code for performance "
 :slug "clojure-trie-performance"
 :layout :post
 :klipse true
 :tags  ["clojure" "performance" "trie"]}
 

<link rel="stylesheet" href="/assets/chartist.min.css"></link>
<link rel="stylesheet" href="/assets/chart.css"></link>
    
Last summer, I was doing HackerRank for fun and whiteboard practice, and I came across [a nifty little trie exercise](https://www.hackerrank.com/challenges/ctci-contacts/problem). The challenge was to add a list of contacts to a trie, and report on the number of contacts beginning with a list of prefixes.

I used my favorite language, Clojure, and quickly arrived at the correct solution, but many of these coding exercise sites have time constraints, and the idiomatic Clojure was too slow.

What follows is how you take beautiful Clojure, and accelerate it when needed. (NB: Only do this for hot paths, do not take this as general Clojure style advice.) All the code is available [here](https://github.com/KingMob/clojure-trie-performance).

## A Clojure Performance Journey

For those who don't recall, tries are specialized data structures that excel at storing data with common prefixes (e.g., words). Conceptually, it's a tree, where each node represents part of the prefix, and the complete path to a terminal node represents the data.

<img src="/img/Clojure-trie-example.svg" style="width: 50%; margin: 0 auto; display: block">

In this example, you can see a trie storing the words: ale, all, alley, are, art, at, and ate. (Terminal nodes are tinted.)

For a list of English words, the most straightforward implementation is a tree, where each node (other than the top) has a letter, a `terminal` flag to indicate whether the node is the last letter in a word, and an array of 26 pointers to other nodes, representing the alphabet. (Various optimizations exist to compress long chains, but we will focus on this implementation for now.)

## Solutions

#### Standard data structures

Here's the basic implementation. It has the major trie functions to add a new word, and count the number of words beginning with a prefix. In this example, `db` is a series of nested hash-maps, and the `:*` key indicates the node is terminal.

```clojure
(defn add [db name]
  (update-in db (seq name) (fnil assoc {}) :* true))

(defn count-terminations [db]
  (let [terminations (if (:* db) 1 0)]
    (reduce +
            terminations
            (map count-terminations
                 (vals (dissoc db :*))))))

(defn find-partial [db partial]
  (println
   (if-let [sub-db (get-in db (seq partial))]
     (count-terminations sub-db)
     0)))
```

This works, but was way too slow.

#### Replace hash-maps with array-maps

At each level, data is small, since we know there are at most 27 keys (26 plus terminal), so maybe if we force it to use array-map over hash-map it will be faster?

```clojure
(defn add [db name]
  (update-in db (seq name) (fnil assoc (array-map)) :* true))
```
That doesn't help.

#### Switch to eager over lazy evaluation

Clojure defaults to lazy evaluation, which requires a certain amount of overhead. What if we force eager evaluation with `transduce` instead of `reduce`?

```clojure
(defn count-terminations [db]
  (let [terminations (if (:* db) 1 0)]
    (transduce
     (map count-terminations)
     +
     terminations
     (vals db))))
```
That shaves off a few seconds, but still not good enough.

#### Switch to a record
Alright, well, what about using a record with named fields and cache the default empty node?

```clojure
(declare default-alphabet-trie-node)

(def empty-alphabet-vector (vec (repeat 26 nil)))

(defrecord AlphabetTrieNode [val terminates? children]
  TrieNode
  (add-substring [n [c & cs :as s]]
    (->AlphabetTrieNode
     val
     (if c terminates? true)
     (if c
       (update children
               (alpha-idx c)
               #(add-substring (if (nil? %)
                                 (default-alphabet-trie-node c)
                                 %)
                               cs))
       children)))

  (prefix [n s]
    (->> s
         (seq)
         (map alpha-idx)
         (interpose :children)
         (cons :children)
         (get-in n)))

  (count-words [n]
    (loop [word-count (if terminates? 1 0)
           legit-children (filter some? children)]
      (if (seq legit-children)
        (let [[child & cs] legit-children]
          (recur (+ word-count
                    (if (:terminates? child) 1 0))
                 (apply conj cs
                        (filter some? (:children child)))))
        word-count)))

  (count-w-prefix [n s]
    (if-let [subn (prefix n s)]
      (count-words subn)
      0)))

(def default-alphabet-trie-node
  (memoize
   (fn [val]
     (->AlphabetTrieNode val false empty-alphabet-vector))))
```

Oof, no, the code is both more complicated and slower. Most likely because protocols/records/types introduce function dispatch overhead. The real benefits of records/types is that field access is much faster, which we'll exploit later.

## Algorithmic/data change

OK, let's re-evaluate, profile, and rethink the problem. (Tweaking rarely beats using the right data structures/algorithms.) We can trade off a bit of memory to save a ton of computation time. Instead of recomputing the subtree count afresh each time, we can keep track of the word count at each node, and increase as we go. Every time we add a word, we just increment the count of each parent node by 1. Then, the `count` operation for a prefix is just a read-out of the value at that node. 

Just to check, I applied this to the original solution, and got a speed-up of 10x, but it still wasn't fast enough, and using records enables some unique JVM optimizations, so we'll continue with that. Here are the changed parts:

```clojure
(defrecord AlphabetTrieNode [val terminates? word-count children]
  TrieNode
  (add-substring [n [c & cs :as s]]
    (->AlphabetTrieNode
     val
     (if c terminates? true)
     (inc word-count)
     (if c
       (update children
               (alpha-idx c)
               (fnil #(add-substring % cs)
                     (default-alphabet-trie-node c)))
       children)))

  (count-words [n]
    word-count)

  (count-w-prefix [n s]
    (if-let [subn (prefix n s)]
      (count-words subn)
0)))
```

Now this speeds up by a factor of 50. We're getting closer.

## JVM optimizations

Clojure uses immutable data by default, for simplicity, ease of reasoning, and thread safety. But immutable data structures have an inherent overhead when "mutating": copies are unavoidable. What if we ditch immutability? 

#### Mutable fields

We can do this by adding metadata to fields indicating they're `volatile-mutable`. They can then be directly mutated in code.

```clojure
(deftype AlphabetTrieNode [val
                           ^:volatile-mutable terminates?
                           ^:volatile-mutable word-count
                           ^:volatile-mutable children]
  TrieNode
  (add-substring [n [c & cs]]
    (set! word-count (inc word-count))
    (if-not c
      (set! terminates? true)
      (let [i (alpha-idx c)
            child (children i)]
        (when-not child
          (->> c
               (default-alphabet-trie-node)
               (assoc children i)
               (set! children)))
        (add-substring (children i) cs))))

  (prefix [n s]
    (loop [curr n
           [c & cs] s]
      (if (and c curr)
        (recur (get (.children curr) (alpha-idx c))
               cs)
        curr)))
```

Note the use of `set!` in the mutable code. We're finally seeing subsecond execution time for this exercise.

#### Thread-unsafe with type hints

What else can we do? Well, if we don't care about thread safety, we can switch to `unsynchronized-mutable` fields to avoid concurrency overhead. We can also switch to Java primitives and arrays with type hints. 

```clojure
(deftype AlphabetTrieNode [^:unsynchronized-mutable terminates?
                           ^:unsynchronized-mutable ^long word-count
                           ^:unsychronized-mutable ^objects children]
  TrieNode
  (add-substring [n [c & cs]]
    (set! word-count (inc word-count))
    (if-not c
      (set! terminates? true)
      (let [i (int (alpha-idx c))
            child (aget children i)]
        (when-not child
          (aset children i (default-alphabet-trie-node c)))
        (add-substring (aget children i) cs))))
```

Great, we're down to a half second now, and fast enough for HackerRank's picky tests. Done!

## Alternatives

There are other performance-enhancing techniques that either didn't apply here or didn't have an effect on the speed in this particular case (e.g., reflection was never an issue here), or were just paths not taken.

#### Transients

Transients are a way to use mutable data structures with code that has the same shape as your regular immutable code. Unfortunately, they do not work with records/types. They helped a bit with the hash-maps, but only by ~20%.

#### Loop/recur

If a loop or function returns a value in the tail position, the current stack frame can be safely overwritten with the new value. `recur` can be used to avoid blowing up a deep stack, and it probably eased memory pressure here, but I didn't analyze its performance effect separately.

#### Reflection and type-hints

If the compiler can't figure out what a data type is when invoking a method, it will slow things down massively. Use `(set! *warn-on-reflection* true)` in a file to check. I tested this, but there was no reflection in the hot path.

Unfortunately, it's not really possible to type-hint protocol method parameters, and you can't defer to a regular helper function with mutable fields, since mutable fields are private. At that point, you may want to try another method or use `definterface`.

## Results
Here are the raw results. The first three are for standard data structures, the remainder use records/types.

<div class="ct-chart ct-perfect-fourth"></div>

<script src="/assets/chartist.min.js"></script>
<script src="/assets/clojure-trie-performance-chart.js">

