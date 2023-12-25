import { InvokeWithResponseStreamCommand, LambdaClient } from '@aws-sdk/client-lambda'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity'
import { fetchAuthSession } from 'aws-amplify/auth'

interface PredictStreamRequest {
  messages: string
}

export async function* predictStream(req: PredictStreamRequest): AsyncGenerator<string> {
  const region = import.meta.env.VITE_APP_REGION
  const userPoolId = import.meta.env.VITE_APP_USER_POOL_ID
  const idPoolId = import.meta.env.VITE_APP_IDENTITY_POOL_ID
  const cognito = new CognitoIdentityClient({ region })
  const providerName = `cognito-idp.${region}.amazonaws.com/${userPoolId}`
  const idToken = (await fetchAuthSession()).tokens?.idToken?.toString() ?? ''

  const lambda = new LambdaClient({
    region: region,
    credentials: fromCognitoIdentityPool({
      client: cognito,
      identityPoolId: idPoolId,
      logins: {
        [providerName]: idToken,
      },
    }),
  })

  const res = await lambda.send(
    new InvokeWithResponseStreamCommand({
      FunctionName: import.meta.env.VITE_APP_PREDICT_STREAM_FUNCTION_ARN,
      Payload: JSON.stringify(req),
    }),
  )
  const events = res.EventStream!

  for await (const event of events) {
    if (event.PayloadChunk) {
      yield new TextDecoder('utf-8').decode(event.PayloadChunk.Payload)
    }

    if (event.InvokeComplete) {
      break
    }
  }
}
