import * as cdk from 'aws-cdk-lib'
import { CfnOutput } from 'aws-cdk-lib'
import { type Construct } from 'constructs'
import { Api } from './constracts/api'
import { Auth } from './constracts/auth'
import { Front } from './constracts/front'

export class AwsBedrockSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const region = this.region
    const account = this.account
    const namePrefix = 'bedrock-sample-aws'

    // 認証周りのリソースを作成
    const auth = new Auth(this, 'auth', {
      namePrefix,
    })

    // API周りのリソースを作成
    const api = new Api(this, 'api', {
      namePrefix,
      region,
      idPool: auth.idPool,
    })

    // フロントエンドのリソースを作成
    const front = new Front(this, 'front', {
      namePrefix,
      account,
      frontEnv: {
        region,
        userPoolClientId: auth.client.userPoolClientId,
        userPoolId: auth.userPool.userPoolId,
        identityPoolId: auth.idPool.identityPoolId,
        predictStreamFunctionArn: api.predictStreamFunction.functionArn,
      },
    })

    new CfnOutput(this, 'cloudfront-url', {
      value: `https://${front.cloudFrontDistribution.distributionDomainName}`,
    })

    new CfnOutput(this, 'user-pool-id', {
      value: auth.userPool.userPoolId,
    })

    new CfnOutput(this, 'user-pool-client-id', {
      value: auth.client.userPoolClientId,
    })

    new CfnOutput(this, 'identity-pool-id', {
      value: auth.idPool.identityPoolId,
    })

    new CfnOutput(this, 'predict-stream-function-arn', {
      value: api.predictStreamFunction.functionArn,
    })
  }
}
