<script lang="ts">
  import type { Bookmark } from '$lib/types'
  import type { HTMLAttributes } from 'svelte/elements'

  import { utils } from '$lib/utils'
  import { BookmarkStore } from '$lib/stores/bookmark.svelte'
  import { EventManager } from '$lib/modules/event-manager'

  type Props = {
    bookmark: Bookmark
  } & HTMLAttributes<HTMLElement>

  const { remove } = BookmarkStore

  let { bookmark, ...restProps }: Props = $props()

  const { id, title, date, url, img, tags, description } = $derived(bookmark)
</script>

<article class="scope Bookmark" {...restProps}>
  <div class="_imgWrap">
    <a href={url} rel="external noopener" target="_blank">
      <img class="_img" src={img} alt={title} />
    </a>
  </div>
  <h2 class="_title" id={`bookmark-${id}`}>
    <a href={url} rel="external noopener" target="_blank">
      {title}
    </a>
  </h2>
  <time class="_date" datetime={date}>
    {utils.toJapaneseDate(date)}
  </time>
  <p class="_description">{description}</p>
  <ul class="_tags">
    {#each tags as tag (tag.id)}
      <li>
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve --><!-- prettier-ignore -->
        <a href={`/?tag=${tag.name}`} onclick={() =>
          EventManager.emit('reset:pagenation:index')
        }>
          {tag.name}
        </a>
      </li>
    {/each}
  </ul>
  <div class="_buttonsWrap">
    <button
      class="_delButton"
      onclick={async () => {
        if (window.confirm('本当に削除しますか？')) {
          await remove(id)
        }
      }}
      aria-label={`${title}を削除する`}
    >
      🗑️
    </button>
    <button
      class="_editButton"
      data-target-dialog={`dialog-${bookmark.id}`}
      aria-label={`${title}を編集する`}
    >
      ✏️
    </button>
  </div>
</article>

<style>
  @layer components {
    @scope (.Bookmark) to (.scope) {
      :scope {
        border: solid 1px;
        display: block grid;
        grid-row: span 6;
        grid-template-rows: subgrid;
      }

      ._imgWrap {
        contain: content;
      }

      ._img {
        --_aspect-ratio-value: 1200 / 630;

        inline-size: -webkit-fill-available;
        inline-size: stretch;
        aspect-ratio: var(--_aspect-ratio-value);
        object-fit: cover;
      }

      ._title {
      }

      ._date {
      }

      ._description {
      }

      ._tags {
      }

      ._buttonsWrap {
        display: block flex;
        justify-content: flex-end;
        column-gap: 0.5em;
        border: solid 1px;
        padding: 0.5em;
      }

      :is(._editButton, ._delButton) {
        display: block grid;
        aspect-ratio: 1;
        place-content: center;
        border: solid 1px;
        flex-grow: 0;
        flex-shrink: 0;
        flex-basis: calc(40 * calc(tan(atan2(1px, 16px))) * 1rem);
      }
    }
  }
</style>
