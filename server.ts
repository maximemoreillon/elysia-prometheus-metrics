import { Elysia } from "elysia"
import middleware from "."
new Elysia()
  .use(middleware())
  .get("/", ({ body }) => "Hi")
  .get("/error", ({ body }) => {
    throw "You asked for it..."
  })
  .listen(8080)
