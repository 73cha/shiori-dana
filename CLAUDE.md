# ブックマーク管理アプリ
このプロジェクトでは、ブックマーク管理アプリを開発します。

## 開発に当たって
各サービスのAPIについては、最新のドキュメントを必ず参照してください。

## あなたの役割
- 各種APIを調べて実装例を提示
- コードレビュー
- Pencilを使ってデザイン
- gitを使ってのバージョン管理
- githubのリポジトリへのプシュ

## 要件定義
以下の要件を満たしたアプリを開発します。

- NotionのDBでブックーマークを管理
- ブックマークの削除ができる
- ブックマークのタグの編集ができる
- ブックマークのリアルタイム検索

## 必要なUI
- リアルタイム検索の検索バー
- ページネーション
- ブックマークのカードUI

## 技術スタック
- フレームワーク: Svelte
- 言語: TypeScript
- ビルドツール: Vite
- アーキテクチャ: SPA
- データフロー: Notion DB → JSON → Pagefindインデックス

## 利用したいサービス
- DB: Notion
- リアルタイム検索: [pagefind](https://pagefind.app/)
- ホスティング: Vercel
- 再ビルド: VercelのDeploy Hookを利用
- 再ビルド通知: Vercel Serverless Functionsでステータスをポーリングし、Popoverでトースト表示

### 再ビルドの流れ

Vercel APIのトークンをクライアントに露出させないため、Vercel Serverless Functions（API Routes）を中間に挟みます。

```
UIの更新ボタン
  ↓ POST
Serverless Function → Deploy Hook → ビルド開始
  ↓ deployment ID を返す
クライアントがポーリング
  ↓ GET
Serverless Function → Vercel API でステータス確認
  ↓ "READY" になったら
Popoverでトースト通知
```

## 状態遷移

### メインフロー
初期読み込み（Notion → JSON → Index） → 一覧表示

### 一覧表示からの操作
- **検索中**: Pagefindで絞り込み → 一覧表示
- **タグ編集**: Notion API更新 → 一覧表示
- **削除確認**: ダイアログ表示 → 削除実行 → 一覧表示
- **更新リクエスト**: Deploy Hook POST → ビルド中

### 更新フロー（Deploy Hook）
ビルド中（ポーリング監視） → 更新完了（トースト通知） → 一覧表示

### エラー時
ビルド中 → エラー（トーストでエラー表示） → 一覧表示

## 開発に必要なもの
NotionのAPIキーについては、`.env`ファイルに記載があります。