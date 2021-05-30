import { h, Element } from "./components/element";
import Scrollbox from "./components/scrollbox";
import Table from "./components/table";
import Input from "./components/inputs";
import DataProxy from "./core/data-proxy";
import MyEvent from "./core/event";
import { register } from "./core/formula";
import StyleManager from "./core/style-manager";
import { merge, throttle } from "./core/utils";

const defaultOptions:IOptions = {
  styleSet: {
    'disable-edit': {
      bgcolor: '#bbf6f6'
    },
    'header': {
      bgcolor: '#bbb6f6'
    }
  },
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
  showAxisNum: true,
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
  private $event: MyEvent = new MyEvent();
  /** 用户监听事件回调函数 */
  private $hooks: {[k:string]: Function[]} = {};
  private options:Required<IOptions>;
  private container: Element;
  private table:Table;
  private scrollBox:Scrollbox;
  private input:Input;
  private dataSet: {[key:string]: DataProxy} = {};
  private curData?: DataProxy;
  throttleRender: () => void;
  constructor(id:string, options: IOptions) {
    // 合并配置
    this.options = merge(defaultOptions, options);
    // 创建 canvas 表格
    this.table = new Table(this.options);
    // 创建滚动容器
    this.scrollBox = new Scrollbox(this.options, this.$event);
    
    // 创建容器
    this.container = h('div', 'x-sheet-lite-container');
    // 输入组件
    this.input = new Input(this.scrollBox.componentWrap, this.updateCell, () => 0);
    // 样式初始化
    StyleManager.init(this.options.defaultStyle as IStyle, this.options.styleSet || {});

    const dom = document.getElementById(id) as HTMLElement;
    dom.style.padding = "0px";
    dom.style.margin = "0px";
    while (dom.firstChild) {
      dom.removeChild(dom.firstChild);
    }

    dom?.appendChild(this.container.el);
    const containViewport = this.options.getViewport();
    this.container.css({ backgroundColor: this.options.bgcolor, height: `${containViewport.height}px`, width: `${containViewport.width}`, position: 'relative', overflow: 'hidden' });
    this.container.children(
      this.table.el,
      this.scrollBox.box,
      this.scrollBox.xBarEl,
      this.scrollBox.yBarEl,
    );

    this.throttleRender = throttle(() => this.curData && this.table.render(this.curData));
    this.keyEventEmiter();
    this.listen();
  }
  /**
   * 执行监听
   */
  private listen() {
    this.$event.on('touchMove', this.hanleTouchMove);
    this.$event.on('scroll', this.handleScroll);
    this.$event.on('dblclick', (evt: {offsetX: number, offsetY: number, offsetBoxX:number, offsetBoxY: number }) => {
      if (this.curData) {
        const {offsetX, offsetY, offsetBoxX, offsetBoxY} = evt;
        const {cell, rect} = this.curData.findCellRectsInfo(offsetX, offsetY, offsetBoxX, offsetBoxY);
        if (cell.disableEdit) {
          return;
        }
        this.curData.clearSelectedRange();
        this.curData.onEditing = true;
        this.input.display(cell, rect);
      }
    })
    // 监听 ctrl c
    this.$event.on('beforeCopy', (evt:IRange) => {
      const canCopy = (this.$hooks['beforeCopy'] || []).every(fn => fn(evt) !== false);
      if (canCopy) {
        this.curData?.copy();
        this.throttleRender();
      }
    });
    // 监听 ctrl v
    this.$event.on('beforePaste',(evt: { copied: IRange, target: IRange }) => {
      const canPaste = (this.$hooks['beforePaste'] || []).every(fn => fn(evt) !== false);
      if (canPaste) {
        this.curData?.paste();
        this.throttleRender();
      }
    });
  }
  /**
   * 键盘事件触发器
   */
  private keyEventEmiter() {
    window.addEventListener('keydown', (evt) => {
      const keyCode = evt.keyCode || evt.which;
      const {
        key, ctrlKey, shiftKey, metaKey
      } = evt;
      if (this.curData) {
        if (ctrlKey || metaKey) {
          switch (keyCode) {
            case 67: // Ctrl C
              this.$event.emit('beforeCopy', {...this.curData.selectedRange});
              evt.preventDefault();
              break;
            case 86: // Ctrl V
              this.$event.emit('beforePaste', {
                copied: {...this.curData.copiedRange},
                target: {...this.curData.rangeSearch}
              })
              break;
            default:
              break;
          }
        } else {
          switch (keyCode) {
            case 13:
              this.input.complete();
              break;
            default:
              break;
          }
        }
      }
    })
  }
  /**
   * 处理鼠标滑动事件（选区计算和渲染）
   * @param evt 
   */
  private hanleTouchMove = (evt: {from: number[], to: number[], offset: IPxPoint}) => {
    const { from, to, offset = {x: 0, y: 0} } = evt;
    if (this.curData && from && to) {
      // 选择选区时移除编辑状态
      this.curData.onEditing = false;
      this.input.complete();
      // 查找并设置选区
      const range = this.curData.rangeSearch(from[0], from[1], to[0], to[1], offset);
      this.curData.setSelectedRange(range);
      this.table.render(this.curData);
    }
  }
  /**
   * 滚动事件处理
   * @param evt 
   */
  private handleScroll = (evt: { left:number, top:number }) => {
    if (this.curData) {
      const { left, top } = evt;
      this.curData.setOffset({ x: left, y: top })
      this.throttleRender();
      this.input.rePosition(left, top);
    }
  }
  /**
   * 执行更新动作
   * @param datas 
   */
  private updateCell = (data: {value:any, cell:ICell}) => {
    const {value, cell} = data;
    if (this.curData) {
      const canUpdate = (this.$hooks['beforeUpdate'] || []).every(fn => fn(value, cell) !== false);
      if (canUpdate) {
        this.curData.updateCell(cell.r, cell.c, { v: value });
        this.throttleRender();
      }
    }
  }
  /**
   * 数据加载
   * @param datas 
   */
   public load(datas: ISheetData[]) {
    const [first, ...other] = datas;
    if (first) {
      this.curData = new DataProxy(first, this.options, this.$event);
      this.dataSet[first.name] = this.curData;
      // 数据加载完需要重新调整大小
      this.table.resize(this.curData);
      this.scrollBox.resize(this.curData);
    }
    if (other && other.length) {
      other.forEach(item => {
        this.dataSet[item.name] = new DataProxy(item, this.options, this.$event);
      });
    }
  }
  /**
   * 重新调整大小
   */
  public resize() {
    if (this.curData) {
      this.curData.resize(true);
      this.table.resize(this.curData);
      this.scrollBox.resize(this.curData);
    }
  }
}