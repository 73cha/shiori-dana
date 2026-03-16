<script lang="ts">
  import type { YYYYMMDD } from '$lib/types'
  import { page } from '$app/state'
  import { pageTitle } from '$lib/utils/page-title'
  import type { Bookmark, BookmarksResponse } from '$lib/types'
  import { onMount } from 'svelte'

  const PER_PAGE = 16

  const PER_ITEM = 3
  let bookmarks = $state<Bookmark[]>([])
  let pageNationIndex = $state(0)
  let isOccuredError = $state(false)

  onMount(async () => {
    const response = await fetch('/api/v1/bookmarks')

    if (response.status !== 200) {
      isOccuredError = true
      return
    }

    const { bookmarks: _bookmarks }: BookmarksResponse = await response.json()

    bookmarks = _bookmarks.flat().sort((a, b) => b.date.localeCompare(a.date))
  })

  /**
   * @description ここでスライスはしない
   * フィルターしたデータを返すだけ
   * ページネーションのアイテム数が正しく反映されないため
   * テンプレートでスライスする
   */
  const filteredBookmarks = $derived.by(() => {
    return bookmarks.filter((bookmark) => {
      if (searchParamsTag) {
        return bookmark.tags.some((tag) => tag.tag === searchParamsTag)
      }

      return bookmark
    })
  })

  const bookmarksLength = $derived(filteredBookmarks.length)
  const totalPages = $derived(Math.ceil(bookmarksLength / PER_PAGE))

  const searchParamsTag = $derived(page.url.searchParams.get('tag'))
  const searchParam = $derived.by(() => {
    const params = parseInt(page.url.searchParams.get('page') ?? '1', 10)

    if (isNaN(params) || params > totalPages || params < 1) {
      return 1
    }

    return params
  })

  const start = $derived((searchParam - 1) * PER_PAGE)
  const end = $derived(start + PER_PAGE)

  const pageNationItems = $derived.by(() => {
    return Array.from(Array(totalPages), (_, i) => i + 1)
      .map((v, _, self) => {
        if (v % PER_ITEM === 1) {
          return self.slice(v - 1, PER_ITEM + (v - 1))
        }
      })
      .filter((v) => v !== undefined)
  })
  const pageNationLength = $derived(pageNationItems.length - 1)
  const hasNextPageNation = $derived(pageNationIndex < pageNationLength)
  const hasPrevPageNation = $derived(pageNationIndex > 0)

  const incrementPageNationIndex = () => (pageNationIndex += 1)
  const decrementPageNationIndex = () => (pageNationIndex -= 1)

  /**
   * @description タグをクリックしたときは、
   * ページネーションのインデックスをリセットする
   * ページネーションが複数ページある場合と1ページしかない場合、
   * インデックスがリセットされないと、1ページの時に存在しない
   * インデックスを参照してしまうため
   *
   * ページネーションが3ページ
   * const data1 = [[1, 2, 3], [4, 5, 6], [7]]
   *
   * ページネーションが1ページ
   * const data2 = [[1]]
   *
   * ページネーションが3ページの時、data1[2]まで操作した状態で、
   * タグをクリックすると、インデックスはリセットされていないため、
   * 1ページの時に存在しないインデックスで参照されてしまう
   *
   * 1ページ: インデックスは`0`だけ
   * 3ページ: 3ページ目まで送ると、インデックスは`2`になる
   *
   * リセットしないと、data2[2]になって存在しない
   */
  const resetPageNationIndex = () => (pageNationIndex = 0)

  const isCurrentPage = (pageNum: number) => pageNum === searchParam
  const toLocaleDate = (
    dateString: YYYYMMDD,
  ): `${string}年${string}月${string}日` | undefined => {
    const datePattern = /[0-9]{4}-[0-9]{2}-[0-9]{2}/

    if (!datePattern.test(dateString)) {
      return
    }

    const [year, month, date] = dateString.split('-')

    return `${year}年${month}月${date}日`
  }
  const searchParamBuilder = (pageNumber: number) => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const params = new URLSearchParams(page.url.searchParams)

    params.set('page', `${pageNumber}`)

    return `?${params.toString()}`
  }
</script>

<svelte:head>
  <title>{pageTitle()}</title>
  <meta name="description" content="個人的なブックマーク管理アプリ 栞棚" />
</svelte:head>

<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
<h1><a href="/">{pageTitle()}</a></h1>

{#if bookmarksLength > 0 && searchParamsTag}
  <p>タグ:{searchParamsTag}は{bookmarksLength}件あります。</p>
{/if}

{#if isOccuredError}
  データ取得中にエラーが発生しました。再度、読み込みをしてください。
{/if}

{#if !isOccuredError && bookmarksLength === 0}
  <p>データの取得中...</p>
{/if}

{#if bookmarksLength > 0}
  <div class="BookmarkList">
    {#each filteredBookmarks.slice(start, end) as bookmark (bookmark.id)}
      <article class="Bookmark">
        <div class="BookmarkImgWrap">
          <a href={bookmark.url} rel="external noopener" target="_blank">
            <img class="BookmarkImg" src={bookmark.img} alt={bookmark.title} />
          </a>
        </div>
        <h2 class="BookmarkTitle" id={`bookmark-${bookmark.id}`}>
          <a href={bookmark.url} rel="external noopener" target="_blank">
            {bookmark.title}
          </a>
        </h2>
        <time class="BookmarkDate" datetime={bookmark.date}>
          {toLocaleDate(bookmark.date)}
        </time>
        <p class="BookmarkDescription">{bookmark.description}</p>
        <ul class="BookmarkTags">
          {#each bookmark.tags as tag (tag.id)}
            <li>
              <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
              <a onclick={resetPageNationIndex} href={`/?tag=${tag.tag}`}
                >{tag.tag}</a
              >
            </li>
          {/each}
        </ul>
        <div class="BookmarkDelButton">
          <button
            data-target-id={bookmark.id}
            aria-label={`${bookmark.title}を削除する`}
          >
            🗑️
          </button>
        </div>
      </article>
    {/each}
  </div>

  <nav class="PageNationLayout" aria-label="ページネーション">
    <button onclick={decrementPageNationIndex} disabled={!hasPrevPageNation}>
      前
    </button>

    <ol class="PageNation">
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
    </ol>

    <button onclick={incrementPageNationIndex} disabled={!hasNextPageNation}>
      次
    </button>
  </nav>
{/if}

<style>
  img {
    max-inline-size: 100%;
    block-size: auto;
  }

  .BookmarkList {
    --_inline-size: 1400px;
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
    margin-inline: auto;
    max-inline-size: var(--_inline-size);
    grid-template-columns: repeat(auto-fill, minmax(var(--_column-width), 1fr));
    contain: content;
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

  .BookmarkDelButton {
  }

  .PageNationLayout {
    display: block flex;
    align-items: center;
    justify-content: center;
  }

  .PageNation {
    display: block flex;
    list-style-type: '';
    column-gap: 0.5em;
    align-items: center;
    justify-content: center;

    & :where([aria-current='page']) {
      pointer-events: none;
      text-decoration: none;
    }
  }
</style>
