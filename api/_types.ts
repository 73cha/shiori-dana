export interface Bookmark {
  id: string
  title: string
  url: string
  description: string
  img: string
  tags: string[]
}

export interface UpdateResponse {
  bookmarks: Bookmark[][]
}

export interface ErrorResponse {
  error: string
}
