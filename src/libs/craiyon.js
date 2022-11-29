import { performance } from 'perf_hooks'
import { logger, metrics, networking, getRandom } from '@whatagoodbot/utilities'
import { clients } from '@whatagoodbot/rpc'
import fs from 'fs'

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
  const response = await networking.makeRequest(url, {
    method: 'POST',
    body: JSON.stringify({
      prompt: payload.arguments
    })
  })
  const imagePayload = getRandom.fromArray(response.images)
  const fileName = `images/${Date.now()}.png`
  fs.writeFileSync(`./${fileName}`, imagePayload, 'base64')

  const image = `https://${process.env.IMAGE_SERVER_URL}/${fileName}`
  metrics.trackExecution(functionName, 'function', performance.now() - startTime, true)
  let message = `Results for ${payload.arguments} <a href="${image}" target="_blank"><img src="${image}"/></a>`
  console.log(payload.client.richText)
  if (payload.client.richText) message = `<table><tr><td>Results for ${payload.arguments}</td></tr><tr><td><a href="${image}" target="_blank" class="image-container"><img src="${image}"/></a></td></tr></table>`
  return [{
    topic: 'broadcast',
    payload: {
      message
    }
  }]
}
