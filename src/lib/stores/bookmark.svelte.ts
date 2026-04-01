import type { Bookmark, BookmarksResponse, BookmarkTag } from '$lib/types'
import { EventManager } from '$lib/modules/event-manager'

// SEE: ## `normalized` in docs/memo.md
let normalized = $state<Bookmark[]>([])
// SEE ## `editable` in docs/memo.md
let editable = $state<Bookmark[]>([])
let isClickGuard = false

const retrieve = async () => {
  EventManager.emit('initialize:start')

  const response = await fetch('/api/v1/bookmarks')

  if (response.status !== 200) {
    EventManager.emit('error').emit('initialize:end')

    return
  }

  const { bookmarks }: BookmarksResponse = await response.json()

  const data = bookmarks.flat().sort((a, b) => b.date.localeCompare(a.date))

  normalized = data
  editable = data.map((d) => ({
    ...d,
    tags: d.tags.map(({ id, name }) => ({ id, name })),
  }))

  EventManager.emit('success').emit('initialize:end')
}

const reInitialize = async () => {
  normalized.length = 0
  editable.length = 0

  await retrieve()
}

const remove = async (id: string) => {
  if (isClickGuard) {
    return
  }

  isClickGuard = true

  EventManager.emit('remove:start')

  const snapshot = $state.snapshot(editable)

  // MEMO:
  // テンプレートからはすぐに取り除く
  editable = editable.filter((bookmark) => {
    return bookmark.id !== id
  })

  const response = await fetch(`/api/v1/bookmarks/${id}`, {
    method: 'DELETE',
  })

  if (response.status !== 200) {
    EventManager.emit('error').emit('remove:end')

    editable = snapshot
    isClickGuard = false

    return
  }

  isClickGuard = false

  EventManager.emit('success').emit('remove:end')
}

const update = async (id: string, title: string, tags: BookmarkTag[]) => {
  if (isClickGuard) {
    return
  }

  isClickGuard = true

  EventManager.emit('update:start')

  const snapshot = $state.snapshot(editable)

  const response = await fetch(`/api/v1/bookmarks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      title: title,
      tags: tags,
    }),
  })

  if (response.status !== 200) {
    EventManager.emit('error').emit('update:end')

    editable = snapshot
    isClickGuard = false

    return
  }

  await reInitialize()

  EventManager.emit('success').emit('update:end')

  // MEMO:
  // 同期処理は、同一キュー内で解除しない
  // 同一キュー内で連打されると、同期解除だと意味を成さない
  // macrotaskに送り、次のキューまで維持する
  setTimeout(() => {
    isClickGuard = false
  }, 0)
}

const createBookmarkStore = () => {
  return {
    get normalized() {
      return normalized
    },
    get editable() {
      return editable
    },
    retrieve,
    reInitialize,
    update,
    remove,
  }
}

export const BookmarkStore = createBookmarkStore()
