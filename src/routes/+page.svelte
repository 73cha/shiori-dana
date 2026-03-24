<script lang="ts">
  import type { Bookmark, BookmarksResponse, Flags } from '$lib/types'
  import { page } from '$app/state'
  import { onDestroy, onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { utils } from '$lib/utils/index'
  import { highLightKeyword } from '$lib/actions/hight-light-keyword'
  import LoadingBoundary from '$lib/components/LoadingBoundary.svelte'
  import ErrorBoundary from '$lib/components/ErrorBoundary.svelte'
  import MessageBoundary from '$lib/components/MessageBoundary.svelte'

  // SEE: ## `normalizedBookmarks` in docs/memo.md
  let normalizedBookmarks = $state<Bookmark[]>([])

  // SEE ## `editableBookmarks` in docs/memo.md
  let editableBookmarks = $state<Bookmark[]>([])

  let pageNationIndex = $state(0)
  let isError = $state(false)
  const listeners = $state<
    { el: HTMLElement; fn: (event: MouseEvent) => void }[]
  >([])

  const PER_PAGE = 16
  const PER_ITEM = 3

  // ── URL params ─────────────────────────────────────────────────────────────

  const searchParamTag = $derived(page.url.searchParams.get('tag'))
  const searchParamQuery = $derived(page.url.searchParams.get('query'))
  const searchParamPage = $derived(page.url.searchParams.get('page'))

  // ── Level 1 ────────────────────────────────────────────────────────────────

  const flags: Flags = $derived({
    isInitializing: !isError && editableBookmarks.length === 0,
    isFilteringByTag: !!(searchParamTag && !searchParamQuery),
    isFilteringByQuery: !!(searchParamQuery && !searchParamTag),
    isFilteringByDefault: !searchParamTag && !searchParamQuery,
  })

  // SEE: ## `filterdBokkmarks` in docs/memo.md
  const filteredBookmarks = $derived.by(() => {
    return editableBookmarks.filter((bookmark) => {
      // 検索欄での検索
      if (
        flags.isFilteringByQuery &&
        searchParamQuery &&
        (bookmark.title.includes(searchParamQuery) ||
          bookmark.description.includes(searchParamQuery) ||
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

  const pageNationItems = $derived.by(() => {
    return Array.from(Array(totalPages), (_, i) => i + 1)
      .map((v, _, self) => {
        if (v % PER_ITEM === 1) {
          return self.slice(v - 1, PER_ITEM + (v - 1))
        }
      })
      .filter((v) => v !== undefined)
  })

  // ── Level 5 ────────────────────────────────────────────────────────────────

  const start = $derived((validSearchParamPage - 1) * PER_PAGE)
  const end = $derived(start + PER_PAGE)

  const pageNationLength = $derived(pageNationItems.length - 1)

  // ── Level 6 ────────────────────────────────────────────────────────────────

  const hasNextPageNation = $derived(pageNationIndex < pageNationLength)
  const hasPrevPageNation = $derived(pageNationIndex > 0)

  // ── Functions ──────────────────────────────────────────────────────────────

  const incrementPageNationIndex = () => (pageNationIndex += 1)
  const decrementPageNationIndex = () => (pageNationIndex -= 1)

  // SEE: ## ページネーション in docs/memo.md
  const resetPageNationIndex = () => (pageNationIndex = 0)
  const isCurrentPage = (pageNum: number) => pageNum === validSearchParamPage

  const searchParamBuilder = (pageNumber: number) => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const params = new URLSearchParams(page.url.searchParams)

    params.set('page', `${pageNumber}`)

    return `?${params.toString()}`
  }

  const searchByQuery = (event: Event) => {
    const target = event.target as HTMLInputElement
    const query = target.value.trim()

    if (!query) {
      return
    }

    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const params = new URLSearchParams(page.url.searchParams)

    // MEMO:
    // 検索の時は、`query`以外のパラメーターは削除する
    params.delete('tag')
    params.delete('page')
    params.set('query', query.toLowerCase())

    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(`?${params.toString()}`, { keepFocus: true, noScroll: true })

    target.value = ''
  }

  const fetchBookmarks = async () => {
    isError = false

    const response = await fetch('/api/v1/bookmarks')

    if (response.status !== 200) {
      isError = true

      return
    }

    const { bookmarks }: BookmarksResponse = await response.json()

    const data = bookmarks.flat().sort((a, b) => b.date.localeCompare(a.date))

    normalizedBookmarks = data
    editableBookmarks = data
  }

  const removeBookmark = async (id: string) => {
    isError = false

    const snapshot = $state.snapshot(editableBookmarks)

    // MEMO:
    // テンプレートからはすぐに取り除く
    editableBookmarks = editableBookmarks.filter((bookmark) => {
      return bookmark.id !== id
    })

    const response = await fetch(`/api/v1/bookmarks/${id}`, {
      method: 'DELETE',
    })

    if (response.status !== 200) {
      isError = true

      editableBookmarks = snapshot

      return
    }
  }

  const reInitializingBookmarks = async () => {
    normalizedBookmarks.length = 0
    editableBookmarks.length = 0

    await fetchBookmarks()
  }

  const saveBookmark = async (
    id: string,
    title: string,
    tags: { id: string; name: string }[],
  ) => {
    isError = false

    const snapshot = $state.snapshot(editableBookmarks)

    const response = await fetch(`/api/v1/bookmarks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: title,
        tags: tags,
      }),
    })

    if (response.status !== 200) {
      isError = true

      editableBookmarks = snapshot

      return
    }

    await reInitializingBookmarks()
  }

  // MEMO:
  // 上流に状態・下流に副作用
  onMount(async () => {
    await fetchBookmarks()

    // SEE: ## `bookmarkList` in docs/memo.md
    const bookmarkList = document.querySelector<HTMLElement>('.BookmarkList')

    if (!bookmarkList) {
      return
    }

    // SEE: ## `toggleDialog` in docs/memo.md
    const toggleDialog = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const id = target.dataset.targetDialog ?? ''
      const dialog = document.getElementById(id)
      const isDialog = (element: HTMLElement | null) =>
        element instanceof HTMLDialogElement

      if (isDialog(target)) {
        target.close()
      }

      if (!isDialog(dialog)) {
        return
      }

      if (dialog.open) {
        dialog.close()
      } else {
        dialog.showModal()
      }
    }

    listeners.push({ el: bookmarkList, fn: toggleDialog })
    bookmarkList.addEventListener('click', toggleDialog)
  })

  onDestroy(() => {
    listeners.forEach(({ el, fn }) => {
      el.removeEventListener('click', fn)
    })

    listeners.length = 0
  })

  // SEE: ## `$effect`の`pageNationIndex` in docs/memo.md
  $effect(() => {
    const index = pageNationItems.findIndex((item) =>
      item.includes(validSearchParamPage),
    )
    pageNationIndex = index < 0 ? 0 : index
  })
</script>

<svelte:head>
  <meta />
  <title>{utils.pageTitle()}</title>
  <meta name="description" content="個人的なブックマーク管理アプリ 栞棚" />
  <meta name="color-scheme" content="light dark" />
</svelte:head>

<header class="AppHeader">
  <h1 class="AppLogo">
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
    <a href="/">{utils.pageTitle()}</a>
  </h1>

  <div class="SearchBar">
    <input type="search" onchange={(event) => searchByQuery(event)} />
  </div>

  <div class="UpdateButton">
    <button
      onclick={() => {
        normalizedBookmarks = []
        fetchBookmarks()
      }}>更新</button
    >
  </div>
</header>

<LoadingBoundary isLoading={flags.isInitializing} />

<MessageBoundary
  flgs={flags}
  len={bookmarksLength}
  tag={searchParamTag ?? ''}
  query={searchParamQuery ?? ''}
/>

<ErrorBoundary {isError} />

<div class="BookmarkList" use:highLightKeyword={searchParamQuery ?? ''}>
  {#if bookmarksLength > 0}
    <div class="BookmarkListLayout">
      {#each filteredBookmarks.slice(start, end) as bookmark (bookmark.id)}
        <article class="Bookmark">
          <div class="BookmarkImgWrap">
            <a href={bookmark.url} rel="external noopener" target="_blank">
              <img
                class="BookmarkImg"
                src={bookmark.img}
                alt={bookmark.title}
              />
            </a>
          </div>
          <h2 class="BookmarkTitle" id={`bookmark-${bookmark.id}`}>
            <a href={bookmark.url} rel="external noopener" target="_blank">
              {bookmark.title}
            </a>
          </h2>
          <time class="BookmarkDate" datetime={bookmark.date}>
            {utils.toJapaneseDate(bookmark.date)}
          </time>
          <p class="BookmarkDescription">{bookmark.description}</p>
          <ul class="BookmarkTags">
            {#each bookmark.tags as tag (tag.id)}
              <li>
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
                <a onclick={resetPageNationIndex} href={`/?tag=${tag.name}`}>
                  {tag.name}
                </a>
              </li>
            {/each}
          </ul>
          <div class="BookmarkButtonsLayout">
            <div class="BookmarkDelButton">
              <button
                onclick={() => {
                  if (window.confirm('本当に削除しますか？')) {
                    removeBookmark(bookmark.id)
                  }
                }}
                aria-label={`${bookmark.title}を削除する`}
              >
                🗑️
              </button>
            </div>
            <div class="BookmarkEditButton">
              <button
                data-target-dialog={`dialog-${bookmark.id}`}
                aria-label={`${bookmark.title}を編集する`}
              >
                ✏️
              </button>
            </div>
          </div>
        </article>

        <dialog id={`dialog-${bookmark.id}`} autofocus>
          <h2>{bookmark.title}を編集</h2>

          <div>
            <label>
              <input type="text" bind:value={bookmark.title} />
            </label>
          </div>

          <div>
            <ul>
              {#each bookmark.tags as tag (tag.id)}
                <li>
                  <label>
                    <input type="text" bind:value={tag.name} />
                  </label>
                  <button
                    aria-label={`${tag.name}を削除`}
                    onclick={() => {
                      if (isProcessing) {
                        return
                      }

                      isProcessing = true

                      bookmark.tags = [
                        ...bookmark.tags.filter((_tag) => _tag.id !== tag.id),
                      ]
                    }}>-</button
                  >
                </li>
              {/each}
            </ul>
            <button
              aria-label="新しいタグを追加"
              onclick={() => {
                if (isProcessing) {
                  return
                }

                isProcessing = true

                // SEE: ## 投稿のタグID in docs/memo.md
                const uid = crypto.randomUUID()
                bookmark.tags = [...bookmark.tags, { id: uid, name: 'hoge' }]
              }}>+</button
            >
          </div>

          <button
            onclick={() => {
              const _bookmark = normalizedBookmarks.find((__bookmark) => {
                return __bookmark.id === bookmark.id
              })

              if (!_bookmark) {
                return
              }

              bookmark.title = _bookmark.title
              bookmark.tags = [..._bookmark.tags]
            }}
          >
            変更を戻す
          </button>
          <button
            onclick={() => {
              saveBookmark(bookmark.id, bookmark.title, bookmark.tags)
            }}
          >
            保存する
          </button>
          <button data-target-dialog={`dialog-${bookmark.id}`}>閉じる</button>
        </dialog>
      {/each}
    </div>

    <nav aria-label="ページネーション">
      <ol class="PageNation">
        <li>
          <button
            onclick={decrementPageNationIndex}
            disabled={!hasPrevPageNation}
          >
            前
          </button>
        </li>
        <!-- eslint-disable-next-line svelte/require-each-key -->
        {#each pageNationItems.at(pageNationIndex) ?? [] as pageNationItem}
          <li>
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve --><!-- prettier-ignore -->
            <a href={searchParamBuilder(pageNationItem)}
          aria-current={isCurrentPage(pageNationItem) ? 'page' : null}
        >
          {pageNationItem}
        </a>
          </li>
        {/each}
        <li>
          <button
            onclick={incrementPageNationIndex}
            disabled={!hasNextPageNation}
          >
            次
          </button>
        </li>
      </ol>
    </nav>
  {/if}
</div>

<style>
  dialog {
    padding: 1rem;
    border: solid 1px;
    max-inline-size: 960px;
  }

  .AppHeader {
    display: block grid;
    align-items: center;
    grid-template-columns: 1fr auto 1fr;
  }

  .AppLogo {
  }

  .SearchBar {
  }

  .UpdateButton {
    justify-self: self-end;
  }

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

  .Bookmark {
    border: solid 1px;
    display: block grid;
    grid-row: span 6;
    grid-template-rows: subgrid;
  }

  .BookmarkImgWrap {
    contain: content;
  }

  .BookmarkImg {
    --_aspect-ratio-value: 1200 / 630;

    inline-size: -webkit-fill-available;
    inline-size: strech;
    aspect-ratio: var(--_aspect-ratio-value);
    object-fit: cover;
  }

  .BookmarkTitle {
  }

  .BookmarkDate {
  }

  .BookmarkDescription {
  }

  .BookmarkTags {
  }

  .BookmarkButtonsLayout {
    display: block flex;
    justify-content: flex-end;
    column-gap: 0.5em;
    border: solid 1px;
    padding: 0.5em;

    & :where(button) {
      border-width: 0;
      display: block grid;
      aspect-ratio: 1;
      place-content: center;
      border: solid 1px;
    }
  }

  :where(:is(.BookmarkEditButton, .BookmarkDelButton)) {
    flex-grow: 0;
    flex-shrink: 0;
    flex-basis: calc(40 * calc(tan(atan2(1px, 16px))) * 1rem);
  }

  .PageNation {
    display: block flex;
    list-style-type: '';
    gap: 0.25em 0.5em;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    margin-block: 1.5rem;

    & :where(li) {
      flex-shrink: 0;
      flex-grow: 0;
      flex-basis: calc(40 * calc(tan(atan2(1px, 16px))) * 1rem);
      text-align: center;
    }

    & :where(button[disabled]) {
      background-color: oklch(from black calc(1 - 0.75) c h);
      border-color: oklch(from black calc(1 - 0.65) c h);
      color: oklch(from black calc(1 - 0.5) c h);
    }

    & :where(a) {
      display: block grid;
      place-content: center;
      border: solid 1px;
      aspect-ratio: 1;
    }

    & :where([aria-current='page']) {
      pointer-events: none;
      background-color: oklch(from black calc(1 - 0.65) c h);
      color: white;
    }
  }

  :global(::highlight(search-result)) {
    color: red;
  }
</style>
