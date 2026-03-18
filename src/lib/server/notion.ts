import { NOTION_API_KEY, NOTION_DATA_SOURCE_ID } from '$env/static/private'
import { Client, isFullPage, type PageObjectResponse } from '@notionhq/client'
import type { Bookmark, AnyUrl, YYYYMMDD } from '$lib/types'

type PageProperty =
  PageObjectResponse['properties'][keyof PageObjectResponse['properties']]
type MultiSelect = { id: string; tag: string }[]

const notion = new Client({ auth: NOTION_API_KEY })
// MEMO:
// `multi_select`と他で関数を分けたくないのでオーバーロードする
// インターセクション型のオーバーロードは、
// 呼出し側で`{ type: XXX }`が確定している必要がある
function toText(prop: PageProperty & { type: 'multi_select' }): MultiSelect
function toText(prop: PageProperty & { type: 'date' }): YYYYMMDD
function toText(prop: PageProperty & { type: 'url' }): AnyUrl
function toText(prop: PageProperty): string
function toText(prop: PageProperty): string | AnyUrl | YYYYMMDD | MultiSelect {
  switch (prop.type) {
    case 'title':
      return prop.title.at(0)?.plain_text ?? ''
    case 'rich_text':
      return prop.rich_text.at(0)?.plain_text ?? ''
    case 'url':
      return prop.url ?? 'https://example.com'
    case 'multi_select':
      return prop.multi_select.map((v) => ({ id: v.id, tag: v.name }))
    case 'date':
      return prop.date?.start ?? '2000-01-01'
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
        const { title, url, img, description, tags, date } = properties

        return {
          id,
          title: toText(title),
          url: url.type === 'url' ? toText(url) : 'https://example.com',
          img:
            img.type === 'url'
              ? toText(img)
              : 'https://loremflickr.com/1200/630/cat',
          description: toText(description),
          tags:
            tags.type === 'multi_select' ? toText(tags) : [{ id: '', tag: '' }],
          date: date.type === 'date' ? toText(date) : '2000-01-01',
        }
      })

    bookmarks.push(paginated)

    startCursor = response.next_cursor
    hasMore = response.has_more
  }

  return bookmarks
}
