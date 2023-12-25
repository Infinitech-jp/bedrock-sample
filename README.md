# Amazon Bedrock sample

Amazon Bedrock を利用したサンプルアプリケーションです。

## ローカル環境

![bedrock-local.drawio.png](docs%2Fbedrock-local.drawio.png)

### 前提条件

ローカル環境で動作させるためには以下の条件が必要です。

- Node.jsがインストールされていること
- AWSのクレデンシャルがローカル環境で利用できること
- AWS CDKツールキットがインストールされていること
- Dockerがインストールされていて、起動されていること
  - AWS CDKがDockerイメージを作成するために必要です

### ローカル環境の構築

- ルートディレクトリで以下を実行する
  - `npm ci`
- バックエンド環境の構築
  - cdkディレクトリに移動する
    - `cd cdk`
  - ライブラリをインストールする
    - `npm ci`
  - デプロイする
    - `cdk deploy`
    - 途中でデプロイ確認が入るので、`y`を入力する
  - デプロイが完了したら、出力されたCognito情報、Lambda情報をメモする
    - `Outputs:`
      - `userpoolid`
      - `userpoolclientid`
      - `identitypoolid`
      - `predictstreamfunctionarn`
- フロントエンド環境の構築
  - フロントエンドのディレクトリに移動する
    - `cd ../front`
  - ライブラリをインストールする
    - `npm ci`
  - 環境変数を設定する
    - `cp .env.template .env`
    - `.env`ファイルを開き、リージョンと先ほどメモしたCognito情報、Lambda情報を設定する
      - `VITE_APP_REGION`: `ap-northeast-1`
      - `VITE_APP_USER_POOL_ID`: CDKで出力された`userpoolid`
      - `VITE_APP_USER_POOL_CLIENT_ID` : CDKで出力された`userpoolclientid`
      - `VITE_APP_IDENTITY_POOL_ID` : CDKで出力された`identitypoolid`
      - `VITE_APP_PREDICT_STREAM_FUNCTION_ARN` : CDKで出力された`predictstreamfunctionarn`
  - ローカルサーバーを起動する
    - `npm run dev`
    - `http://localhost:3000`にアクセスする
- 動作確認
  - 画面を開くと、ログイン画面が表示されるので、Create Accountでユーザー登録を行う
  - 確認コードがメールで送信されるので、確認コードを入力してConfirmをクリックする
  - サンプル画面が表示されるので、下部のテキストエリアに文章を入力して送信をクリックする

### ローカル環境の削除

- バックエンド環境の削除
  - cdkディレクトリに移動する
    - `cd cdk`
  - デプロイしたリソースを削除する
    - `cdk destroy`
    - 途中で削除確認が入るので、`y`を入力する
  - 念の為、AWSコンソールから以下を確認する
    - Cognitoユーザープール
    - CognitoIDプール
    - Lambda関数
    - IAMロール、ポリシー
  - CloudWatch Logsからロググループを削除する
    - CloudWatch Logsは自動で作成されているため、手動で削除する
      - /aws/lambda/bedrock-sample-local-predict-stream
