export interface Bookmark {
  id: string
  title: string
  url: string
  description: string
  img: string
  tags: { id: string; tag: string }[]
}

export type BookmarksResponse = {
  bookmarks: Bookmark[][]
}

export type DeleteResponse = {
  success: true
}

export type ErrorResponse = {
  error: string
}
