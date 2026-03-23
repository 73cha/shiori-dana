import { NOTION_API_KEY, NOTION_DATA_SOURCE_ID } from '$env/static/private'
import { Client, isFullPage, type PageObjectResponse } from '@notionhq/client'
import type { Bookmark, AnyUrl, YYYYMMDD } from '$lib/types'

type PageProperty =
  PageObjectResponse['properties'][keyof PageObjectResponse['properties']]
type MultiSelect = { id: string; name: string }[]

const notion = new Client({ auth: NOTION_API_KEY })
// MEMO:
// `multi_select`と他で関数を分けたくないのでオーバーロードする
// インターセクション型のオーバーロードは、
// 呼出し側で`{ type: XXX }`が確定している必要がある
function toText(prop: PageProperty & { type: 'checkbox' }): boolean
function toText(prop: PageProperty & { type: 'multi_select' }): MultiSelect
function toText(prop: PageProperty & { type: 'date' }): YYYYMMDD
function toText(prop: PageProperty & { type: 'url' }): AnyUrl
function toText(prop: PageProperty): string
function toText(
  prop: PageProperty,
): string | boolean | AnyUrl | YYYYMMDD | MultiSelect {
  switch (prop.type) {
    case 'title':
      return prop.title.at(0)?.plain_text ?? ''
    case 'rich_text':
      return prop.rich_text.at(0)?.plain_text ?? ''
    case 'url':
      return prop.url ?? 'https://example.com'
    case 'multi_select':
      return prop.multi_select.map((v) => ({ id: v.id, name: v.name }))
    case 'date':
      return prop.date?.start ?? '2000-01-01'
    case 'checkbox':
      return prop.checkbox ?? false
    default:
      return ''
  }
}

export async function archiveBookmark(pageId: string): Promise<void> {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      published: {
        type: 'checkbox',
        checkbox: false,
      },
    },
  })
}

/**
 * SEE: ## `editBookmark` in docs/memo.md
 * @see https://developers.notion.com/reference/patch-page
 */
export async function editBookmark(
  pageId: string,
  payload: { title: string; tags: { id?: string; name: string }[] },
): Promise<void> {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      title: {
        title: [{ text: { content: payload.title } }],
      },
      tags: {
        type: 'multi_select',
        multi_select: payload.tags.map((tag) => {
          delete tag.id
          return { name: tag.name }
        }),
      },
    },
  })
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
      .filter(({ properties }) => {
        return (
          properties.published.type === 'checkbox' &&
          properties.published.checkbox
        )
      })
      .map(({ id, properties }) => {
        const { title, url, img, description, tags, date, published } =
          properties

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
            tags.type === 'multi_select'
              ? toText(tags)
              : [{ id: '', name: '' }],
          date: date.type === 'date' ? toText(date) : '2000-01-01',
          published: published.type === 'checkbox' ? toText(published) : false,
        }
      })

    bookmarks.push(paginated)

    startCursor = response.next_cursor
    hasMore = response.has_more
  }

  return bookmarks
}
