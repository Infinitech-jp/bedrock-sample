import { Construct } from 'constructs'
import { Duration } from 'aws-cdk-lib'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { localNamePrefix } from '../utils'
import { type IdentityPool } from '@aws-cdk/aws-cognito-identitypool-alpha'
import { type CfnRole, Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'

interface ApiProps {
  region: string
  idPool: IdentityPool
}

export class Api extends Construct {
  public readonly predictStreamFunction: NodejsFunction

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id)

    const { region, idPool } = props

    // Bedrock用のLambda関数を作成する
    const predictStreamFunction = this.createPredictStreamFunction(region)

    // Lambda関数に権限を付与する
    this.grantRoleAndPolicyTo(predictStreamFunction, idPool)

    this.predictStreamFunction = predictStreamFunction
  }

  private createPredictStreamFunction(region: string): NodejsFunction {
    const functionName = `${localNamePrefix}-predict-stream`

    return new NodejsFunction(this, functionName, {
      functionName,
      runtime: Runtime.NODEJS_18_X,
      entry: './backend/predictStream.ts',
      timeout: Duration.minutes(15),
      bundling: {
        nodeModules: ['@aws-sdk/client-bedrock-runtime'],
      },
      environment: {
        MODEL_REGION: region,
        MODEL_ID: 'anthropic.claude-instant-v1',
      },
    })
  }

  private grantRoleAndPolicyTo(predictStreamFunction: NodejsFunction, idPool: IdentityPool): void {
    // IDプールの認証済みロールからの呼びだしを許可する
    predictStreamFunction.grantInvoke(idPool.authenticatedRole)

    // ロール名を変更する
    const predictStreamRole = predictStreamFunction.node.findChild('ServiceRole').node
      .defaultChild as CfnRole
    predictStreamRole.addPropertyOverride('RoleName', `${localNamePrefix}-predict-stream-role`)

    // Bedrock を利用できるように権限を付与する
    const bedrockPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      resources: ['*'],
      actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
    })
    predictStreamFunction.role?.addToPrincipalPolicy(bedrockPolicy)
  }
}
