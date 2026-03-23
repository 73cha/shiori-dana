export interface Bookmark {
  id: string
  title: string
  url: AnyUrl
  description: string
  img: AnyUrl
  tags: { id: string; name: string }[]
  date: YYYYMMDD
  published: boolean
}

export type BookmarksResponse = {
  bookmarks: Bookmark[][]
}

export type SuccessResponse = {
  success: true
}

export type ErrorResponse = {
  error: string
}

type YYYY =
  | `${19}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | `${20}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
type MM = `0${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}` | `1${0 | 1 | 2}`
type DD =
  | `0${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | `${1 | 2}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | `3${0 | 1}`

export type YYYYMMDD = `${YYYY}-${MM}-${DD}`

type HttpUrl = `http://${string}`
type HttpsUrl = `https://${string}`

export type AnyUrl = HttpUrl | HttpsUrl

/**
 * @summary `await`漏れの事故を防ぐ
 * @see https://iwb.jp/typescript-promise-awaited-utility-types/
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AwaitedPromise<T extends (...args: any) => any> = Awaited<
  ReturnType<T>
>

export type Flags = Record<
  | 'isInitializing'
  | 'isFilteringByTag'
  | 'isFilteringByQuery'
  | 'isFilteringByDefault',
  boolean
>
