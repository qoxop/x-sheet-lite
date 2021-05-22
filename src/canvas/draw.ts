// https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D

type FieldOfCtx<K extends keyof CanvasRenderingContext2D> = CanvasRenderingContext2D[K];

const dpr = window.devicePixelRatio || 1;
const GridLine = 1;
const thinLineWidth = dpr;

function npx(px: number) {
  return Math.floor(px * dpr);
}

export default class Draw {
  el: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  constructor(el: HTMLCanvasElement, width:number, height: number) {
    this.el = el;
    this.ctx = el.getContext('2d') as CanvasRenderingContext2D;
    this.el.style.width = `${width}px`;
    this.el.style.height = `${height}px`;
    this.el.width = npx(width);
    this.el.height = npx(height);
    this.ctx.scale(dpr, dpr);
  }
  /**
   * 清空整个 canvas
   * @param rect 
   * @returns 
   */
  clear() {
    const { width, height } = this.el;
    this.ctx.clearRect(0, 0, width, height);
    return this;
  }
  /**
   * 清空指定区域
   * @param x 
   * @param y 
   * @param w 
   * @param h 
   * @returns 
   */
  clearRect(x:number, y:number, w:number, h:number) {
    this.ctx.clearRect(npx(x), npx(y), npx(w), npx(h));
    return this;
  }
  /**
   * 填充指定区域
   * @param x 
   * @param y 
   * @param w 
   * @param h 
   * @returns 
   */
  fillRect(x:number, y:number, w:number, h:number) {
    this.ctx.fillRect(npx(x), npx(y), npx(w), npx(h));
    return this;
  }
  /**
   * 绘制一个矩形的边框
   * @param x 
   * @param y 
   * @param w 
   * @param h 
   * @returns 
   */
  strokeRect(x:number, y:number, w:number, h:number) {
    this.ctx.strokeRect(npx(x), npx(y), npx(w), npx(h));
    return this;
  }
  /**
   * 绘制实心文本
   * @param text 
   * @param x 
   * @param y 
   * @returns 
   */
  fillText(text:string, x:number, y:number) {
    this.ctx.fillText(text, npx(x), npx(y));
    return this;
  }
  /**
   * 绘制描边文本
   * @param text 
   * @param x 
   * @param y 
   * @returns 
   */
  strokeText(text:string, x:number, y:number){
    this.ctx.strokeText(text, npx(x), npx(y));
    return this;
  }
  /**
   * ctx 样式、属性设置
   * @param options
   * @returns
   */
  attr(options: {
    fillStyle?: FieldOfCtx<'fillStyle'>,
    strokeStyle?: FieldOfCtx<'strokeStyle'>,
    globalAlpha?: FieldOfCtx<'globalAlpha'>, // 设置透明度
    lineWidth?: FieldOfCtx<'lineWidth'>, // 设置线条宽度。
    lineCap?: FieldOfCtx<'lineCap'>,  // 设置线条末端样式。
    lineJoin?: FieldOfCtx<'lineJoin'>, // 设定线条与线条间接合处的样式。
    miterLimit?: FieldOfCtx<'miterLimit'>, // 限制当两条线相交时交接处最大长度；所谓交接处长度（斜接长度）是指线条交接处内角顶点到外角顶点的长度。
    lineDashOffset?: FieldOfCtx<'lineDashOffset'>, // 设置虚线样式的起始偏移量。
    textBaseline?: FieldOfCtx<'textBaseline'>,
    textAlign?: FieldOfCtx<'textAlign'>,
    font?: FieldOfCtx<'font'>,
    direction?: FieldOfCtx<'direction'>,
    shadowBlur?: FieldOfCtx<'shadowBlur'>,
    shadowColor?: FieldOfCtx<'shadowColor'>,
    shadowOffsetX?: FieldOfCtx<'shadowOffsetX'>,
    shadowOffsetY?: FieldOfCtx<'shadowOffsetY'>,
    [key: string]: any
  }) {
    Object.assign(this.ctx, options);
    return this;
  }
  /**
   * 设置线条样式
   * @param style 
   * @param color 
   * @returns 
   */
  lineStyle(
    style: 'medium' | 'thick' | 'dashed' | 'dotted' | 'double', 
    color:string
  ) {
    const { ctx } = this;
    ctx.lineWidth = thinLineWidth;
    ctx.strokeStyle = color;
    if (style === 'medium') {
      ctx.lineWidth = npx(2);
    } else if (style === 'thick') {
      ctx.lineWidth = npx(3);
    } else if (style === 'dashed') {
      ctx.setLineDash([npx(3), npx(2)]);
    } else if (style === 'dotted') {
      ctx.setLineDash([npx(1), npx(1)]);
    } else if (style === 'double') {
      ctx.setLineDash([npx(2), 0]);
    }
    return this;
  }
  
