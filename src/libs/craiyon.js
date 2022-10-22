import { buildUrl, makeRequest } from '../utils/networking.js'
import getRandomString from '../utils/getRandomString.js'

export default async (payload) => {
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
