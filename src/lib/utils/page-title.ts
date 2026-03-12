import { PUBLIC_APP_TITLE } from '$env/static/public'

/**
 * @description
 * ページのタイトルを合成するユーティリティー関数。\
 * 引数(各ページのタイトル)があれば、合成したタイトルを返し、\
 * なければサイトタイトルのみを返す。
 */
export const pageTitle = (title?: string): string =>
  title ? `${title} | ${PUBLIC_APP_TITLE}` : PUBLIC_APP_TITLE
