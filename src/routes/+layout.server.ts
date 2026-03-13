import { fetchAllBookmarks } from '$lib/server/notion'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async () => {
  const response = await fetchAllBookmarks()
  const bookmarks = response.flat().sort((a, b) => b.date.localeCompare(a.date))

  return { bookmarks }
}
