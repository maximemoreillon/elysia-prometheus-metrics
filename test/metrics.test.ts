import { describe, expect, it } from "bun:test"
import { app } from "../src/server"

describe("/metrics", () => {
  describe("GET /metrics", () => {
    it("Should serve metrics", async () => {
      const { status } = await app.handle(
        new Request("http://localhost/metrics")
      )
      expect(status).toBe(200)
    })
  })
})
