import { fetchAllBookmarks } from '$lib/server/notion'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async () => {
  const response = await fetchAllBookmarks()

  return { bookmarks: response.flat() }
}
