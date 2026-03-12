<script lang="ts">
  import type { PageProps } from './$types'
  import { pageTitle } from '$lib/utils/page-title'

  let { data }: PageProps = $props()
  let bookmarks = $derived(data.bookmarks)
</script>

<svelte:head>
  <title>{pageTitle()}</title>
  <meta name="description" content="個人的なブックマーク管理アプリ 栞棚" />
</svelte:head>

<h1>{pageTitle()}</h1>

<ul>
  {#each bookmarks as bookmark (bookmark.id)}
    <li>
      <article>
        <a
          href={bookmark.url}
          aria-describedby={`bookmark-${bookmark.id}`}
          target="_blank"
          rel="external noopener"
        >
          <h2 id={`bookmark-${bookmark.id}`}>{bookmark.title}</h2>
          <img src={bookmark.img} alt={bookmark.title} />
          <p>{bookmark.description}</p>
          <ul>
            {#each bookmark.tags as tag (tag.id)}
              <li>{tag.tag}</li>
            {/each}
          </ul>
        </a>
      </article>
    </li>
  {/each}
</ul>
