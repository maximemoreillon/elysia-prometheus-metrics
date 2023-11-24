import { Elysia } from "elysia"
import metricsMiddleware from "."

const middlewareOptions = {}

new Elysia()
  .use(metricsMiddleware(middlewareOptions))
  .get("/", () => "Hello world")
  .listen(8080)
