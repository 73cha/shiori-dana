<script lang="ts">
  import { page } from '$app/state'
  import { onDestroy, onMount } from 'svelte'
  import { EventManager } from '$lib/modules/event-manager'

  import type { HTMLAttributes } from 'svelte/elements'

  // MEMO:
  // current: 現在の`?page=N`
  type Props = {
    totalPage: number
    perItem: number
    current: number
  } & HTMLAttributes<HTMLElement>

  let { totalPage, perItem, current, ...restProps }: Props = $props()
  let index = $state(0)

  const items = $derived.by(() => {
    return Array.from(Array(totalPage), (_, i) => i + 1)
      .map((v, _, self) => {
        if (v % perItem === 1) {
          return self.slice(v - 1, perItem + (v - 1))
        }
      })
      .filter((v) => v !== undefined)
  })

  const length = $derived(items.length - 1)
  const hasNext = $derived(index < length)
  const hasPrev = $derived(index > 0)

  const incrementIndex = () => (index += 1)
  const decrementIndex = () => (index -= 1)
  const setParam = (pageNumber: number) => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const params = new URLSearchParams(page.url.searchParams)

    params.set('page', `${pageNumber}`)

    return `?${params.toString()}`
  }
  const isCurrent = (pageNum: number) => pageNum === current
  const handler = () => {
    index = 0
  }

  onMount(() => {
    EventManager.on('reset:pagenation:index', handler)
  })

  onDestroy(() => {
    EventManager.off('reset:pagenation:index', handler)
  })

  // SEE: ## `$effect`の`pageNationIndex` in docs/memo.md
  $effect(() => {
    const _index = items.findIndex((item) => item.includes(current))
    index = _index < 0 ? 0 : _index
  })
</script>

<nav aria-label="ページネーション" {...restProps}>
  <ol class="scope PageNation">
    <li>
      <button onclick={decrementIndex} disabled={!hasPrev}>前</button>
    </li>
    <!-- eslint-disable-next-line svelte/require-each-key -->
    {#each items.at(index) ?? [] as item}
      <li>
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve --><!-- prettier-ignore -->
        <a href={setParam(item)}
          aria-current={isCurrent(item) ? 'page' : null}
        >
          {item}
        </a>
      </li>
    {/each}
    <li>
      <button onclick={incrementIndex} disabled={!hasNext}> 次 </button>
    </li>
  </ol>
</nav>

<style>
  @layer components {
    @scope (.PageNation) to (.scope) {
      :scope {
        display: block flex;
        list-style-type: '';
        gap: 0.25em 0.5em;
        align-items: center;
        flex-wrap: wrap;
        justify-content: center;
        padding-block-start: 3rem;
      }

      li {
        flex-shrink: 0;
        flex-grow: 0;
        flex-basis: calc(40 * calc(tan(atan2(1px, 16px))) * 1rem);
        text-align: center;
      }

      button[disabled] {
        background-color: oklch(from black calc(1 - 0.75) c h);
        border-color: oklch(from black calc(1 - 0.65) c h);
        color: oklch(from black calc(1 - 0.5) c h);
      }

      a {
        display: block grid;
        place-content: center;
        border: solid 1px;
        aspect-ratio: 1;
      }

      [aria-current='page'] {
        pointer-events: none;
        background-color: oklch(from black calc(1 - 0.65) c h);
        color: white;
      }
    }
  }
</style>
