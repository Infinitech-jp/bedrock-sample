import { Construct } from 'constructs'
import { Duration } from 'aws-cdk-lib'
import { UserPool, type UserPoolClient } from 'aws-cdk-lib/aws-cognito'
import {
  IdentityPool,
  UserPoolAuthenticationProvider,
} from '@aws-cdk/aws-cognito-identitypool-alpha'
import { type CfnRole } from 'aws-cdk-lib/aws-iam'

export interface AuthProps {
  namePrefix: string
}

export class Auth extends Construct {
  public readonly userPool: UserPool
  public readonly client: UserPoolClient
  public readonly idPool: IdentityPool
  private readonly namePrefix: string

  constructor(scope: Construct, id: string, props: AuthProps) {
    super(scope, id)

    const { namePrefix } = props
    this.namePrefix = namePrefix

    // ユーザープールを作成する
    const userPool = this.createUserPool()

    // ユーザークライアントを作成する
    const client = this.createUserPoolClient(userPool)

    // IDプールを作成する
    const idPool = this.createIdentityPool(userPool, client)

    // IDプール用のロール名を変更する
    this.renameIdentityPoolRoleName(idPool)

    this.client = client
    this.userPool = userPool
    this.idPool = idPool
  }

  private createUserPool(): UserPool {
    const userPoolName = `${this.namePrefix}-user-pool`

    return new UserPool(this, userPoolName, {
      userPoolName,
      deletionProtection: false,
      selfSignUpEnabled: true,
      signInAliases: {
        username: false,
        email: true,
      },
    })
  }

  private createUserPoolClient(userPool: UserPool): UserPoolClient {
    const userPoolClientName = `${this.namePrefix}-client`

    return userPool.addClient(userPoolClientName, {
      userPoolClientName,
      idTokenValidity: Duration.days(1),
    })
  }

  private createIdentityPool(userPool: UserPool, client: UserPoolClient): IdentityPool {
    const identityPoolName = `${this.namePrefix}-id-pool`

    return new IdentityPool(this, identityPoolName, {
      identityPoolName,
      authenticationProviders: {
        userPools: [
          new UserPoolAuthenticationProvider({
            userPool,
            userPoolClient: client,
          }),
        ],
      },
    })
  }

  private renameIdentityPoolRoleName(idPool: IdentityPool): void {
    // 認証済みロールのロール名を変更する
    const cfnAuthenticatedRole = idPool.authenticatedRole.node.defaultChild as CfnRole
    cfnAuthenticatedRole.addPropertyOverride(
      'RoleName',
      `${this.namePrefix}-id-pool-authenticated-role`,
    )

    // 未認証ロールのロール名を変更する
    const cfnUnauthenticatedRole = idPool.unauthenticatedRole.node.defaultChild as CfnRole
    cfnUnauthenticatedRole.addPropertyOverride(
      'RoleName',
      `${this.namePrefix}-id-pool-unauthenticated-role`,
    )
  }
}
