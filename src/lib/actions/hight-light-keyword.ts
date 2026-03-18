import type { Action } from 'svelte/action'

const highLight = (node: HTMLElement, query: string) => {
  CSS.highlights.delete('search-result')

  if (!query) {
    return
  }

  const treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
  const ranges: Range[] = []

  let _node

  while ((_node = treeWalker.nextNode())) {
    const text = _node.textContent?.toLowerCase()

    if (!text) {
      continue
    }

    const index = text.indexOf(query)

    if (index < 0) {
      continue
    }

    const range = document.createRange()

    range.setStart(_node, index)
    range.setEnd(_node, index + query.length)
    ranges.push(range)
  }

  if (ranges.length > 0) {
    CSS.highlights.set('search-result', new Highlight(...ranges))
  }
}

export const highLightKeyword: Action<HTMLElement, string> = (node, query) => {
  highLight(node, query)

  return {
    update(newQuery) {
      highLight(node, newQuery)
    },
    destroy() {
      CSS.highlights.delete('search-result')
    },
  }
}
