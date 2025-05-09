---
title: "Premature optimization is the root of all hair loss"
pubDate: 2014-07-11
tags:
  - optimization
  - graph theory
description: "A cautionary tale about focusing on algorithmic optimization before profiling. I wasted time implementing fancy graph algorithms for a puzzle only to discover that Java startup time was the actual bottleneck."
---


When faced with a need to speed up code, the general advice is to profile it to get an accurate picture of where time is being spent. Many of you have heard by now the old Knuth quote, "Premature optimization is the root of all evil." While I usually remember this, what follows is a bit of a cautionary tale of what happens when you *think* you know where the slowdown is (or will be), instead of bothering to actually find out.

## The puzzle
A while back, I decided to tackle Spotify's online puzzles. You can see my solutions [here](https://github.com/KingMob/Spotify-puzzles). The way it worked was, you coded up your answer in either C, C++, Python or Java, mailed it off to an automatic judge, and would then get a response back telling you if it failed on some input or wasn't fast enough. Two of the problems were quite easy, but the last turned out to be tricky, *though not as tricky as I made it*.

You can see an archive of the puzzle page [here](/supplemental/Bilateral%20Projects%20Puzzlecool%20-%20Spotify.html). The basic problem is that there are a bunch of Spotify employees in either New York or Sweden, and every employee in one location is a member of one or more paired teams with an employee in the other location. There's an upcoming Spotify meeting in Barbados, and someone from every team needs to be there to represent the team. To keep travel costs down, Spotify wants to determine the smallest set of people it needs to have all teams represented.

Now, some of you who took an algorithms class recently may already recognize the problem, but for the rest of us, the structure is that of a bipartite graph, a graph where every vertex (person) can be divided up into two groups (location), and every edge (team) is only *between* the groups, and never *within* one. The problem of determining the minimal set of vertices that is attached to every edge is called the minimum vertex cover problem, and for bipartite graphs, Konig's theorem demonstrated that it's equivalent to a finding a maximum matching, which is the largest set(s) of edges that don't share any vertices.

Clearly, such a problem with deep roots in graph theory requires proper selection of the appropriate algorithm, right?

## The algorithms
I originally started in Java with a naive algorithm, continually picking the person who was on the most remaining teams. It seemed to work on the two small examples listed on the problem page, so I submitted it and... no, it gave incorrect answers. Well, I didn't have access to Spotify's test data, so I started making my own. I quickly realized that my solution must have been *way* off when it returned a list of people that exceeded the total number of employees in one country. Without even knowing the details of my randomly-generated data set, I knew that was wrong, because I could have sent fewer people by just choosing everyone in New York or Sweden. HR would have hated my solution as much as the employees would have loved it.

Since the naive solution wasn't working, I knew there had to be more to the problem, so, I started digging around and found out it was a bipartite maximum matching graph problem. After that, I scanned the literature to choose the "right" algorithm. The Hopcroft-Karp algorithm has the best time, with an O(E√V) worst-case time, where E is the number of edges, and V is the number of vertices. But I chose the relabel-to-front variant of the push-relabel max-flow algorithm (Cormen et al, Introduction to Algorithms, 3rd ed., pp. 748), since according to some empirical papers (Cherkassky 1998; Setubal 1996), it outperforms the Hopcroft-Karp algorithm in practice, despite having a O(V<sup>3</sup>) running time. It's one of the more complicated algorithms to code, but I was convinced algorithmic performance would be an issue. I wrote a Java version, submitted it, and... success, it returned correct answers for all inputs but wait... the automatic judge said it's too slow.

Hmm, maybe I needed to use the bipush selection variant to improve push-relabel performance. Code code code. Nope, still too slow. Maybe I should have tried the Hopcroft-Karp variant after all? I started on that, but then I thought, well, the problem size is actually pretty small, and big-O performance is only guaranteed asymptotically, so maybe the running time is being dominated by incidental overhead. Instead of pausing to consider, I wrote a simpler breadth-first search (BFS) for augmenting paths.

Nope, still too slow.

## The "Eureka" moment
At this point, I wanted to `kill -9` some server process in Sweden. **But instead, I did what I should have done from the start: profiled.** The vertex selection algorithm took only ~200 ms on the largest problem size. Push-relabel and BFS were not too far apart. The remaining setup and I/O only added a bit more to the execution time. What was going on?

Then finally, a horrific realization started to dawn on me. The code judge wasn't examining the algorithmically-interesting parts of my code (how could it?), it was just timing the whole thing from start to finish. So, with a feeling of dread in my stomach, I clocked the whole thing with the maximum problem size from the command-line and it took 5 seconds, only ~400 ms of which was my code. **The entire time was dominated by Java start-up; algorithms were completely irrelevant for the specified problem size.** At this point, everyone in the coffee shop probably heard me curse.

So what did I do? Well, I considered teaching myself Python, which I thought would be fun, but I suspected it might suffer the same startup overhead. In the end, I rewrote the entire thing using the BFS algorithm in C++, which I hadn't used since college. I submitted it and finally... success!

## Coda
What did I (re)learn?

**Profile first.** Without knowing where/what to optimize, you're flying blind and possibly wasting time. Data trumps intuition in this case.
