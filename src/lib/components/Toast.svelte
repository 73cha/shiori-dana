<script lang="ts">
  import { onDestroy, onMount, type Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  type Props = {
    children: Snippet
    type?: 'success' | 'fail' | 'loading'
  } & HTMLAttributes<HTMLElement>

  let { children, type, ...restProps }: Props = $props()

  let popoverState = $state<string>('')
  let toast = $state<HTMLElement | null>(null)

  const uid = $props.id()

  const hideToast = () => {
    if (popoverState === 'open') {
      toast?.remove()
    }
  }

  const handlePopoverStateChange = (event: ToggleEvent) => {
    popoverState = event.newState
  }

  onMount(() => {
    toast = document.querySelector<HTMLElement>(`#${uid}`)

    toast?.addEventListener('beforetoggle', handlePopoverStateChange)

    toast?.showPopover()
  })

  onDestroy(() => {
    toast?.removeEventListener('beforetoggle', handlePopoverStateChange)
  })
</script>

<div
  id={uid}
  class="Toast"
  popover="manual"
  role="status"
  data-type={type}
  {...restProps}
>
  {@render children()}
  <button popovertarget={uid} onclick={hideToast} aria-label="通知を消す">
    X
  </button>
</div>

<style>
  .Toast[popover] {
    --_padding: 1.5rem;
    --_container-gap: 1rem;
    --_inline-size: 20rem;
    --_inset-block-start: 2rem;
    --_inset-inline-start: calc(
      100svi - (var(--_inline-size) + var(--_container-gap))
    );

    inline-size: var(--_inline-size);
    display: block grid;
    padding: var(--_padding);
    grid-template-columns: 1fr auto;
    inset-block-start: var(--_inset-block-start);
    inset-inline-start: var(--_inset-inline-start);
    border: solid 1px;
  }
</style>
