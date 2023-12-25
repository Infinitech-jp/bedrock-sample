import { type Construct } from 'constructs'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { RemovalPolicy } from 'aws-cdk-lib'

export const localNamePrefix = 'bedrock-sample-local'

export function createLogGroup(scope: Construct, idPrefix: string, logGroupName: string): LogGroup {
  return new LogGroup(scope, `${idPrefix}LogGroup`, {
    logGroupName,
    retention: RetentionDays.SIX_MONTHS,
    removalPolicy: RemovalPolicy.DESTROY,
  })
}
