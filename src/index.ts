import { h, Element } from "./components/element";
import Scrollbox from "./components/scrollbox";
import Table from "./components/table";
import DataProxy from "./core/data-proxy";
import StyleManager from "./core/style-manager";
import { merge } from "./core/utils";

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
    align: 0,
    valign: 2,
    padding: 2,
    textWrap: false
  },
  showAxisNum: false,
  lineWidth: 1,
  lineColor: '#f2f2f2',
  bgcolor: '#ededed',
  freezeStyle: {x: '#bbbbbb', y: 'shadow'},
  defaultSize: {
    width: 60,
    height: 25,
    minWidth: 60,
    minHeight: 25,
  }
}
export default class XSheet {
  options:Required<IOptions>;
  container: Element;
  table:Table;
  scrollBox:Scrollbox;
  dataSet: {[key:string]: DataProxy} = {};
  curData?: DataProxy;
  constructor(id:string, options: IOptions) {
    // 合并配置
    this.options = merge(defaultOptions, options);
    // 创建 canvas 表格
    const tableViewport = Table.getTableViewport(this.options);
    this.table = new Table(tableViewport);
    // 创建滚动容器
    this.scrollBox = new Scrollbox();
    // 创建容器
    this.container = h('div', 'x-sheet-lite-container');

    // 样式初始化
    StyleManager.init(options.defaultStyle as IStyle, options.styleSet || {});
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
    this.container.css({ height: `${containViewport.height}px`, width: `${containViewport.width}`, position: 'relative', overflow: 'hidden' });
    this.container.child(this.table.el);
    this.container.child(this.scrollBox.box);
  }
  load(datas: ISheetData[]) {
    const [first, ...other] = datas;
    if (first) {
      this.curData = new DataProxy(first, this.options);
      this.dataSet[first.name] = this.curData;
    }
    if (other && other.length) {
      other.forEach(item => {
        this.dataSet[item.name] = new DataProxy(item, this.options);
      });
    }
  }
  resize() {
    if (this.curData) {
      this.curData.resize();
      this.table.resize(this.curData);
      this.scrollBox.resize(this.curData);
    }
  }
}