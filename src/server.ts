import { Elysia } from "elysia"
import { sleep } from "bun"
import metricsMiddleware from "."

const port = 8080
const middlewareOptions = {}

export const app = new Elysia()
  .use(metricsMiddleware(middlewareOptions))
  .get("/", () => "GET /")
  .post("/", () => "POST /")
  .get("/greetings", () => "Hello")
  .get("/delay", async ({ query }) => {
    const { duration = "100" } = query
    await sleep(Number(duration))
    return "Kept you waiting huh?"
  })
  .get("/error", () => {
    throw "You asked for it"
  })
  .listen(port, () => console.log(`Elysia listening on port ${port}`))
