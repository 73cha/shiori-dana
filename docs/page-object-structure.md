# ページオブジェクトの構造

## API
- API呼び出し回数を減らしたいので最大件数取得(100)
- API側では構造化されたデータを持っておく
  - ページ数が簡単に把握できる(`length = ページ数`)
  - ブックマーク総数が簡単に把握できる(`length * 100 = ブックマーク総数`)

## フロントエンド
- `Array.prototype.flat`で平坦化
- ステートとして保存

以下のプロパティは、ページネーションに使える
- `response.next_cursor`: 次のグループの最初の要素のid or 次の要素のid
- `response.has_more`: 残りがあれば`true`

全件取得したら、
- `next_cursor: null`
- `has_more: false`
になる

## データ構造
`response.results`: `page`が格納された配列

### `page`の構造
```js
{
  description: { id: 'DuR%3F', type: 'rich_text', rich_text: [ [Object] ] },
  url: {
    id: 'Jp%60h',
    type: 'url',
    url: 'https://xxxxxxxxxxx'
  },
  tags: {
    id: 'PCiB',
    type: 'multi_select',
    multi_select: [ [Object], [Object], [Object] ]
  },
  img: {
    id: 'aJjr',
    type: 'url',
    url: 'https://xxxxxxxxxx'
  },
  title: { id: 'title', type: 'title', title: [ [Object] ] }
}
```

#### description(type: rich_text)
```js
response.results.at(0).properties.description.rich_text.at(0).plain_text
```

#### url(type: url)
```js
response.results.at(0).properties.url.url)
```

### tags(type: multi_select)
```js
/** @type { { id, name, color }[] } */
esponse.results.at(0).properties.tags.multi_select
```

#### img(type: url)
```js
response.results.at(0).properties.img.url
```

#### title(type: title)
```js
response.results.at(0).properties.title.title.at(0).plain_text
```