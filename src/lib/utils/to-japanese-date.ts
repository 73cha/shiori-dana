import type { YYYYMMDD } from '$lib/types'

export const toJapaneseDate = (
  dateString: YYYYMMDD,
): `${string}年${string}月${string}日` | undefined => {
  const datePattern = /[0-9]{4}-[0-9]{2}-[0-9]{2}/

  if (!datePattern.test(dateString)) {
    return
  }

  const [year, month, date] = dateString.split('-')

  return `${year}年${month}月${date}日`
}
