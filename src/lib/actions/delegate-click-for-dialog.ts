import type { Action } from 'svelte/action'

// SEE: ## `toggleDialog` in docs/memo.md
const toggle = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null

  if (!target) {
    return
  }

  const id = target.dataset.targetDialog ?? ''
  const dialog = document.getElementById(id)

  const isDialog = (element: HTMLElement | null) =>
    element instanceof HTMLDialogElement

  // MEMO:
  // DISSMISS
  // ::backdropをクリックしていたら、
  // targetがdialogになる
  if (isDialog(target)) {
    target.close()
  }

  // MEMO:
  // DISSMISS前に持っていかない
  // ::backdropをクリックしたときは、
  // dialogがnullになるから(data-target-dialog属性を持っていない)
  if (!isDialog(dialog)) {
    return
  }

  if (dialog.open) {
    dialog.close()
  } else {
    dialog.showModal()
  }
}

export const delegateClickForDialog: Action<HTMLElement> = (node) => {
  node.addEventListener('click', toggle)

  return {
    destroy() {
      node.removeEventListener('click', toggle)
    },
  }
}