  translate(x:number, y:number) {
    this.ctx.translate(npx(x), npx(y));
    return this;
  }
  moveTo(x:number, y:number) {
    this.ctx.moveTo(npx(x), npx(y));
    return this;
  }
  lineTo(x:number, y:number) {
    this.ctx.lineTo(npx(x), npx(y));
    return this;
  }
  rect(x: number, y: number, w: number, h: number) {
    this.ctx.rect(npx(x), npx(y), npx(w), npx(h));
    return this;
  }
  // TODO arcTo、arc、bezierCurveTo、quadraticCurveTo ....

  /**
   * 区域剪切
   * @param x 
   * @param y 
   * @param w 
   * @param h 
   * @returns 
   */
  clipRect (x: number, y: number, w: number, h: number) {
    this.ctx.save();
    this.ctx.rect(npx(x), npx(y), npx(w), npx(h));
    this.ctx.clip();
    return () => this.ctx.restore()
  }
  
  /**
   * 绘制文本
   */
  public text(
    txt:string,
    rect: IRects,
    style: ITextStyle,
    textWrap?:boolean
  ) {
    
    this.ctx.save();
    const [x, y, width, height] = rect;
    // 0 start, 2 center, 1: end
    const { align, valign, font, color, lh } = style;
    let tx = (align ? width / align : 0) + x;
    let ty = (valign ? height / valign : 0) + y + ((lh - font.size) / 2);
    const textAlign = align === 2 ? 'center' : (align === 0 ? 'left' :'right');
    const textBaseline = valign === 2 ? 'middle': (valign === 0 ? 'top' : 'bottom');
    this.attr({
      font: `${font.italic ? 'italic' : ''} ${font.bold ? 'bold' : ''} ${npx(font.size)}px ${font.name}`,
      fillStyle: color,
      textBaseline,
      textAlign
    });
    const txts = txt.split('\n');
    // 不自动换行 && 没有换行符
    if (!textWrap && txts.length === 1) {
      this.fillText(txt, tx, ty);
    // 不自动换行 && 有换行符
    } else if (!textWrap) {
      for (let ti = 0; ti < txts.length; ti++) {
        if (ti > 0) {
          ty += lh; // 修改 Y 轴起点
        }
        this.fillText(txt, tx, ty);
      }
    // 处理自动换行
    } else {
      
      let cursor = 0;
      const boxWidth = npx(width);
      for (let ti = 0; ti < txts.length; ti++) {
        const tiTxt = txts[ti];
        const tiTxtW = this.ctx.measureText(tiTxt).width;
        if (tiTxtW > boxWidth) { // 字符串超出检测
          let start = 0;
          for (let end = 1; end <= tiTxt.length; end++) {
            const subStr = tiTxt.substring(start, end);
            if (this.ctx.measureText(subStr).width > boxWidth) { // 子字符串超出检测
              this.fillText(subStr.substr(0, end - start - 1), tx, ty + (cursor * lh));
              cursor++;
              start = end - 1;
              end--;
            }
          }
        } else {
          this.fillText(txt, tx, ty + (cursor * lh));
          cursor++;
        }
      }
    }
    this.ctx.restore();
    return this;
  }
  // public richText(
  //   rTxts: {

  //   }[],
  //   rect: IRect,
  //   align: TextAlign,
  //   valign: VAlign,
  // ) {
  //   // TODO
  // }
  /**
   * 绘制直线
   * @param from 
   * @param to 
   * @param witdh 
   * @param color 
   */
  public straightLine(from: IPoint, to: IPoint, style: {
    witdh: number,
    color: string
  }) {
    this.ctx.save();
    this.ctx.beginPath();
    const { color, witdh } = style;
    this.attr({
      strokeStyle: color,
      lineWidth: witdh
    })
    this.moveTo(from.x, from.y);
    this.lineTo(to.x, to.y)
    this.ctx.restore();
  }
  // 单元格渲染
  public cell(
    rect:IRects,
    text: { v:string, style: ITextStyle},
    cellStyle: ICellStyle
  ) {
    const [x, y, width, height] = rect;
    const { bgcolor, textWrap, padding } = cellStyle;
    if (width > GridLine && height > GridLine) {
      this.ctx.save();
      // 绘制底色
      this.attr({fillStyle: bgcolor});
      this.fillRect(x + GridLine, y + GridLine, width - GridLine, height - GridLine);
      // 绘制文本，超出裁剪
      const tRect:IRects = [x + GridLine + padding, y + GridLine + padding, width - GridLine - (2 * padding), height - GridLine  - (2 * padding)]
      const restore = this.clipRect(...tRect);
      this.text(text.v, tRect, text.style, textWrap);
      restore();
      this.ctx.restore();
    }
  }
}

export {
  thinLineWidth,
  npx,
};
