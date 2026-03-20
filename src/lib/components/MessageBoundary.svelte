<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import type { Flags } from '$lib/types'

  type Props = {
    flgs: Flags
    len: number
    tag: string
    query: string
  } & HTMLAttributes<HTMLElement>

  let { flgs, len, tag, query, ...restProps }: Props = $props()

  // MEMO:
  // 初期化中は絶対に表示しない
  const shouldShow = $derived(
    !flgs.isInitializing && (flgs.isFilteringByTag || flgs.isFilteringByQuery),
  )
</script>

{#if shouldShow}
  {#if flgs.isFilteringByTag}
    <div role="status" {...restProps}>
      <p>タグ:{tag}は、{len}件です。</p>
    </div>
  {/if}

  {#if flgs.isFilteringByQuery}
    <div role="status" {...restProps}>
      <p>{query}の検索結果は、{len}件です。</p>
    </div>
  {/if}
{/if}
