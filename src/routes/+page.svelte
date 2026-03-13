<script lang="ts">
  import type { PageProps } from './$types'
  import { pageTitle } from '$lib/utils/page-title'
  import type { YYYYMMDD } from '$lib/types'
  let { data }: PageProps = $props()
  let bookmarks = $derived(data.bookmarks)

  const toLocaleDate = (dateString: YYYYMMDD) => {
    const datePattern = /[0-9]{4}-[0-9]{2}-[0-9]{2}/

    if (!datePattern.test(dateString)) {
      return
    }

    const [year, month, date] = dateString.split('-')

    return `${year}年${month}月${date}日`
  }
</script>

<svelte:head>
  <title>{pageTitle()}</title>
  <meta name="description" content="個人的なブックマーク管理アプリ 栞棚" />
</svelte:head>

<h1>{pageTitle()}</h1>

<div class="BookmarkList">
  {#each bookmarks as bookmark (bookmark.id)}
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
            <button>{tag.tag}</button>
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
    /* grid-area: title; */
  }

  .BookmarkDate {
    /* grid-area: date; */
  }

  .BookmarkDescription {
    /* grid-area: description; */
  }

  .BookmarkTags {
    /* grid-area: tags; */
  }

  .BookmarkDelButton {
    /* grid-area: button; */
  }
</style>
