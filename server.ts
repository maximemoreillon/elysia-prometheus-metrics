import { Elysia } from "elysia"
import metricsMiddleware from "."
import { sleep } from "bun"

const middlewareOptions = {}

export const app = new Elysia()
  .use(metricsMiddleware(middlewareOptions))
  .get("/", () => "Root")
  .get("/greetings", () => "Hello world")
  .post("/", () => "OK")
  .get("/error", () => {
    throw "You asked for it"
  })
  .get("/delay", async ({ query }) => {
    const { duration = "100" } = query
    await sleep(Number(duration))
    return "Kept you waiting huh?"
  })
  .listen(8080)
