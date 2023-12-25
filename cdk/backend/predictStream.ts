import type { Writable } from 'node:stream'
import type { Context, Handler } from 'aws-lambda'
import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime'

declare let awslambda: {
  streamifyResponse: (
    streamHandler: (
      event: PredictRequest,
      responseStream: Writable,
      context: Context,
    ) => Promise<void>,
  ) => Handler
}

interface PredictRequest {
  messages: string
}

export const handler = awslambda.streamifyResponse(async (event, responseStream, context) => {
  if (event.messages == null) {
    console.error('messages is required')
    responseStream.end()
    return
  }

  const client = new BedrockRuntimeClient({
    region: process.env.MODEL_REGION,
  })

  const params = {
    max_tokens_to_sample: 3000,
    prompt: event.messages,
  }

  const command = new InvokeModelWithResponseStreamCommand({
    modelId: process.env.MODEL_ID,
    body: JSON.stringify(params),
    contentType: 'application/json',
  })
  const res = await client.send(command)

  if (res?.body != null) {
    for await (const streamChunk of res.body) {
      if (streamChunk.chunk?.bytes == null) {
        break
      }
      const body = JSON.parse(new TextDecoder('utf-8').decode(streamChunk.chunk?.bytes))
      if (body?.completion != null) {
        responseStream.write(body.completion)
      }
      if (body?.stop_reason != null) {
        break
      }
    }
  }

  responseStream.end()
})
