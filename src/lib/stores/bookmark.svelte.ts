import type { Bookmark, BookmarksResponse, BookmarkTag } from '$lib/types'

export const createBookmarkStore = () => {
  let isError = $state(false)
  let isProcessing = $state(false)

  // SEE: ## `normalized` in docs/memo.md
  let normalized = $state<Bookmark[]>([])

  // SEE ## `editable` in docs/memo.md
  let editable = $state<Bookmark[]>([])

  const retrieve = async () => {
    isError = false

    const response = await fetch('/api/v1/bookmarks')

    if (response.status !== 200) {
      isError = true

      return
    }

    const { bookmarks }: BookmarksResponse = await response.json()

    const data = bookmarks.flat().sort((a, b) => b.date.localeCompare(a.date))

    normalized = data
    editable = data
  }

  const reInitialize = async () => {
    normalized.length = 0
    editable.length = 0

    await retrieve()
  }

  const remove = async (id: string) => {
    if (isProcessing) {
      return
    }

    isProcessing = true

    isError = false

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
      isError = true

      editable = snapshot

      isProcessing = false

      return
    }

    isProcessing = false
  }

  const save = async (id: string, title: string, tags: BookmarkTag[]) => {
    if (isProcessing) {
      return
    }

    isProcessing = true

    isError = false

    const snapshot = $state.snapshot(editable)

    const response = await fetch(`/api/v1/bookmarks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: title,
        tags: tags,
      }),
    })

    if (response.status !== 200) {
      isError = true

      editable = snapshot

      isProcessing = false

      return
    }

    await reInitialize()

    isProcessing = false
  }

  const removeTag = (bookmark: Bookmark, tag: BookmarkTag) => {
    if (isProcessing) {
      return
    }

    isProcessing = true

    bookmark.tags = [...bookmark.tags.filter((_tag) => _tag.id !== tag.id)]

    isProcessing = false
  }

  const addTag = (bookmark: Bookmark) => {
    if (isProcessing) {
      return
    }

    isProcessing = true

    // SEE: ## 投稿のタグID in docs/memo.md
    const uid = crypto.randomUUID()
    bookmark.tags = [...bookmark.tags, { id: uid, name: 'hoge' }]

    isProcessing = false
  }

  const cancel = (bookmark: Bookmark) => {
    if (isProcessing) {
      return
    }

    isProcessing = true

    const _bookmark = normalized.find((__bookmark) => {
      return __bookmark.id === bookmark.id
    })

    if (!_bookmark) {
      isProcessing = false
      return
    }

    bookmark.title = _bookmark.title
    bookmark.tags = [..._bookmark.tags]

    isProcessing = false
  }

  return {
    get normalized() {
      return normalized
    },
    get editable() {
      return editable
    },
    save,
    remove,
    cancel,
    addTag,
    removeTag,
  }
}
