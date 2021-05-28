
// import { throttle } from "lodash";
import { AxisOffset, ScrollBarWidth } from "../constant";
import DataProxy from "../core/data-proxy";
import MyEvent from "../core/event";
import {Element, h} from "./element";

export default class Scrollbox {
  box: Element;
  componentWrap: Element;
  xBarEl: Element;
  yBarEl: Element;
  xSlideEl: Element;
  ySlideEl: Element;
  event:MyEvent;
  options: Required<IOptions>;
  viewport?: ISize;
  tableSize?:ISize;
  xBar: boolean = false;
  yBar: boolean = false;
  lock:boolean = false;
  constructor(options:Required<IOptions>, event:MyEvent) {
    const borderRadius = `${ScrollBarWidth / 2}px`;
    const top = `${options.showAxisNum ? AxisOffset.y : 0}px`;
    const left = `${options.showAxisNum ? AxisOffset.x : 0}px`;
    this.options = options;
    this.event = event;
    this.box = h('div', 'x-sheet-lite-scrollbox');
    this.componentWrap = h('div', 'x-sheet-lite-component-wrap');
    this.xBarEl = h('div', 'x-sheet-lite-scrollbar-x');
    this.yBarEl = h('div', 'x-sheet-lite-scrollbar-y');
    this.xSlideEl = h('div', 'x-sheet-lite-slide-x').css({borderRadius});
    this.ySlideEl = h('div', 'x-sheet-lite-slide-y').css({borderRadius});
  
    // 元素拼接 & 样式设置
    this.box.child(this.componentWrap).css({ top, left });
    this.xBarEl.child(this.xSlideEl).css({left, height: `${ScrollBarWidth}px`, borderRadius });
    this.yBarEl.child(this.ySlideEl).css({ top, width: `${ScrollBarWidth}px`, borderRadius });

    // 事件监听
    this.box.on('scroll', (evt, target) => {
      const { left, top } = target.scroll();
      if (!this.lock) { // 拖拽滚动和自然滚动不能同时进行
        this.setSlideY(top, true);
        this.setSlideX(left, true);
        this.event.emit('scroll', { left, top })
      }
    });
    // 事件监听，当表格的实际尺寸大于可视区域的尺寸时
    this.event.on('overflow', (evt: {overflowX?: boolean, overflowY?: boolean, rateX?: number, rateY?: number} = {}) => {
      const updateY = this.ySlideEl.update('rateY', evt.rateY);
      if (updateY && evt.rateY) {
        this.ySlideEl.css({height: `${evt.rateY *100}%`})
      }
      const updateX = this.xSlideEl.update('rateX', evt.rateX);
      if (updateX && evt.rateX) {
        this.xSlideEl.css({width: `${evt.rateX *100}%`})
      }
      this.toggleXBar(!!evt.overflowX);
      this.toggleYBar(!!evt.overflowY);
    });
    this.slideListenDrag();
  }
  getOffset() {
    return this.box.scroll();
  }
  toggleXBar(show:boolean) {
    if (this.viewport && this.xBar !== show) {
      if (show) {
        this.xBarEl.show();
      } else {
        this.xBarEl.hide();
      }
    }
  }
  toggleYBar(show: boolean) {
    if (this.viewport && this.yBar === show) {
      if (show) {
        this.yBarEl.show();
      } else {
        this.yBarEl.hide();
      }
    }
  }
  resize(data:DataProxy) {
    const { viewport, tabelSize: {width: tWidth, height: tHeight}} = data;
    this.viewport = viewport;
    this.xBar = tWidth - viewport.width > AxisOffset.x;
    this.yBar = tHeight - viewport.height > AxisOffset.y;
    const fx = (this.options.showAxisNum ? AxisOffset.x : 0) + (this.xBar ? ScrollBarWidth : 0);
    const fy = (this.options.showAxisNum ? AxisOffset.y : 0) + (this.yBar ? ScrollBarWidth : 0);
    this.box.css({
      height: `${viewport.height - fy}px`,
      width: `${viewport.width - fx}px`,
    });
    this.componentWrap.css({
      width: `${tWidth}px`,
      height: `${tHeight}px`,
    })
    if (this.xBar) {
      this.xBarEl.show();
    } else {
      this.xBarEl.hide();
    }
    if (this.yBar) {
      this.yBarEl.show();
    } else {
      this.yBarEl.hide();
    }
  };
  setSlideY = (top:number, byScroll?: boolean) => {
    const rateY = byScroll ? this.ySlideEl.get('rateY') : 1;
    if (rateY) {
      this.ySlideEl.css({top: `${top * rateY}px`});
    }
  };
  setSlideX = (left:number, byScroll?: boolean) => {
    const rateX = byScroll ? this.xSlideEl.get('rateX') : 1;
    if (rateX) {
      this.xSlideEl.css({left: `${left * rateX}px`})
    }
  };
  slideListenDrag() {
    let x = 0;
    let y = 0;
    let left = 0;
    let top = 0;
    let rateX = 0;
    let maxLeft = 0;
    let rateY = 0;
    let maxTop = 0;
    this.xSlideEl.onDrag({
      start: (evt:MouseEvent) => {
        if (!this.lock) {
          x = evt.screenX;
          left = parseFloat(this.xSlideEl.css('left') || '0');
          top = parseFloat(this.ySlideEl.css('top') || '0');
          rateX = this.xSlideEl.get('rateX');
          maxLeft = (1 - rateX) * ((this.viewport?.width || 0) - AxisOffset.x - ScrollBarWidth);
          this.lock = true;
        }
        
      },
      end: () => this.lock = false,
      dragging: (evt: MouseEvent) => {
        evt.stopPropagation();
        if (this.lock) {
          const nleft = Math.max(Math.min(left + (evt.screenX - x), maxLeft), 0);
          this.box.scroll({left: nleft / rateX, top});
          this.setSlideX(nleft)
          this.event.emit('scroll', { left: nleft / rateX, top })
        }
      }
    });
    this.ySlideEl.onDrag({
      start: (evt: MouseEvent) => {
        if (!this.lock) {
          y = evt.screenY;
          left = parseFloat(this.xSlideEl.css('left') || '0');
          top = parseFloat(this.ySlideEl.css('top') || '0');
          rateY = this.ySlideEl.get('rateY');
          maxTop = (1 - rateY) * ((this.viewport?.height || 0) - AxisOffset.y - ScrollBarWidth);
          this.lock = true;
        }
      },
      end: () => this.lock == false,
      dragging: (evt: MouseEvent) => {
        evt.stopPropagation();
        if (this.lock) {
          const ntop = Math.max(Math.min(top + (evt.screenY - y), maxTop), 0);
          this.box.scroll({left, top: ntop / rateY});
          this.setSlideY(ntop)
          this.event.emit('scroll', { left, top: ntop / rateY })
        }
      }
    })
  }
}