#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { Tags } from 'aws-cdk-lib'
import { LocalBedrockSampleStack } from '../lib/bedrock-sample-local-stack'
import { type IConstruct } from 'constructs'

class DeletionPolicySetter implements cdk.IAspect {
  constructor(private readonly policy: cdk.RemovalPolicy) {}

  visit(node: IConstruct): void {
    if (node instanceof cdk.CfnResource) {
      node.applyRemovalPolicy(this.policy)
    }
  }
}

function addCommonSetting(stack: cdk.Stack): void {
  cdk.Aspects.of(localBedrockSampleStack).add(new DeletionPolicySetter(cdk.RemovalPolicy.DESTROY))
  Tags.of(stack).add('Project', 'bedrock-sample')
}

const app = new cdk.App()

const region = app.node.tryGetContext('region')

const localBedrockSampleStack = new LocalBedrockSampleStack(app, 'LocalBedrockSampleStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region },
})
addCommonSetting(localBedrockSampleStack)
