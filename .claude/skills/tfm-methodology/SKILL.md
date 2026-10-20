---
name: tfm-methodology
description: Check research-question clarity, methodological fit, feasibility, scope and ethics of thesis topics for the UPF Master in Governance (Migration track), and keep the lab and feasibility engine consistent.
---

# TFM methodology check

Context (UPF thesis page, verify yearly): 20 ECTS, article format, up to 10,000 words including references, English, topic plus two supervisors in February, submission mid-June, defence late June or early July. Never hard-code dates; the user enters confirmed ones.

## For each topic or lab version ask
- **Question**: one main question, 2-4 subquestions, answerable, bounded in place, period and unit. Descriptive, explanatory or evaluative is explicit.
- **Fit**: does the method answer this question? State what it can and cannot support (correlation vs descriptive comparison vs credible causal inference). Two or three cases never support statistical generalisation.
- **Evidence**: is each required document, dataset or interview obtainable? Name the fallback if access fails (restricted administrative data, interviews).
- **Scope**: about 10,000 words and one term. Narrow if more than about 3 cases, 3 dimensions or a new technical skill.
- **Skills**: if the method is technical and the user lacks it, say what learning takes (weeks) and include it in the workload.
- **Ethics**: avoid vulnerable participants (minors, irregular migrants) where public documents suffice; consent and data protection for officials.
- **Career**: which role families and portfolio outputs follow; separate what a thesis demonstrates from what needs employment.

## Engine rules (src/lib/lab.ts, feasibility.ts)
Scores are 1-5 author judgments with a written reason. Lab changes are deterministic deltas with a reason string. Overall scores show an uncertainty band. Any new parameter must add reasons for each delta and a unit test proving the direction of the change. Scores must stay within 1-5.
