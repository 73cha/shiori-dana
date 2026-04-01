<script lang="ts">
  import type { Bookmark, BookmarkTag } from '$lib/types'
  import type { HTMLAttributes } from 'svelte/elements'

  import { BookmarkStore } from '$lib/stores/bookmark.svelte'
  import { focusTrap } from '$lib/actions/focus-trap'

  type Props = {
    bookmark: Bookmark
  } & HTMLAttributes<HTMLDialogElement>

  let { bookmark, ...restProps }: Props = $props()
  let isClickGuard = false

  // svelte-ignore state_referenced_locally
  const { id, title, tags } = bookmark

  let _title = $state(title)
  let _tags = $state(tags.map(({ id, name }) => ({ id, name })))

  const { update } = BookmarkStore

  const removeTag = (tag: BookmarkTag) => {
    if (isClickGuard) {
      return
    }

    isClickGuard = true

    _tags = [..._tags.filter((_tag) => _tag.id !== tag.id)]

    setTimeout(() => {
      isClickGuard = false
    }, 0)
  }

  const addTag = () => {
    if (isClickGuard) {
      return
    }

    isClickGuard = true

    // SEE: ## 投稿のタグID in docs/memo.md
    const uid = crypto.randomUUID()
    _tags = [..._tags, { id: uid, name: '' }]

    setTimeout(() => {
      isClickGuard = false
    }, 0)
  }

  const cancel = (bookmark: Bookmark) => {
    if (isClickGuard) {
      return
    }

    isClickGuard = true

    const original = BookmarkStore.normalized.find((_bookmark) => {
      return _bookmark.id === bookmark.id
    })

    if (!original) {
      setTimeout(() => {
        isClickGuard = false
      }, 0)

      return
    }

    _title = original.title
    _tags = original.tags.map(({ id, name }) => ({
      id,
      name,
    }))

    setTimeout(() => {
      isClickGuard = false
    }, 0)
  }
</script>

<dialog
  use:focusTrap
  class="scope Dialog"
  id={`dialog-${id}`}
  autofocus
  {...restProps}
>
  <header class="_header">
    <h2>{_title}を編集</h2>
    <button class="_close" data-target-dialog={`dialog-${id}`}>閉じる</button>
  </header>
  <div>
    <fieldset>
      <legend>タイトルの編集</legend>
      <label aria-label="タイトルの編集の入力欄">
        <input type="text" bind:value={_title} />
      </label>
    </fieldset>
  </div>

  <div>
    <fieldset>
      <legend>タグの編集</legend>
      <ul>
        <!-- {#each bookmark.tags as tag (tag.id)} -->
        {#each _tags as tag (tag.id)}
          <li>
            <label aria-label={`タグ:${tag.name}の編集の入力欄`}>
              <input type="text" bind:value={tag.name} />
            </label>
            <button
              aria-label={`${tag.name}を削除`}
              onclick={() => removeTag(tag)}
            >
              -
            </button>
          </li>
        {/each}
      </ul>
    </fieldset>
  </div>

  <button
    onclick={() => {
      addTag()
    }}
  >
    新しいタグを追加
  </button>
  <button
    onclick={() => {
      cancel(bookmark)
    }}
  >
    変更を戻す
  </button>
  <button
    onclick={() => {
      update(id, _title, _tags)
    }}
  >
    保存する
  </button>
</dialog>

<style>
  @layer components {
    @scope (.Dialog) to (.scope) {
      :scope {
        padding: 1rem;
        border: solid 1px;
        inline-size: min(100%, 40rem);
      }

      ._header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;

        & > * {
          flex: 0;
          min-inline-size: fit-content;
        }
      }
    }
  }
</style>
