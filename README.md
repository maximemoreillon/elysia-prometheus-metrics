# Elysia Prometheus metrics

An Elysia.js middleware to export Prometheus metrics. Is is intended as a replacement to the [express prometheus bundle](https://www.npmjs.com/package/express-prom-bundle) for Elysia.

## Usage

```typescript
import { Elysia } from "elysia"
import metricsMiddleware from "."

const middlewareOptions = {}

new Elysia()
  .use(metricsMiddleware(middlewareOptions))
  .get("/", () => "Hello world")
  .listen(8080)
```
