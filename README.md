# Elysia Prometheus metrics

[![coverage report](https://gitlab.com/moreillon_ci/moreillon_npm/elysia-prometheus-metrics/badges/master/coverage.svg)](https://gitlab.com/moreillon_ci/moreillon_npm/elysia-prometheus-metrics/-/commits/master)

An Elysia.js middleware to export Prometheus metrics. Is is intended as a replacement to the [express prometheus bundle](https://www.npmjs.com/package/express-prom-bundle) for Elysia. Currently, it only supports exporting the `http_request_duration_seconds` histogram.

## Installation

```
bun add elysia-prometheus-metrics
```

## Usage

```typescript
import { Elysia } from "elysia"
import metricsMiddleware from "elysia-prometheus-metrics"

const middlewareOptions = {}

new Elysia()
  .use(metricsMiddleware(middlewareOptions))
  .get("/", () => "Hello world")
  .listen(8080)
```
