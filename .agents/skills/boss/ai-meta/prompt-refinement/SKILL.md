---
name: prompt-refinement
description: "Refine and optimize user prompts for large language models. Suggests rewrites, examples, and parameter guidance to improve reliability and output quality."
category: ai-meta
risk: safe
source: acquired
tags: [prompt-engineering, refinement, llm, instruction-tuning]
triggers: [refine, optimize, improve, prompt, prompt-refinement]
allowed-tools: Read Write
---

# Prompt Refinement Skill

## Purpose

Help users improve prompts for large language models by:

- clarifying intent and constraints
- suggesting minimal, high-impact rewrites
- providing example inputs and expected outputs
- recommending model parameters and evaluation tests

## Usage

- Use trigger words like `refine`, `optimize prompt`, or `improve prompt`.
- Accepts: original prompt, target model, desired tone, and output format.
- Returns: rewritten prompts (1–3 variants), rationale for changes, and simple evaluation checklist.

## Limitations

- Does not perform fine-tuning; focuses on prompt-level improvements.
- Users should validate outputs across target models and seeds.

## Examples

- Input: "Write an ad for coffee"
- Output: Variants with audience, tone, CTA, and length guidance.

## Maintenance

- Category: `ai-meta`
- Folder: `.agents/skills/boss/ai-meta/prompt-refinement/`

If this skill was acquired from an external source, update `source` and add provenance details here.
