#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { LocalBedrockSampleStack } from '../lib/bedrock-sample-local-stack'

const app = new cdk.App()

const region = app.node.tryGetContext('region')

new LocalBedrockSampleStack(app, 'LocalBedrockSampleStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region },
})
