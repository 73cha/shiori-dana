<script lang="ts">
  import '$lib/styles/kiso.css'
  import '$lib/styles/design-token.css'

  import { page } from '$app/state'
  import { goto } from '$app/navigation'

  import type { LayoutProps } from './$types'

  import { utils } from '$lib/utils'
  import { BookmarkStore } from '$lib/stores/bookmark.svelte'

  const { reInitialize } = BookmarkStore

  let { children }: LayoutProps = $props()

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
</script>

<header class="scope AppHeader">
  <h1 class="_logo">
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
    <a href="/">{utils.pageTitle()}</a>
  </h1>

  <div class="_search">
    <input type="search" onchange={searchByQuery} />
  </div>

  <div class="_update">
    <button onclick={reInitialize}>更新</button>
  </div>
</header>

<main>
  {@render children()}
</main>

<footer class="AppFooter">
  <p>
    <small>&copy; くちべたコーディング</small>
  </p>
</footer>

<style>
  @layer layouts {
    @scope (.AppHeader) {
      :scope {
        display: block grid;
        padding-inline: 1rem;
        align-items: center;
        grid-template-columns: 1fr auto 1fr;
      }

      ._logo {
      }

      ._search {
      }

      ._update {
        justify-self: self-end;
      }
    }

    @scope (.AppFooter) {
      :scope {
        padding-block: 3rem;
        text-align: center;
      }
    }
  }
</style>
