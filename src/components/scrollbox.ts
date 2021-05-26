
import DataProxy from "../core/data-proxy";
import MyEvent from "../core/event";
import {Element, h} from "./element";

export default class Scrollbox {
  box: Element;
  componentWrap: Element;
  event:MyEvent;
  constructor(event:MyEvent) {
    this.event = event;
    this.box = h('div', 'x-sheet-lite-scrollbox');
    this.componentWrap = h('div', 'x-sheet-lite-component-wrap')
    this.box.child(this.componentWrap);
    this.box.on('scroll', (evt, target) => {
      const { left, top } = target.scroll();
      this.event.emit('scroll', { left, top })
    })
  }
  getOffset() {
    return this.box.scroll();
  }
  resize(data:DataProxy) {
    const { viewPort, tabelSize } = data;
    this.box.css({
      position: 'absolute',
      zIndex: '1',
      top: `${viewPort.y}px`,
      left: `${viewPort.x}px`,
      height: `${viewPort.height}px`,
      width: `${viewPort.width}`,
      overflow: 'scroll',
    });
    this.componentWrap.css({
      width: `${tabelSize.width}px`,
      height: `${tabelSize.height}px`,
    })
  }
  scrollTo(offset: {left?: number, top?: number}) {
    this.box.scroll(offset);
  }
}