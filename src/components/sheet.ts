// import DataProxy from '../core/data-proxy';
import DataProxy from '../core/data-proxy';
import { throttle } from '../core/utils';
import { Element, h } from './element'
import Table from './table';
interface IOptions {
  id: string,
  data:ISheetOptions
}

export default class Sheet {
  options: IOptions;
  data: DataProxy;
  canvasEl: Element;
  comsBoxEl: Element;
  scrollBoxEl: Element;
  tableEl: Element;
  tableInstance: Table;
  render: () => void;
  constructor(options: IOptions) {
    this.options = options;
    const { id, data } = options;
    // 获取容器元素
    const container = new Element(document.getElementById(id) as HTMLElement);
    // 创建画布
    this.canvasEl = h('canvas');
    // 创建组件盒子
    this.comsBoxEl = h('div', 'r-sheet-table-components');
    // 创建滚动盒子
    this.scrollBoxEl = h('div', 'r-sheet-table-scollbox').children(this.comsBoxEl) as Element;
    // 表格容器
    this.tableEl = h('div', 'r-sheet-table').children(this.canvasEl, this.scrollBoxEl) as Element;
    // 插入表格
    container.children(this.tableEl);
    this.data = new DataProxy(data);
    this.resize(true);
    // 表格实例
    this.tableInstance = new Table(this.canvasEl.el as HTMLCanvasElement, this.data);
    // 渲染方法节流
    this.render = throttle(this.tableInstance.render.bind(this.tableInstance));
    this.render();

    // 滚动监听
    this.scrollBoxEl.on('scroll', (evt, target) => {
      const {left, top } = target.scroll();
      const times = Date.now()
      this.data.setOffset({ x: left, y: top });
      this.render();
      console.log(`render times: ${Date.now() - times}`)
    })
  }
  resize(uncount?:boolean) {
    if (!uncount) {
      this.data.resize();
    }
    const { viewPort, tabelSize } = this.data;
    this.canvasEl.css({height: `${viewPort.height}px`, width: `${viewPort.width}px`, background: '#999'})
    this.scrollBoxEl.css({height: `${viewPort.height}px`, width: `${viewPort.width}px`});
    this.comsBoxEl.css({height: `${tabelSize.height}px`, width: `${tabelSize.width}px`});
  }
}