import { performance } from 'perf_hooks'
import { logger, metrics, networking, getRandom } from '@whatagoodbot/utilities'
import { clients } from '@whatagoodbot/rpc'

export default async (payload, topicPrefix, broker) => {
  if (payload.service !== process.env.npm_package_name) return
  const startTime = performance.now()
  const functionName = 'dalle'
  logger.debug({ event: functionName })
  metrics.count(functionName)

  if (!payload.arguments) {
    const string = await clients.strings.get('missingArgumentDalle')
    logger.debug({ event: 'missingArgumentDalle' })
    metrics.count('missingArgumentDalle')
    return [{
      topic: 'broadcast',
      payload: {
        message: string.value
      }
    }]
  }
  const string = await clients.strings.get('dalleTakeAWhile')
  const waitResponse = broker.broadcast.validate({
    ...payload,
    message: string.value
  })
  broker.client.publish(`${topicPrefix}broadcast`, JSON.stringify(waitResponse))

  const url = networking.buildUrl('backend.craiyon.com/generate')
  logger.info({ event: 'craiyonRequest', payload: payload.arguments, url })
  const response = await networking.makeRequest(url, {
    method: 'POST',
    body: JSON.stringify({
      prompt: payload.arguments
    })
  })
  const image = `<img src="data:image/webp;base64,${getRandom.fromArray(response.images)}" />`
  logger.info({ event: 'craiyonResponse', payload: response })
  metrics.trackExecution(functionName, 'function', performance.now() - startTime, true)
  return [{
    topic: 'broadcast',
    payload: {
      message: `Results for ${payload.arguments} ${image}`
    }
  }]
}
