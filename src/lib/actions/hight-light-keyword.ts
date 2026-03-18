import type { Action } from 'svelte/action'

const highLight = (node: HTMLElement, query: string) => {
  // MEMO:
  // ライフサイクルフックでは、DOMが削除された時だけしかハイライトを削除できない
  // そのため、検索クエリが変わった時に、以前のハイライトが残ってしまう
  // その対策で最初にハイライトを削除する
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

  // MEMO:
  // マッチしないキーワードで検索されたときの対策
  if (ranges.length > 0) {
    CSS.highlights.set('search-result', new Highlight(...ranges))
  }
}

/**
 * @description
 * 検索キーワードにマッチした語をハイライトする関数\
 * 検索欄からの検索でハイライト
 */
export const highLightKeyword: Action<HTMLElement, string> = (node, query) => {
  // MEMO:
  // `update`を発火させるための変数
  // `update`で新しい検索キーワードを再代入することで、
  // ライフサイクルを発火させる
  let currentQuery = query

  highLight(node, currentQuery)

  // MEMO:
  // ページネーション対策
  // DOMの変更を検知し、`highLight()`を再実行する
  const observer = new MutationObserver(() => {
    highLight(node, currentQuery)
  })

  observer.observe(node, { childList: true, subtree: true })

  return {
    update(newQuery) {
      currentQuery = newQuery

      highLight(node, currentQuery)
    },
    destroy() {
      observer.disconnect()

      CSS.highlights.delete('search-result')
    },
  }
}
