<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'

  type LoadingBoundaryType = {
    isLoading: boolean
  } & HTMLAttributes<HTMLElement>

  let { isLoading, ...restProps }: LoadingBoundaryType = $props()
</script>

{#if isLoading}
  <div role="status" {...restProps}>
    <p>データの取得中...</p>
  </div>
{/if}
