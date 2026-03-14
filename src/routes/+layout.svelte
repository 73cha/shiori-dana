<script lang="ts">
  import { onNavigate } from '$app/navigation'
  import '$lib/styles/design-token.css'
  import type { LayoutProps } from './$types'

  let { children }: LayoutProps = $props()

  onNavigate((navigation) => {
    if (!document.startViewTransition) {
      return
    }

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve()
        await navigation.complete
      })
    })
  })
</script>

<main>
  {@render children()}
</main>
