import { buildUrl, makeRequest } from '../utils/networking.js'
import getRandomString from '../utils/getRandomString.js'

export default async (payload) => {
  if (!payload.arguments) {
    return {
      topic: 'responseRead',
      payload: {
        key: 'missingArgumentDalle',
        category: 'system'
      }
    }
  }
  const url = buildUrl('backend.craiyon.com/generate')
  const response = await makeRequest(url, {
    method: 'POST',
    body: JSON.stringify({
      prompt: payload.arguments
    })
  })
  const image = 'data:image/png;base64,' + getRandomString(response.images)
  return { payload: { image } }
}
