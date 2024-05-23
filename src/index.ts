import Elysia from "elysia"

interface Opts {
  httpDurationMetricName: string
  buckets: number[]
  metricsPath: string
}

interface UserOpts {
  httpDurationMetricName?: string
  buckets?: number[]
  metricsPath?: string
}

const metrics: any = {}

// TODO: all error codes
const codeMap: any = {
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
}

const formatLabels = (labelMap: any) =>
  Object.keys(labelMap)
    .map((key) => `${key}="${labelMap[key]}"`)
    .join(",")

const handleOnRequest = (opts: Opts) => (ctx: any) => {
  // Keep track of the start time of the request
  ctx.store.reqStartTime = process.hrtime.bigint()

  const { metricsPath, httpDurationMetricName } = opts
  const {
    request: { url },
  } = ctx

  if (new URL(url).pathname === metricsPath) {
    const formattedMetrics = Object.keys(metrics)
      .map((k) => `${k} ${metrics[k]}`)
      .join(`\n`)

    return `# HELP ${httpDurationMetricName} duration histogram of http responses labeled with: status_code, method, path\n# TYPE ${httpDurationMetricName} histogram\n${formattedMetrics}`
  }
}

const recordMetrics = (opts: Opts) => (ctx: any) => {
  const { httpDurationMetricName, buckets } = opts

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
  const labelMap = { path, method, status_code }

  // Compute Histogram
  // TODO: dealing with +Inf is not very nice
  const latency = Number(process.hrtime.bigint() - store.reqStartTime) * 1e-9 // [s]
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
      const bucketMetric = `${httpDurationMetricName}_bucket{${formatLabels({
        le: b,
        ...labelMap,
      })}}`

      if (!metrics[bucketMetric]) metrics[bucketMetric] = 0
      if (le === b) metrics[bucketMetric]++
    })

  const sumMetric = `${httpDurationMetricName}_sum{${formatLabels(labelMap)}}`
  if (!metrics[sumMetric]) metrics[sumMetric] = latency
  else metrics[sumMetric] += latency

  const countMetric = `${httpDurationMetricName}_count{${formatLabels(
    labelMap
  )}}`
  if (!metrics[countMetric]) metrics[countMetric] = 1
  else metrics[countMetric] += 1
}

export default (userOpts: UserOpts = {}) => {
  const opts = {
    metricsPath: "/metrics",
    httpDurationMetricName: "http_request_duration_seconds",
    buckets: [0.003, 0.03, 0.1, 0.3, 1.5, 10],
    ...userOpts,
  }

  return new Elysia()
    .onRequest(handleOnRequest(opts))
    .onAfterHandle({ as: 'global' }, recordMetrics(opts))
    .onError({ as: 'global' }, recordMetrics(opts))
}
