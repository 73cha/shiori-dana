type Handler = (event?: Event) => void
type EventMap = Map<string, Set<Handler>>

type EventTypes =
  | 'error'
  | 'success'
  | 'initialize:start'
  | 'initialize:end'
  | 'update:start'
  | 'update:end'
  | 'remove:start'
  | 'remove:end'
  | 'reset:pagenation:index'
  | 'open:dialog'
  | 'close:dialog'

const target = new EventTarget()
const listeners: EventMap = new Map()

const emit = (eventName: EventTypes, detail = {}) => {
  const _detail: CustomEventInit = {
    detail,
    bubbles: true,
    cancelable: true,
  }
  const event = new CustomEvent(eventName, _detail)

  target.dispatchEvent(event)

  return EventManager
}

// MEMO:
// Setでhandlerを重複しないように管理
// Map {
//  eventName: Set { handler, handler, handler }
// }
const on = (eventName: EventTypes, handler: Handler) => {
  if (!listeners.has(eventName)) {
    listeners.set(eventName, new Set())
  }

  listeners.get(eventName)?.add(handler)
  target.addEventListener(eventName, handler)
}

// イベントの購読を解除する
const off = (eventName: EventTypes, handler: Handler) => {
  target.removeEventListener(eventName, handler)
  listeners.get(eventName)?.delete(handler)
}

// 一度だけ受け取る
const once = (eventName: EventTypes, handler: Handler) => {
  const wrapper: Handler = (e) => {
    handler(e)
    off(eventName, wrapper)
  }

  return on(eventName, wrapper)
}

// 特定イベントのリスナーを全解除
const offAll = (eventName: EventTypes) => {
  const handlers = listeners.get(eventName)

  if (handlers) {
    handlers.forEach((h) => target.removeEventListener(eventName, h))
    listeners.delete(eventName)
  }
}

const createEventManager = () => {
  return {
    get target() {
      return target
    },
    emit,
    on,
    off,
    once,
    offAll,
  }
}

export const EventManager = createEventManager()
