import Elysia from "elysia"

interface Opts {
  httpDurationMetricName?: string
  buckets?: number[]
  metricsPath?: string
}

const metrics: any = {}

const formatParams = (paramMap: any) =>
  Object.keys(paramMap)
    .map((key) => `${key}="${paramMap[key]}"`)
    .join(",")

// TODO: all error codes
const codeMap: any = {
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
}

const addToMetrics = (metric: string, val: number) => {
  if (!metrics[metric]) metrics[metric] = val
  else metrics[metric] += val
}

const handleRequestStart = (opts: Opts) => (ctx: any) => {
  // Keep track of the start time of the request
  ctx.store.startTime = process.hrtime.bigint()

  // TODO:
  const {
    metricsPath = "/metrics",
    httpDurationMetricName = "http_request_duration_seconds",
  } = opts

  const {
    request: { url },
  } = ctx

  const { pathname } = new URL(url)
  if (pathname === metricsPath) {
    const formattedMetrics = Object.keys(metrics)
      .map((k) => `${k} ${metrics[k]}`)
      .join(`\n`)

    return `# HELP ${httpDurationMetricName} duration histogram of http responses labeled with: status_code, method, path\n# TYPE ${httpDurationMetricName} histogram\n${formattedMetrics}`
  }
}

const recordMetrics = (opts: Opts) => (ctx: any) => {
  const {
    httpDurationMetricName = "http_request_duration_seconds",
    buckets = [0.003, 0.03, 0.1, 0.3, 1.5, 10],
  }: Opts = opts

  const {
    store,
    request: { url, method },
    set,
    code,
  } = ctx
  const { status } = set
  const status_code = codeMap[code] || status

  const { pathname: path } = new URL(url)

  // TODO: allow customization
  const paramMap = { path, method, status_code }

  // Compute Histogram
  // TODO: dealing with +Inf is not very nice
  const latency = Number(process.hrtime.bigint() - store.startTime) * 1e-9 // [s]
  let le = buckets
    .slice()
    .reverse()
    .reduce((acc, bucket) => (latency < bucket ? bucket : acc), Infinity)
    .toString() // Needed to deal with +Inf

  if (le === "Infinity") le = "+Inf"

  buckets
    .map((b) => b.toString())
    .concat("+Inf")
    .forEach((b) => {
      const bucketMetric = `${httpDurationMetricName}_bucket{${formatParams({
        le: b,
        ...paramMap,
      })}}`

      if (!metrics[bucketMetric]) metrics[bucketMetric] = 0
      if (le === b) metrics[bucketMetric]++
    })

  const sumMetric = `${httpDurationMetricName}_sum{${formatParams(paramMap)}}`
  const countMetric = `${httpDurationMetricName}_count{${formatParams(
    paramMap
  )}}`

  addToMetrics(sumMetric, latency)
  addToMetrics(countMetric, 1)
}

export default (opts: Opts = {}) =>
  new Elysia()
    // .onAfterHandle(handleRequestStart) // Seemingly not needed
    .onRequest(handleRequestStart(opts))
    .onAfterHandle(recordMetrics(opts))
    .onError(recordMetrics(opts))
