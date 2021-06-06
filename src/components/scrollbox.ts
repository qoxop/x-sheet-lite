
import { throttle } from '../core/utils';
import { AxisOffset, ScrollBarWidth } from '../constant';
import DataProxy from '../core/data-proxy';
import MyEvent from '../core/event';
import { Element, h } from './element';

/**
 * 所有事件的触发位置都是相对与 tableSize 的
 */
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
  xBar: boolean = false;
  yBar: boolean = false;
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
    this.xSlideEl = h('div', 'x-sheet-lite-slide-x').css({ borderRadius });
    this.ySlideEl = h('div', 'x-sheet-lite-slide-y').css({ borderRadius });


    // 元素拼接 & 样式设置
    this.box.child(this.componentWrap).css({ top, left });
    this.xBarEl.child(this.xSlideEl).css({ left, height: `${ScrollBarWidth}px`, borderRadius });
    this.yBarEl.child(this.ySlideEl).css({ top, width: `${ScrollBarWidth}px`, borderRadius });
    this.scrollEventEmit();
    this.touchEventEmit();
  }
  toggleXBar(show:boolean):void {
    if (this.viewport && this.xBar !== show) {
      if (show) {
        this.xBarEl.show();
      } else {
        this.xBarEl.hide();
      }
    }
  }
  toggleYBar(show: boolean):void {
    if (this.viewport && this.yBar === show) {
      if (show) {
        this.yBarEl.show();
      } else {
        this.yBarEl.hide();
      }
    }
  }
  /**
   * 根据 DataProxy 的信息进行元素尺寸的调整
   * @param data
   */
  resize(data:DataProxy):void {
    const { viewport, tabelSize: { width: tWidth, height: tHeight }, offsetY, offsetX } = data;
    this.viewport = viewport;
    this.xBar = tWidth - viewport.width > AxisOffset.x;
    this.yBar = tHeight - viewport.height > AxisOffset.y;
    this.box.css({
      height: `${viewport.height}px`,
      width: `${viewport.width}px`,
    });
    this.box.update('offset', { x: offsetY, y: offsetX });
    const rateX = viewport.width / tWidth;
    const rateY = viewport.height / tHeight;
    this.xSlideEl.update('rateX', rateX);
    this.ySlideEl.update('rateY', rateY);
    this.ySlideEl.css({ height: `${rateY * 100}%`, top: `${offsetY * rateY}px` });
    this.xSlideEl.css({ width: `${rateX * 100}%`, left: `${offsetX * rateX}px` });

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
  }
  setSlideY = (top:number, byScroll?: boolean):void => {
    const rateY = byScroll ? this.ySlideEl.get('rateY') : 1;
    if (rateY) {
      this.ySlideEl.css({ top: `${top * rateY}px` });
    }
  };
  setSlideX = (left:number, byScroll?: boolean):void => {
    const rateX = byScroll ? this.xSlideEl.get('rateX') : 1;
    if (rateX) {
      this.xSlideEl.css({ left: `${left * rateX}px` })
    }
  };
  emitScroll = (evt: { left:number, top: number }):void => {
    this.box.update('offset', { x: evt.left, y: evt.top });
    this.event.emit('scroll', evt);
  }
  touchEventEmit():void { // 触发点击、拖动事件
    let lockClick = false; // 防止 click 事件和 mouseup 同时触发
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    let offset = { x: 0, y: 0 }
    const emitTouchMove = throttle((from: number[], to: number[], offset: IPxPoint) => this.event.emit('touchMove', { from, to, offset }));
    this.componentWrap.on('dblclick', (evt:MouseEvent) => {
      if (evt.target === this.componentWrap.el) { // 锁定元素
        evt.stopPropagation();
        this.event.emit('dblclick', evt)
      }
    });
    this.componentWrap.on('click', (evt: MouseEvent) => { // 视作一个 touchMove 事件
      if (evt.target === this.componentWrap.el) { // 锁定元素
        evt.stopPropagation();
        const point = [evt.offsetX, evt.offsetY];
        this.event.emit('click', { point, evt });
        if (!lockClick) {
          offset = this.box.get('offset');
          emitTouchMove(point, point, offset);
        }
      }
    });
    this.componentWrap.onDrag({
      start: (evt) => {
        evt.stopPropagation();
        offset = this.box.get('offset');
        startX = evt.offsetX;
        startY = evt.offsetY;
      },
      end: () => {
        setTimeout(() => {
          lockClick = false;
        }, 2);
      },
      dragging: (evt) => {
        evt.stopPropagation();
        lockClick = true;
        if (evt.offsetX > ScrollBarWidth) {
          endX = evt.offsetX;
        }
        if (evt.offsetY > ScrollBarWidth) {
          endY = evt.offsetY;
        }
        emitTouchMove([startX, startY], [endX, endY], offset);
      },
    })
  }
  scrollEventEmit():void { // 触发滚动事件
    let nativeScrollLock = false;
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
        if (!nativeScrollLock) {
          x = evt.screenX;
          left = parseFloat(this.xSlideEl.css('left') || '0');
          top = parseFloat(this.ySlideEl.css('top') || '0');
          rateX = this.xSlideEl.get('rateX');
          maxLeft = (1 - rateX) * (this.viewport?.width || 0);
          nativeScrollLock = true;
        }

      },
      end: () => nativeScrollLock = false,
      dragging: (evt: MouseEvent) => {
        evt.stopPropagation();
        if (nativeScrollLock) {
          const nleft = Math.max(Math.min(left + (evt.screenX - x), maxLeft), 0);
          this.box.scroll({ left: nleft / rateX, top });
          this.setSlideX(nleft)
          this.emitScroll({ left: nleft / rateX, top })
        }
      },
    });
    this.ySlideEl.onDrag({
      start: (evt: MouseEvent) => {
        if (!nativeScrollLock) {
          y = evt.screenY;
          left = parseFloat(this.xSlideEl.css('left') || '0');
          top = parseFloat(this.ySlideEl.css('top') || '0');
          rateY = this.ySlideEl.get('rateY');
          maxTop = (1 - rateY) * (this.viewport?.height || 0);
          nativeScrollLock = true;
        }
      },
      end: () => nativeScrollLock = false,
      dragging: (evt: MouseEvent) => {
        evt.stopPropagation();
        if (nativeScrollLock) {
          const ntop = Math.max(Math.min(top + (evt.screenY - y), maxTop), 0);
          this.box.scroll({ left, top: ntop / rateY });
          this.setSlideY(ntop)
          this.emitScroll({ left, top: ntop / rateY })
        }
      },
    });
    this.box.on('scroll', () => {
      const { left, top } = this.box.scroll();
      if (!nativeScrollLock) { // 拖拽滚动和自然滚动不能同时进行
        this.setSlideY(top, true);
        this.setSlideX(left, true);
        this.emitScroll({ left, top })
      }
    });
  }
}
