import { Construct } from 'constructs'
import { Bucket, ObjectOwnership } from 'aws-cdk-lib/aws-s3'
import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import {
  CfnOriginAccessControl,
  Distribution,
  PriceClass,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import { RemovalPolicy } from 'aws-cdk-lib'
import { type CfnDistribution } from 'aws-cdk-lib/aws-lightsail'
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { NodejsBuild } from 'deploy-time-build'

export interface FrontEnv {
  region: string
  userPoolClientId: string
  userPoolId: string
  identityPoolId: string
  predictStreamFunctionArn: string
}

export interface FrontProps {
  namePrefix: string
  account: string
  frontEnv: FrontEnv
}

export class Front extends Construct {
  public readonly cloudFrontDistribution: Distribution
  private readonly namePrefix: string

  constructor(scope: Construct, id: string, props: FrontProps) {
    super(scope, id)

    const { account, namePrefix, frontEnv } = props
    this.namePrefix = namePrefix

    // ソースS3バケットを作成
    const sourceBucket = this.createSourceBucket()
    // ロギングS3バケットを作成
    const loggingBucket = this.createLoggingBucket()
    // CloudFrontディストリビューションを作成
    const cloudFrontDistribution = this.createCloudFrontDistribution(sourceBucket, loggingBucket)
    // S3バケットに対してCloudFrontからのアクセスを許可する
    this.addToResourcePolicy(sourceBucket, account, cloudFrontDistribution)
    // S3バケットにデプロイ
    this.deployToS3(sourceBucket, cloudFrontDistribution, frontEnv)

    this.cloudFrontDistribution = cloudFrontDistribution
  }

  private createSourceBucket(): Bucket {
    const bucketName = `${this.namePrefix}-front-src-bucket`
    return new Bucket(this, bucketName, {
      bucketName,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
    })
  }

  private createLoggingBucket(): Bucket {
    const bucketName = `${this.namePrefix}-front-logging-bucket`
    return new Bucket(this, bucketName, {
      bucketName,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
    })
  }

  private createCloudFrontDistribution(originBucket: Bucket, loggingBucket: Bucket): Distribution {
    const cloudFrontName = `${this.namePrefix}-front-distribution`
    const distribution = new Distribution(this, cloudFrontName, {
      comment: cloudFrontName,
      defaultRootObject: 'index.html',
      priceClass: PriceClass.PRICE_CLASS_200,
      defaultBehavior: {
        origin: new S3Origin(originBucket, {
          originId: `${this.namePrefix}-front-origin`,
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.ALLOW_ALL,
      },
      logBucket: loggingBucket,
      enableLogging: true,
      logIncludesCookies: true,
    })

    // オリジンアクセスコントロール (OAC)を作成
    const oacName = `${this.namePrefix}-front-origin-access-control`
    const cfnOriginAccessControl = new CfnOriginAccessControl(this, oacName, {
      originAccessControlConfig: {
        name: oacName,
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
        description: 'Access Control',
      },
    })

    const cfnDistribution = distribution.node.defaultChild as CfnDistribution
    // 自動で作られるOAIをディストリビューションの紐付けを削除
    cfnDistribution.addPropertyOverride(
      'DistributionConfig.Origins.0.S3OriginConfig.OriginAccessIdentity',
      '',
    )
    // OACをディストリビューションの紐付け
    cfnDistribution.addPropertyOverride(
      'DistributionConfig.Origins.0.OriginAccessControlId',
      cfnOriginAccessControl.attrId,
    )

    return distribution
  }

  private addToResourcePolicy(
    sourceBucket: Bucket,
    account: string,
    cloudFrontDistribution: Distribution,
  ): void {
    sourceBucket.addToResourcePolicy(
      new PolicyStatement({
        sid: 'AllowCloudFrontServicePrincipal',
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [sourceBucket.bucketArn + '/*'],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${account}:distribution/${cloudFrontDistribution.distributionId}`,
          },
        },
      }),
    )
  }

  private deployToS3(
    destinationBucket: Bucket,
    distribution: Distribution,
    frontEnv: FrontEnv,
  ): void {
    new NodejsBuild(this, `${this.namePrefix}-front-s3-deployment`, {
      assets: [
        {
          path: '../front',
          exclude: ['dist', 'node_modules', '.gitignore'],
        },
      ],
      destinationBucket,
      distribution,
      outputSourceDirectory: 'dist',
      buildCommands: ['npm ci', 'npm run build'],
      buildEnvironment: {
        VITE_APP_REGION: frontEnv.region,
        VITE_APP_USER_POOL_CLIENT_ID: frontEnv.userPoolClientId,
        VITE_APP_USER_POOL_ID: frontEnv.userPoolId,
        VITE_APP_IDENTITY_POOL_ID: frontEnv.identityPoolId,
        VITE_APP_PREDICT_STREAM_FUNCTION_ARN: frontEnv.predictStreamFunctionArn,
      },
    })
  }
}
