import { json } from '@sveltejs/kit'
import { fetchAllBookmarks } from '$lib/server/notion'
import type { BookmarksResponse, ErrorResponse } from '$lib/types'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
  try {
    const bookmarks = await fetchAllBookmarks()
    const body: BookmarksResponse = { bookmarks }

    return json(body)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    return json({ error: message } satisfies ErrorResponse, { status: 500 })
  }
}
