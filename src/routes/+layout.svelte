<script lang="ts">
  import '$lib/styles/kiso.css'
  import '$lib/styles/design-token.css'

  import type { LayoutProps } from './$types'

  let { children }: LayoutProps = $props()
</script>

<main>
  {@render children()}
</main>
