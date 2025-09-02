# Cloudflare Workers: OpenAI Proxy

OpenAIのAPIキーをフロントに置かず、**Cloudflare Workers**経由で`/chat`にPOSTして利用するテンプレートです。

## セットアップ

```bash
# 1) wranglerをインストール
npm i -g wrangler

# 2) ログイン
wrangler login

# 3) このフォルダへ移動
cd cloudflare-openai-proxy

# 4) OpenAI APIキーを保管（Secret）
wrangler secret put OPENAI_API_KEY
# -> プロンプトでキーを貼り付け

# 5) デプロイ
wrangler deploy
```

デプロイ後のエンドポイント：
```
https://<your-subdomain>.workers.dev/chat
```

## CORS
`wrangler.toml` の `ALLOW_ORIGIN` を、公開するフロントのオリジンに**限定**してください（例：`https://yourname.github.io`）。デフォルトは`*`。

## 使い方（例）
```bash
curl -X POST "https://<your-subdomain>.workers.dev/chat"   -H "Content-Type: application/json"   -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role":"user","content":"日本語で自己紹介して"}]
  }'
```
