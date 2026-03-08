// API
// - API呼び出し回数を減らしたいので最大件数取得
// - 100件以上かどうかに関わらず、2次元配列として返却

// フロントエンド
// - `Array.prototype.flat`で平坦化
// - ステートとして保存

// 以下のプロパティは、ページネーションに使える
// - `response.next_cursor`: 次のグループの最初の要素のid or 次の要素のid
// - `response.has_more`: 残りがあれば`true`

// 全件取得したら、
// - `next_cursor: null`
// - `has_more: false`
// になる

// response.results: pageが格納された配列
// 格納されているpageの構造
// ```js
// {
//   description: { id: 'DuR%3F', type: 'rich_text', rich_text: [ [Object] ] },
//   url: {
//     id: 'Jp%60h',
//     type: 'url',
//     url: 'https://xxxxxxxxxxx'
//   },
//   tags: {
//     id: 'PCiB',
//     type: 'multi_select',
//     multi_select: [ [Object], [Object], [Object] ]
//   },
//   img: {
//     id: 'aJjr',
//     type: 'url',
//     url: 'https://xxxxxxxxxx'
//   },
//   title: { id: 'title', type: 'title', title: [ [Object] ] }
// }
// ```

// rich_text
// type: rich_text
// response.results.at(0).properties.description.rich_text.at(0).plain_text

// url
// type: url
// テキスト
// response.results.at(0).properties.url.url)

// tags
// type: multi_select
// 配列
// { id, name, color }[]
// esponse.results.at(0).properties.tags.multi_select

// img
// type: url
// テキスト
// response.results.at(0).properties.img.url

// title
// type: title
// 配列
// response.results.at(0).properties.title.title.at(0).plain_text

import { config } from 'dotenv'
import { Client, isFullPage, PageObjectResponse } from '@notionhq/client'
import { Bookmark } from './_types'

config()

type PageProperty =
  PageObjectResponse['properties'][keyof PageObjectResponse['properties']]

// `multi_select`と他で関数を分けたくないのでオーバーロードする
// `& { type: 'mult_select' }`でインターセクション型にしたことで、
// 呼び出し側で`type === 'multi_select`が確定している必要がある
function toText(prop: PageProperty & { type: 'multi_select' }): string[]
function toText(prop: PageProperty): string
function toText(prop: PageProperty): string | string[] {
  switch (prop.type) {
    case 'title':
      return prop.title.at(0)?.plain_text ?? ''
    case 'rich_text':
      return prop.rich_text.at(0)?.plain_text ?? ''
    case 'url':
      return prop.url ?? ''
    case 'multi_select':
      return prop.multi_select.map((v) => v.name)
    default:
      return ''
  }
}

export async function fetchAllBookmarks(): Promise<Bookmark[][]> {
  let startCursor: string | null = null
  let hasMore = true

  const PAGE_SIZE = 100
  const { NOTION_API_KEY, NOTION_DATA_SOURCE_ID } = process.env
  const notion = new Client({ auth: NOTION_API_KEY })
  const bookmarks = []

  while (hasMore) {
    const response = await notion.dataSources.query({
      data_source_id: NOTION_DATA_SOURCE_ID!,
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
          tags: tags.type === 'multi_select' ? toText(tags) : [''],
        }
      })

    bookmarks.push(paginated)

    startCursor = response.next_cursor
    hasMore = response.has_more
  }

  return bookmarks
}
