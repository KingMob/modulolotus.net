---
title: "You should test less - skip irrelevant tests with impact analysis"
pubDate: 2025-03-04
tags: 
  - testing
  - devops 
  - TIA 
  - test-impact analysis 
  - optimization 
  - performance
description: "Test-impact analysis (TIA) optimizes CI pipelines by running only relevant tests based on code changes, reducing test execution time and resource consumption."
---

When we make a change to code, we should only run tests that can be proven to be relevant. Running unrelated tests tells you nothing useful, wastes electricity, and makes your scrum master cry.

So why do we run irrelevant tests to begin with? Our testing habits came from unit tests, where the goal is to make tests so fast, you can rerun them all frequently. But this broke down as test suites got longer and slower.

I have personally seen CI for PRs take up to 120 minutes to complete, and full end-to-end tests so slow they could only be run overnight.

If your tests finish in under 15 minutes, great! ...this post isn't for you, close the tab. 

## What can we do instead of pulling our hair out?
There's a solution that deserves to be better-known outside FAANGs: **test-impact analysis (TIA)**. With TIA, you use code and file dependencies to skip tests that cannot be affected by changes in a PR.

TIA is not new. Variants of it are used in Google's [TAP](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/45861.pdf). Jest and Vitest support it. Microsoft coined the term itself, and [offers it](https://learn.microsoft.com/en-us/azure/devops/pipelines/test/test-impact-analysis?view=azure-devops) in Azure DevOps. Thought leaders [have thought about it](https://martinfowler.com/articles/rise-test-impact-analysis.html).

## How does test-impact analysis work?
You might already have a pitchfork in hand, shouting "It's unsafe to skip tests!"

But done correctly, TIA will only skip tests it *knows* are irrelevant. You can trust it as much as you trust your compiler (and some of the TIA methods are the same as your compiler's).

### Automatic
Automatic TIA methods use static code analysis or run-time coverage to figure out dependencies. You don't have to change anything with your tests for them to work. However, they don't usually understand non-code changes, so they run all tests to be safe in that case.

#### 1. **File dependencies**  
   File dependencies are fast, safe, and simple, but can "overtest". Not every test in a file may be affected by a change in a depended-on code file. It's best for codebases that don't import/export more than they need to (e.g., Python `__init__.py` files that import everything under the sun.)

#### 2. **Program dependency graphs**  
   Program dependency graphs are what compilers use in optimization, but they work for TIA, too. By analyzing data dependencies and control flow, they can match up tests to individual lines of code. They won't overtest, though they still have to be cautious when non-code files change.

#### 3. **Coverage**  
   Coverage can map code dependencies that aren't amenable to static analysis, like which branch of an if a test always takes.  
   This comes with a downside, though; to collect coverage info requires a full test run to start. If you want to use TIA in a fresh CI environment, you need to run all tests beforehand, store that coverage data, and share it with CI. (If you don't, CI has to run the full test suite, defeating the whole purpose.) Coverage methods work well, at the cost of more complexity, and harder CI integration.

### Manual
In manual specification, you write out all the dependencies yourself. (This is more common in full build systems like Bazel.)
The major advantage is you can use TIA for *non*-code changes.

But the major disadvantage is that unlike the automatic methods, which can't miss tests, if you specify the dependencies wrong, you can.

## Complementary speed-up methods
TIA is safe, cheap, requires minimal changes, and combines well with other acceleration methods.

#### 1. **Test suites**  
   The traditional speed-up approach divides tests into suites. When updating front-end-related code, run only the front-end suite. While simple, this method is coarse and needs manual setup.

#### 2. **Parallelization**  
   Parallelization is very effective, but has several gotchas. Tests must run safely in parallel, without inter-test dependencies. Shared resources (networks, databases) must handle concurrent access or be replicated. Manual parallelization is labor-intensive, while automated approaches requires checking to ensure no subtle heisenbugs. 

#### 3. **Predictive test selection**  
   With this, you choose tests based on how likely they are to fail. This is mostly useful for FAANGs that can't run all relevant tests for each PR. And it doesn't eliminate their need to run all tests periodically anyway. You probably don't need predictive test selection just yet.

   Predictive selection can be as simple as choosing the top-_n_ failing tests, or as sophisticated as building [a machine-learning model that predicts relevant tests](https://engineering.fb.com/2018/11/21/developer-tools/predictive-test-selection/) from code changes.

#### 4. **LLMs**  
   Since it's 2025, you *can* ask ChatGPT to select relevant tests, but this is fuzzy. It probably misses relevant tests sometimes and runs irrelevant ones. That being said, I suspect LLM/ML techniques might do a decent job of mapping tests to changes in non-code files, but I'm not sure I'd trust it with the keys to the car just yet.

### Try it out on your tests! Or don't, I'm not your mom.
If you're sick of waiting on CI tests to finish, give test-impact analysis a try. If you consume too much coffee already, and don't want another excuse to get a refill while you wait, give TIA a try. If you're the sort who always turn off the light when you exit the room to save energy, definitely try TIA.


----

[^faang-scale]: In Google's TAP paper linked above, they say they deal with 1 commit _per second_.
