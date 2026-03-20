<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'

  type ErrorBoundaryType = {
    isError: boolean
  } & HTMLAttributes<HTMLElement>

  let { isError, ...restProps }: ErrorBoundaryType = $props()
</script>

{#if isError}
  <div role="alert" {...restProps}>
    <p>データ取得中にエラーが発生しました。画面の再読み込みをお願いします。</p>
  </div>
{/if}
