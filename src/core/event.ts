

export type EventTypes =
  'dblclick'|
  'click'|
  'scroll' |
  'rangeSelect' |
  'cellSelect' |
  'enterEdit' |
  'editing' |
  'quitEdit' |
  'beforeUpdate' |
  'update' |
  'touchMove'|
  'copy' |
  'paste'|
  'undo'|
  'redo'|
  'delete'|
  '';


export default class MyEvent {
  handlers:{[k:string]: Function[]};
  constructor() {
    this.handlers = {};
  }
  emit(eventType: EventTypes, event?: unknown):any[] {
    if (this.handlers[eventType]) {
      return this.handlers[eventType].map((handler) => handler(event));
    }
    return [];
  }
  on<T = unknown>(eventType: EventTypes, callback: (event:T) => unknown): void {
    const handlers = this.handlers[eventType] || [];
    if (handlers.every((handler) => handler !== callback)) {
      handlers.push(callback);
    }
    this.handlers[eventType] = handlers;
  }
  clearEvent(eventType: EventTypes):void {
    if (this.handlers[eventType]) {
      delete this.handlers[eventType];
    }
  }
  unListen(eventType: EventTypes, callback: Function): void {
    if (this.handlers[eventType]) {
      this.handlers[eventType] = this.handlers[eventType].filter((hd) => hd !== callback);
    }
  }
}
