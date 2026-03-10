# コンポーネント設計

## コンポーネントツリー

```
+page.svelte（SPAのメインページ）
├── <header>
│   ├── タイトル
│   ├── <button>（更新）
│   └── SearchBar
├── BookmarkCard（繰り返し）
│   ├── 画像 / タイトル / 説明 / タグ一覧
│   └── <button>（削除）
├── Pagination
├── 検索結果なし表示（{#if} で制御）
├── <dialog>（削除確認などモーダル全般）
└── <div popover>（トースト通知）
```

## コンポーネント一覧

| # | コンポーネント  | パス                                         |
| - | --------------- | -------------------------------------------- |
| 1 | Pagination      | `src/lib/components/Pagination.svelte`      |
| 2 | SearchBar       | `src/lib/components/SearchBar.svelte`       |
| 3 | BookmarkCard    | `src/lib/components/BookmarkCard.svelte`    |

ボタン・ダイアログ・トースト・ヘッダーは HTML/Popover API（`<button>`, `<dialog>`, `<div popover>`, `<header>`）で実現する。

---

## 各コンポーネント設計

### 1. Pagination

クライアントサイドページネーション。ページ状態は URL サーチパラメータ（`?page=N`）で管理する。

```typescript
interface Props {
  currentPage: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}
```

**派生状態:**
```typescript
let totalPages: number = $derived(Math.ceil(totalItems / pageSize))
let hasPrevious: boolean = $derived(currentPage > 1)
let hasNext: boolean = $derived(currentPage < totalPages)
```

**動作:**
- 前へ / 次へ / ページ番号は `<button>` で `onPageChange` を呼び出し
- 境界では前へ/次へを disabled
- totalPages が 1 以下のときは非表示

---

### 2. SearchBar

リアルタイム検索の入力欄。

```typescript
interface Props {
  value: string
  onSearch: (query: string) => void
}
```

**ローカル状態:**
```typescript
let inputValue: string = $state(value)
let debounceTimer: number | null = $state(null)
```

**動作:**
- 入力から 300ms のデバウンス後に `onSearch` を呼び出し
- テキスト入力時にクリアボタンを表示
- デザイントークン: `--shioridana-input`, `--shioridana-radius-pill`

---

### 3. BookmarkCard

個々のブックマークを表示するカード。

```typescript
interface Props {
  bookmark: Bookmark
  onDelete: (bookmark: Bookmark) => void
}
```

**構成:**
- サムネイル画像（`bookmark.img`、`loading="lazy"`）
- タイトル（リンク: `bookmark.url`、`target="_blank"`）
- 説明文（`bookmark.description`）
- タグ一覧（`bookmark.tags` を `{#each}` で表示）
- 削除ボタン（`<button>`）

**動作:**
- 検索語のハイライトは親側から `use:highlightMatches` action で適用
- デザイントークン: `--shioridana-card`, `--shioridana-card-foreground`, `--shioridana-radius-m`

---

---

## 状態管理

### 状態の所在

| 状態 | 所在 | 説明 |
| --- | --- | --- |
| bookmarks | +page.svelte | 全ブックマークデータ |
| miniSearchIndex | +page.svelte | MiniSearch インデックス |
| searchQuery | +page.svelte | 検索クエリ |
| filteredBookmarks | +page.svelte | 検索結果（派生） |
| currentPage | URL サーチパラメータ | SvelteKit の `$page.url.searchParams` から派生 |
| paginatedBookmarks | +page.svelte | 表示対象（派生） |
| deleteTargetId | +page.svelte | 削除対象のブックマークID |
| isUpdating | +page.svelte | 更新中フラグ |

### データフロー

- 親 → 子: props（単方向）
- ページ遷移: `onPageChange` → `goto('?page=N')` → `$page.url.searchParams` が更新 → `currentPage` が派生更新
- 検索クエリ変更時、ページを 1 にリセット
- 更新成功時、bookmarks を差し替え + インデックス再構築
- 削除成功時、bookmarks から除去 + インデックスから削除

---

## 共有型定義

### src/lib/types/bookmark.ts

```typescript
export interface Bookmark {
  id: string
  title: string
  url: string
  description: string
  img: string
  tags: string[]
}

```

### src/lib/types/api.ts

```typescript
import type { Bookmark } from './bookmark'

export interface UpdateResponse {
  bookmarks: Bookmark[][]
}

export interface ErrorResponse {
  error: string
}
```

---

## ユーティリティ

### src/lib/utils/search.ts
- `createSearchIndex(bookmarks)`: MiniSearch インデックス生成
- `rebuildSearchIndex(index, bookmarks)`: インデックス再構築
- 検索対象フィールド: title, description, tags
- ブースト: title × 2、tags × 1.5
- オプション: fuzzy 0.2、prefix true

### src/lib/utils/highlight.ts
- CSS Custom Highlight API + `TreeWalker` による検索語ハイライト
- Svelte action（`use:highlightMatches`）として提供
- DOM を書き換えず `::highlight()` 擬似要素でスタイリング
- 参考: https://janosh.dev/posts/svelte-highlight-matching-text-action

### src/lib/utils/api.ts
- `fetchUpdatedBookmarks()`: POST `/api/v1/bookmarks/update/`
- `deleteBookmark(id)`: DELETE `/api/v1/bookmarks/[id]`
- タグ編集API: 将来の拡張（後述）

---

## ディレクトリ構成（SvelteKit）

```
src/
├── lib/
│   ├── components/      # 全コンポーネントをフラットに配置
│   ├── server/          # Notion API（サーバー専用）
│   │   ├── notion.ts
│   │   └── types.ts
│   ├── types/           # bookmark.ts, api.ts
│   ├── utils/           # search.ts, highlight.ts, api.ts
│   └── styles/          # tokens.css, reset.css, global.css
├── routes/
│   ├── +layout.ts       # export const ssr = false
│   ├── +layout.svelte   # グローバルスタイル読み込み
│   ├── +page.svelte     # メインページ
│   └── api/v1/bookmarks/
│       ├── update/
│       │   └── +server.ts
│       └── [id]/
│           └── +server.ts  # DELETE: アーカイブ
├── app.html
└── app.css
```

---

## 将来の拡張: タグ編集

### 概要
ブックマークのタグをフロントエンドから追加・削除・修正できるようにする。現在タグ編集は Notion 側で行っているが、アプリ内で完結させることで UX を向上させる。

### UI
- 修正: タグをダブルクリック → `contenteditable` で編集 → `blur` で確定
- 削除: タグの右端に削除ボタン`X`配置する → 確認ダイアログの表示
- 追加: タグリストの右端に`+`ボタンを配置し、タグを追加できるようにする

### データフロー
```
タグ操作（追加 / 削除 / 修正）
  ↓ 操作のたびにデバウンス（立て続けの操作をまとめる）
  ↓ デバウンス後、編集後のタグ配列を JSON に成形
  ↓ PATCH /api/v1/bookmarks/[id]（ペイロード: { tags: string[] }）
  ↓ +server.ts ハンドラーで Notion API の multi_select を更新
  ↓ レスポンス
クライアント
  ↓ bookmarks の該当エントリを更新
  ↓ MiniSearch インデックスを更新
```

### 変更が必要なファイル
- `src/lib/components/TagList.svelte`: タグ一覧を独立コンポーネントとして切り出し、編集UIを実装
- `src/lib/utils/api.ts`: `updateBookmarkTags(id, tags)` を追加
- `src/routes/api/v1/bookmarks/[id]/+server.ts`: `PATCH` ハンドラーを追加
- `src/lib/server/notion.ts`: タグ更新関数を追加
