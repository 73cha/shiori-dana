<script lang="ts">
  import type { Flags } from '$lib/types'
  import { page } from '$app/state'
  import { onDestroy, onMount } from 'svelte'
  import { utils } from '$lib/utils/index'
  import { highLightKeyword } from '$lib/actions/hight-light-keyword'
  import { delegateClickForDialog } from '$lib/actions/delegate-click-for-dialog'
  import { BookmarkStore } from '$lib/stores/bookmark.svelte'
  import { EventManager } from '$lib/modules/event-manager'

  import LoadingBoundary from '$lib/components/LoadingBoundary.svelte'
  import ErrorBoundary from '$lib/components/ErrorBoundary.svelte'
  import MessageBoundary from '$lib/components/MessageBoundary.svelte'
  import Bookmark from '$lib/components/Bookmark.svelte'
  import BookmarkEditDialog from '$lib/components/BookmarkEditDialog.svelte'
  import PageNation from '$lib/components/PageNation.svelte'

  let isError = $state(false)

  const PER_PAGE = 16
  const PER_ITEM = 3

  const listeners: Array<() => void> = []

  // ── URL params ─────────────────────────────────────────────────────────────

  const searchParamTag = $derived(page.url.searchParams.get('tag'))
  const searchParamQuery = $derived(page.url.searchParams.get('query'))
  const searchParamPage = $derived(page.url.searchParams.get('page'))

  // ── Level 1 ────────────────────────────────────────────────────────────────

  const flags: Flags = $derived({
    isInitializing: !isError && BookmarkStore.normalized.length === 0,
    isFilteringByTag: !!(searchParamTag && !searchParamQuery),
    isFilteringByQuery: !!(searchParamQuery && !searchParamTag),
    isFilteringByDefault: !searchParamTag && !searchParamQuery,
  })

  // SEE: ## `filterdBokkmarks` in docs/memo.md
  const filteredBookmarks = $derived.by(() => {
    return BookmarkStore.editable.filter((bookmark) => {
      // 検索欄での検索
      if (
        flags.isFilteringByQuery &&
        searchParamQuery &&
        (bookmark.title.includes(searchParamQuery.toLowerCase()) ||
          bookmark.description.includes(searchParamQuery.toLowerCase()) ||
          bookmark.tags.some((tag) =>
            tag.name.toLowerCase().includes(searchParamQuery.toLowerCase()),
          ))
      ) {
        return bookmark
      }

      // タグでの取得
      if (flags.isFilteringByTag) {
        return bookmark.tags.some((tag) => tag.name === searchParamTag)
      }

      // 通常の取得
      if (flags.isFilteringByDefault) {
        return bookmark
      }
    })
  })

  // ── Level 2 ────────────────────────────────────────────────────────────────

  const bookmarksLength = $derived(filteredBookmarks.length)

  // ── Level 3 ────────────────────────────────────────────────────────────────

  const totalPages = $derived(Math.ceil(bookmarksLength / PER_PAGE))

  // ── Level 4 ────────────────────────────────────────────────────────────────

  const validSearchParamPage = $derived.by(() => {
    const params = parseInt(searchParamPage ?? '1', 10)

    if (isNaN(params) || params > totalPages || params < 1) {
      return 1
    }

    return params
  })

  // ── Level 5 ────────────────────────────────────────────────────────────────

  const start = $derived((validSearchParamPage - 1) * PER_PAGE)
  const end = $derived(start + PER_PAGE)

  // MEMO:
  // 上流に状態・下流に副作用
  onMount(async () => {
    await BookmarkStore.retrieve()

    const handleError = () => {
      isError = true
    }

    const handleInitialize = () => {
      isError = false
    }

    listeners.push(() => EventManager.off('error', handleError))
    EventManager.on('error', handleError)

    listeners.push(() => EventManager.off('initialize:start', handleInitialize))
    EventManager.on('initialize:start', handleInitialize)
  })

  onDestroy(() => {
    listeners.forEach((listener) => {
      listener()
    })

    listeners.length = 0
  })
</script>

<svelte:head>
  <title>{utils.pageTitle()}</title>
  <meta name="description" content="個人的なブックマーク管理アプリ 栞棚" />
  <meta name="color-scheme" content="light dark" />
</svelte:head>

<LoadingBoundary isLoading={flags.isInitializing} />

<MessageBoundary
  flgs={flags}
  len={bookmarksLength}
  tag={searchParamTag ?? ''}
  query={searchParamQuery ?? ''}
/>

<ErrorBoundary {isError} />

<div
  class="BookmarkList"
  use:highLightKeyword={searchParamQuery ?? ''}
  use:delegateClickForDialog
>
  {#if bookmarksLength > 0}
    <div class="BookmarkListLayout">
      {#each filteredBookmarks.slice(start, end) as bookmark (bookmark.id)}
        <Bookmark {bookmark} />
        <BookmarkEditDialog {bookmark} />
      {/each}
    </div>

    <PageNation
      totalPage={totalPages}
      perItem={PER_ITEM}
      current={validSearchParamPage}
    />
  {/if}
</div>

<style>
  .BookmarkList {
    --_inline-size: 1400px;
    margin-block-start: 2rem;
    margin-inline: auto;
    max-inline-size: var(--_inline-size);
    contain: content;
  }

  .BookmarkListLayout {
    --_column-gap: 1.5rem;
    --_min-column-width: 20rem;
    /* 包含ブロックが十分なサイズなら、最大４つのカラムが並ぶ */
    --_max-column-count: 4;
    /*
      * 包含ブロックの幅からギャップの合計値を引く
      * 最大カラムが4の時、`gap`は3列あるので`-1`
      * その結果から1カラムの幅を計算する
      * ギャップの合計値が引かれた包含ブロックの幅を、
      * 最大カラム数で割ると1カラムの幅が求まる
     */
    --_calculated-column-width: calc(
      (100% - var(--_column-gap) * (var(--_max-column-count) - 1)) /
        var(--_max-column-count)
    );
    --_column-width: min(
      100%,
      max(var(--_calculated-column-width), var(--_min-column-width))
    );
    display: block grid;
    gap: 1rlh var(--_column-gap);
    grid-template-columns: repeat(auto-fill, minmax(var(--_column-width), 1fr));
  }

  :global(::highlight(search-result)) {
    color: red;
  }
</style>
