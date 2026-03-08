import { fetchAllBookmarks } from '@api/_notion'
import type { UpdateResponse, ErrorResponse } from '@api/_types'

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' } satisfies ErrorResponse),
      { status: 405, headers: { 'Content-Type': 'application/json' } },
    )
  }

  try {
    const bookmarks = await fetchAllBookmarks()
    const body: UpdateResponse = { bookmarks }

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    return new Response(
      JSON.stringify({ error: message } satisfies ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
