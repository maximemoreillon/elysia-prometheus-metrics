import { describe, expect, it } from "bun:test"
import { app } from "../src/server"

describe("Metrics", () => {
  let metrics: string

  describe("Histogram", () => {
    it("Should contain metrics in the right bucket", async () => {
      await app.handle(new Request("http://localhost/delay?duration=1000"))
      const response = await app.handle(new Request("http://localhost/metrics"))
      metrics = await response.text()
      const expectedMetric = `http_request_duration_seconds_bucket{le="1.5",path="/delay",method="GET",status_code="200"} 1`
      expect(metrics).toInclude(expectedMetric)
    })
  })

  describe("Path", () => {
    it("Should contain metrics for the requested path", async () => {
      await app.handle(new Request("http://localhost/greetings"))
      const response = await app.handle(new Request("http://localhost/metrics"))
      metrics = await response.text()
      expect(metrics).toInclude(`path="/greetings"`)
    })
  })

  describe("Method", () => {
    it("Should contain metrics for POST methods", async () => {
      await app.handle(new Request("http://localhost/", { method: "POST" }))
      const response = await app.handle(new Request("http://localhost/metrics"))
      metrics = await response.text()
      expect(metrics).toInclude(`method="POST"`)
    })
  })

  describe("Status code", () => {
    it("Should contain metrics related to 500 errors", async () => {
      await app.handle(new Request("http://localhost/error"))
      const response = await app.handle(new Request("http://localhost/metrics"))
      metrics = await response.text()
      expect(metrics).toInclude('status_code="500')
    })
    it("Contain metrics related to 404 errors", async () => {
      await app.handle(new Request("http://localhost/nonexxistent"))
      const response = await app.handle(new Request("http://localhost/metrics"))
      metrics = await response.text()
      expect(metrics).toInclude('status_code="404')
    })
  })
})
