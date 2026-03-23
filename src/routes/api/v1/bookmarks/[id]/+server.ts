import { json } from '@sveltejs/kit'
import { archiveBookmark, editBookmark } from '$lib/server/notion'
import type { SuccessResponse, ErrorResponse } from '$lib/types'
import type { RequestHandler } from './$types'

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    await archiveBookmark(params.id)

    return json({ success: true } satisfies SuccessResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    return json({ error: message } satisfies ErrorResponse, { status: 500 })
  }
}

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json()

    await editBookmark(params.id, data)

    return json({ success: true } satisfies SuccessResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    return json({ error: message } satisfies ErrorResponse, { status: 500 })
  }
}
