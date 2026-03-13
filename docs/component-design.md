# コンポーネント設計

## コンポーネントツリー

```
+page.svelte（SPAのメインページ）
├── <header>
│   ├── タイトル
│   ├── <button>（更新）
│   └── SearchBar
├── BookmarkCard（繰り返し）
│   ├── 画像 / タイトル / 説明 / 日付 / タグ一覧
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

ボタン・ダイアログ・トースト・ヘッダー・タグ一覧・検索結果なし表示は HTML/Popover API（`<button>`, `<dialog>`, `<div popover>`, `<header>`）で実現する。

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
- 日付（`bookmark.date`、`<time>` 要素で表示）
- タグ一覧（`bookmark.tags` を `{#each}` で表示）
- 削除ボタン（`<button>`）

**動作:**
- 検索語のハイライトは親側から `use:highlightMatches` action で適用
- タグクリックで `?tag=xxx` URLパラメータによる絞り込み
- デザイントークン: `--shioridana-card`, `--shioridana-card-foreground`, `--shioridana-radius-m`

---

---

## 状態管理

### 状態の所在

| 状態 | 所在 | 説明 |
| --- | --- | --- |
| bookmarks | +page.svelte | 全ブックマークデータ（load関数から取得） |
| searchQuery | +page.svelte | 検索クエリ |
| filteredBookmarks | +page.svelte | 検索結果（`Array.filter()` による派生） |
| currentPage | URL サーチパラメータ | SvelteKit の `$page.url.searchParams` から派生 |
| paginatedBookmarks | +page.svelte | 表示対象（派生） |
| deleteTargetId | +page.svelte | 削除対象のブックマークID |
| isUpdating | +page.svelte | 更新中フラグ |

### データフロー

- 親 → 子: props（単方向）
- ページ遷移: `onPageChange` → `goto('?page=N')` → `$page.url.searchParams` が更新 → `currentPage` が派生更新
- 検索: `Array.filter()` で title / description / tags を部分一致検索
- 検索クエリ変更時、ページを 1 にリセット
- 更新成功時、`invalidateAll()` で bookmarks を再取得
- 削除成功時、`invalidateAll()` で bookmarks を再取得
- タグフィルター: タグクリック → `?tag=xxx` URLパラメータで絞り込み

---

## 共有型定義

### src/lib/types.ts

```typescript
export interface Bookmark {
  id: string
  title: string
  url: AnyUrl
  description: string
  img: AnyUrl
  tags: { id: string; tag: string }[]
  date: YYYYMMDD
}

export type BookmarksResponse = {
  bookmarks: Bookmark[][]
}

export type DeleteResponse = {
  success: true
}

export type ErrorResponse = {
  error: string
}

export type YYYYMMDD = `${YYYY}-${MM}-${DD}`

export type AnyUrl = HttpUrl | HttpsUrl
```

---

## ユーティリティ

### src/lib/utils/page-title.ts
- `pageTitle(title?)`: ページタイトルを合成（`title | APP_NAME` または `APP_NAME`）

### src/lib/utils/highlight.ts
- CSS Custom Highlight API + `TreeWalker` による検索語ハイライト
- Svelte action（`use:highlightMatches`）として提供
- DOM を書き換えず `::highlight()` 擬似要素でスタイリング

### src/lib/utils/api.ts
- `fetchUpdatedBookmarks()`: POST `/api/v1/bookmarks/update/`
- `deleteBookmark(id)`: DELETE `/api/v1/bookmarks/[id]`

---

## ディレクトリ構成（SvelteKit）

```
src/
├── lib/
│   ├── components/      # 全コンポーネントをフラットに配置
│   ├── server/          # Notion API（サーバー専用）
│   │   └── notion.ts
│   ├── types.ts         # Bookmark, AnyUrl, YYYYMMDD 等
│   ├── utils/           # page-title.ts, highlight.ts, api.ts
│   └── styles/          # design-token.css
├── routes/
│   ├── +layout.server.ts # load関数（Notion → bookmarks取得）
│   ├── +layout.svelte    # グローバルスタイル読み込み
│   ├── +page.svelte      # メインページ
│   └── api/v1/bookmarks/
│       ├── update/
│       │   └── +server.ts
│       └── [id]/
│           └── +server.ts  # DELETE: アーカイブ
├── app.html
└── app.css
```
