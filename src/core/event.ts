

type EventTypes = 
  'scroll' |
  'rangeSelect' |
  'cellSelect' |
  'enterEdit' |
  'editing' |
  'quitEdit' |
  'beforeUpdate' |
  'update' |
  'copy'|
  'afterCopy' |
  'paste'|
  'afterPaste'|
  'overflow';

export default class MyEvent {
  handlers:{[k:string]: Function[]};
  constructor() {
    this.handlers = {};
  }
  emit(eventType: EventTypes, event: any) {
    if (this.handlers[eventType]) {
      return this.handlers[eventType].map(handler => handler(event));
    }
    return [];
  }
  on<T = unknown>(eventType: EventTypes, callback: (event:T) => any) {
    const handlers = this.handlers[eventType] || [];
    if (handlers.every(handler => handler !== callback)) {
      handlers.push(callback);
    }
    this.handlers[eventType] = handlers;
  }
  clearEvent(eventType: EventTypes) {
    if (this.handlers[eventType]) {
      delete this.handlers[eventType];
    }
  }
  unListen(eventType: EventTypes, callback: any) {
    if (this.handlers[eventType]) {
      this.handlers[eventType] = this.handlers[eventType].filter(hd => hd !== callback);
    }
  }
}