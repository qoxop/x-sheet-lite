
import { AxisOffset, ScrollBarWidth } from "../constant";
import DataProxy from "../core/data-proxy";
import MyEvent from "../core/event";
import {Element, h} from "./element";

export default class Scrollbox {
  box: Element;
  componentWrap: Element;
  event:MyEvent;
  options: Required<IOptions>;
  viewport?: ISize;
  tableSize?:ISize;
  xBar: boolean = false;
  yBar: boolean = false
  constructor(options:Required<IOptions>, event:MyEvent) {
    this.options = options;
    this.event = event;
    this.box = h('div', 'x-sheet-lite-scrollbox');
    this.componentWrap = h('div', 'x-sheet-lite-component-wrap')
    this.box.child(this.componentWrap);
    this.box.css({
      position: 'absolute',
      zIndex: '1',
      top: `${options.showAxisNum ? AxisOffset.y : 0}px`,
      left: `${options.showAxisNum ? AxisOffset.x : 0}px`,
      overflow: 'scroll',
    })
    this.box.on('scroll', (evt, target) => {
      const { left, top } = target.scroll();
      this.event.emit('scroll', { left, top })
    })
    this.event.on('overflow', (evt: {overflowX?: boolean, overflowY?: boolean} = {}) => {
      this.toggleXBar(!!evt.overflowX);
      this.toggleYBar(!!evt.overflowY);
    })
  }
  getOffset() {
    return this.box.scroll();
  }
  toggleXBar(show:boolean) {

    if (this.viewport && this.xBar !== show) {
      if (show) {
        const hei = this.box.css('height')
      } else {

      }
    }
  }
  toggleYBar(show: boolean) {
    if (this.viewport && this.yBar === show) {
      if (show) {

      } else {

      }
    }
  }
  resize(data:DataProxy) {
    const { viewport, tabelSize: {width: tWidth, height: tHeight}} = data;
    this.viewport = viewport;
    const fx = (this.options.showAxisNum ? AxisOffset.x : 0) + (tWidth - viewport.width > AxisOffset.x ? ScrollBarWidth : 0);
    const fy = (this.options.showAxisNum ? AxisOffset.y : 0) + (tHeight - viewport.height > AxisOffset.y ? ScrollBarWidth : 0);
    this.box.css({
      height: `${viewport.height - fy}px`,
      width: `${viewport.width - fx}px`,
    });
    this.componentWrap.css({
      width: `${tWidth}px`,
      height: `${tHeight}px`,
    })
  }
  scrollTo(offset: {left?: number, top?: number}) {
    this.box.scroll(offset);
  }
}