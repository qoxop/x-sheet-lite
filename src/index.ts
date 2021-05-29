import { h, Element } from "./components/element";
import Scrollbox from "./components/scrollbox";
import Table from "./components/table";
import DataProxy from "./core/data-proxy";
import MyEvent from "./core/event";
import { register } from "./core/formula";
import StyleManager from "./core/style-manager";
import { merge, throttle } from "./core/utils";

const defaultOptions:IOptions = {
  styleSet: {},
  defaultStyle: {
    color: '#333333',
    bgcolor: '#ffffff',
    italic: false,
    bold: false,
    fontSize: 12,
    fontName: 'Arial',
    lh: 14,
    align: 2,
    valign: 2,
    padding: 2,
    textWrap: true
  },
  showAxisNum: false,
  lineWidth: 1,
  lineColor: '#f2f2f2',
  bgcolor: '#ededed',
  freezeStyle: {x: '#bbbbbb', y: 'shadow'},
  defaultSize: {
    width: 100,
    height: 30,
    minWidth: 60,
    minHeight: 25,
  },
  getViewport: () => ({width: window.innerWidth, height: window.innerHeight})
}
export default class XSheet {
  static formulaRegister(formula: IFormula) {
    return register(formula)
  }
  options:Required<IOptions>;
  container: Element;
  table:Table;
  scrollBox:Scrollbox;
  event: MyEvent = new MyEvent();
  dataSet: {[key:string]: DataProxy} = {};
  curData?: DataProxy;
  throttleRender: () => void;
  constructor(id:string, options: IOptions) {
    // 合并配置
    this.options = merge(defaultOptions, options);
    // 创建 canvas 表格
    this.table = new Table(this.options);
    // 创建滚动容器
    this.scrollBox = new Scrollbox(this.options, this.event);
    // 创建容器
    this.container = h('div', 'x-sheet-lite-container');

    // 样式初始化
    StyleManager.init(this.options.defaultStyle as IStyle, this.options.styleSet || {});

    // dom 节点初始化
    const dom = document.getElementById(id) as HTMLElement;
    dom.style.padding = "0px";
    dom.style.margin = "0px";
    while (dom.firstChild) {
      dom.removeChild(dom.firstChild);
    }

    // 容器连接
    dom?.appendChild(this.container.el);
    const containViewport = this.options.getViewport();
    this.container.css({ backgroundColor: this.options.bgcolor, height: `${containViewport.height}px`, width: `${containViewport.width}`, position: 'relative', overflow: 'hidden' });
    this.container.children(
      this.table.el,
      this.scrollBox.box,
      this.scrollBox.xBarEl,
      this.scrollBox.yBarEl,
    );
    // 节流渲染
    this.throttleRender = throttle(() => {
      if (this.curData) {
        this.table.render(this.curData)
      }
    })
    this.listen();
  }
  private listen() {
    this.event.on('touchMove', this.hanleTouchMove);
    this.event.on('scroll', this.handleScroll);
  }
  load(datas: ISheetData[]) {
    const [first, ...other] = datas;
    if (first) {
      this.curData = new DataProxy(first, this.options, this.event);
      this.dataSet[first.name] = this.curData;
      // 数据加载完需要重新调整大小
      this.table.resize(this.curData);
      this.scrollBox.resize(this.curData);
    }
    if (other && other.length) {
      other.forEach(item => {
        this.dataSet[item.name] = new DataProxy(item, this.options, this.event);
      });
    }
  }
  resize() {
    if (this.curData) {
      this.curData.resize(true);
      this.table.resize(this.curData);
      this.scrollBox.resize(this.curData);
    }
  }
  private hanleTouchMove = (evt: {from: number[], to: number[], offset: IPxPoint}) => {
    const { from, to, offset = {x: 0, y: 0} } = evt;
    if (this.curData && from && to) {
      const range = this.curData.rangeSearch(from[0], from[1], to[0], to[1], offset);
      this.curData.setSelectedRange(range);
      this.table.render(this.curData);
    }
  }
  private handleScroll = (data: { left:number, top:number }) => {
    if (this.curData) {
      const { left, top } = data;
      this.curData.setOffset({ x: left, y: top })
      this.throttleRender();
    }
  }
}