import { json } from '@sveltejs/kit'
import { archiveBookmark } from '$lib/server/notion'
import type { DeleteResponse, ErrorResponse } from '$lib/types'
import type { RequestHandler } from './$types'

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    await archiveBookmark(params.id)

    return json({ success: true } satisfies DeleteResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    return json({ error: message } satisfies ErrorResponse, { status: 500 })
  }
}
