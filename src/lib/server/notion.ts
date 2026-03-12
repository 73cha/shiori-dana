import { NOTION_API_KEY, NOTION_DATA_SOURCE_ID } from '$env/static/private'
import { Client, isFullPage, type PageObjectResponse } from '@notionhq/client'
import type { Bookmark } from '$lib/types'

type PageProperty =
  PageObjectResponse['properties'][keyof PageObjectResponse['properties']]
type MultiSelect = { id: string; tag: string }[]

const notion = new Client({ auth: NOTION_API_KEY })

// `multi_select`と他で関数を分けたくないのでオーバーロードする
// `& { type: 'mult_select' }`でインターセクション型にしたことで、
// 呼び出し側で`type === 'multi_select`が確定している必要がある
function toText(prop: PageProperty & { type: 'multi_select' }): MultiSelect
function toText(prop: PageProperty): string
function toText(prop: PageProperty): string | MultiSelect {
  switch (prop.type) {
    case 'title':
      return prop.title.at(0)?.plain_text ?? ''
    case 'rich_text':
      return prop.rich_text.at(0)?.plain_text ?? ''
    case 'url':
      return prop.url ?? ''
    case 'multi_select':
      return prop.multi_select.map((v) => ({ id: v.id, tag: v.name }))
    default:
      return ''
  }
}

export async function archiveBookmark(pageId: string): Promise<void> {
  await notion.pages.update({ page_id: pageId, archived: true })
}

export async function fetchAllBookmarks(): Promise<Bookmark[][]> {
  let startCursor: string | null = null
  let hasMore = true

  const PAGE_SIZE = 100
  const bookmarks: Bookmark[][] = []

  while (hasMore) {
    const response = await notion.dataSources.query({
      data_source_id: NOTION_DATA_SOURCE_ID,
      page_size: PAGE_SIZE,
      start_cursor: startCursor ?? undefined,
    })

    if (!response) {
      break
    }

    const paginated = response.results
      .filter(isFullPage)
      .map(({ id, properties }) => {
        const { title, url, img, description, tags } = properties

        return {
          id,
          title: toText(title),
          url: toText(url),
          img: toText(img),
          description: toText(description),
          tags:
            tags.type === 'multi_select' ? toText(tags) : [{ id: '', tag: '' }],
        }
      })

    bookmarks.push(paginated)

    startCursor = response.next_cursor
    hasMore = response.has_more
  }

  return bookmarks
}
