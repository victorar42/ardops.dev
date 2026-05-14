---
title: "Syntax highlighting demo (fixture)"
date: 2026-05-14
slug: syntax-highlighting-demo
summary: "Fixture for spec 016 — demonstrates Shiki tokenization across all 21 allowlisted languages plus fallback paths."
tags:
  - fixture
published: false
---

Este post fixture cubre la **allowlist completa de 21 lenguajes** + los
casos de fallback (lenguaje desconocido, bloque sin lenguaje, inline
`code`). No se publica (`published: false`); se usa solo desde
`tests/build-blog-check.sh` vía `--check-only-validation`.

## 1. bash

```bash
#!/usr/bin/env bash
# CI bootstrap
set -euo pipefail
export AWS_REGION="us-east-1"
if [ "$CI" = "true" ]; then
  echo "running in CI"
fi
```

## 2. sh

```sh
sh -c 'echo $PATH'
```

## 3. javascript

```javascript
const greet = (name) => `hola, ${name}`;
greet("ardops");
```

## 4. typescript

```typescript
interface User { id: number; email: string; }
const u: User = { id: 1, email: "a@b.com" };
```

## 5. json

```json
{ "ok": true, "items": [1, null, "x"] }
```

## 6. yaml

```yaml
service: api
ports:
  - 80
  - 443
env:
  NODE_ENV: production
```

## 7. dockerfile

```dockerfile
FROM alpine:3.20
RUN apk add --no-cache curl
CMD ["sh", "-c", "echo hi"]
```

## 8. hcl

```hcl
resource "aws_s3_bucket" "logs" {
  bucket = "ardops-logs"
}
```

## 9. python

```python
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)
```

## 10. go

```go
package main
import "fmt"
func main() { fmt.Println("hi") }
```

## 11. rust

```rust
fn main() {
    let x: i32 = 42;
    println!("{}", x);
}
```

## 12. sql

```sql
SELECT id, email FROM users WHERE created_at > NOW() - INTERVAL '7 days';
```

## 13. diff

```diff
- old line
+ new line
@@ -1 +1 @@
```

## 14. html

```html
<!doctype html>
<html lang="es"><body><h1>hi</h1></body></html>
```

## 15. css

```css
.foo { color: var(--accent); padding: 1rem; }
```

## 16. markdown

```markdown
# heading

**bold** and _italic_ and `inline`.
```

## 17. ini

```ini
[section]
key = value
```

## 18. toml

```toml
[package]
name = "ardops"
version = "1.0.0"
```

## 19. makefile

```makefile
all:
	@echo "build"
```

## 20. groovy

```groovy
pipeline {
  stages {
    stage("build") { steps { sh "echo hi" } }
  }
}
```

## 21. nginx

```nginx
server {
  listen 80;
  server_name ardops.dev;
  location / { return 200 "ok"; }
}
```

## Fallback: lenguaje fuera de allowlist

```cobol
DISPLAY 'Hello, World!'.
```

## Fallback: bloque sin lenguaje

```
plain text fence
```

## Inline code (no se tokeniza)

Lorem ipsum `echo "hi"` dolor sit amet `const x = 1` consectetur.

## XSS smoke test (debe escaparse, no ejecutarse)

```html
<script>alert('xss')</script>
<img src=x onerror="alert(1)">
```
