---
title: "XSS attempt"
date: 2026-05-07
slug: xss-attempt
summary: "Fixture de intento de XSS — todos los vectores deben ser sanitizados."
tags:
  - test
published: false
---

Texto normal antes del payload.

<script>alert('xss-1')</script>

Link malicioso: <a href="javascript:alert('xss-2')">click</a>

Imagen con handler: <img src="x" onerror="alert('xss-3')">

Iframe: <iframe src="https://evil.com"></iframe>

Estilo inline: <div style="background:url(javascript:alert('xss-4'))">x</div>

Form: <form action="https://evil.com"><input name="x"><button>submit</button></form>

SVG: <svg onload="alert('xss-5')"><circle r="10"/></svg>

Botón con handler: <button onclick="alert('xss-6')">click</button>

VBScript: <a href="vbscript:msgbox('xss-7')">x</a>

Data URI: <a href="data:text/html,<script>alert('xss-8')</script>">x</a>

Texto normal después del payload.
