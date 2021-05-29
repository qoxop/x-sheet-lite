// https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D

type FieldOfCtx<K extends keyof CanvasRenderingContext2D> = CanvasRenderingContext2D[K];

type TxtObj = {t: string, c?: string, r?: boolean};
const dpr = () =>( window.devicePixelRatio || 1)
const GridLine = 0.5;

function npx(px: number) {
  return Math.floor(px * dpr());
}

export default class Draw {
  el: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  defaultShadow = {
    sc:[[0, 'rgba(0, 0, 0, 0.7)'], [0.1, 'rgba(0, 0, 0, 0.4)'],[1, 'rgba(0, 0, 0, 0.01)']],
    sl: 12
  }
  constructor(el: HTMLCanvasElement, width:number, height: number) {
    this.el = el;
    this.ctx = el.getContext('2d') as CanvasRenderingContext2D;
    this.el.style.width = `${width}px`;
    this.el.style.height = `${height}px`;
    this.el.width = npx(width);
    this.el.height = npx(height);
  }
  resize(width:number, height: number) {
    this.el.style.width = `${width}px`;
    this.el.style.height = `${height}px`;
    this.el.width = npx(width);
    this.el.height = npx(height);
  }
  scale() {
    this.ctx.scale(dpr(), dpr());
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
    ctx.lineWidth = dpr();
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
    this.ctx.beginPath();
    return () => this.ctx.restore()
  }
  
  /**
   * 绘制文本
   */
  public text(
    txt:string,
    rect: IRects,
    style: IStyle,
  ) {
    const [x, y, width, height] = rect;
    // 0 start, 2 center, 1: end
    const { 
      align, valign, color, lh,
      fontName, fontSize, bold, italic, textWrap
    } = style;
    let tx = (align ? width / align : 0) + x;
    let ty = (valign ? height / valign : 0) + y + ((lh - fontSize) / 2);
    const textAlign = align === 2 ? 'center' : (align === 0 ? 'left' :'right');
    const textBaseline = valign === 2 ? 'middle': (valign === 0 ? 'top' : 'bottom');
    this.attr({
      font: `${italic ? 'italic' : ''} ${bold ? 'bold' : ''} ${npx(fontSize)}px ${fontName}`,
      fillStyle: color,
      textBaseline,
      textAlign
    });
    const txts = (txt || '').split('\n');
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
      const rTxts = []
      const boxWidth = npx(width);
      for (let ti = 0; ti < txts.length; ti++) {
        const tiTxt = txts[ti];
        const tiTxtW = this.ctx.measureText(tiTxt).width;
        if (tiTxtW > boxWidth) { // 字符串超出检测
          let start = 0;
          let end = 1;
          for (; end <= tiTxt.length; end++) {
            const subStr = tiTxt.substring(start, end);
            if (this.ctx.measureText(subStr).width > boxWidth) { // 子字符串超出检测
              rTxts.push(subStr.substr(0, subStr.length - 1));
              start = end - 1;
              end--;
            }
          }
          if (end - start > 1) {
            const subStr = tiTxt.substring(start, end);
            rTxts.push(subStr);
          }
        } else {
          rTxts.push(txt);
        }
      }
      ty = ty - ((rTxts.length / 2  - 0.5) * lh);
      for (let ri = 0; ri < rTxts.length; ri++) {
        this.fillText(rTxts[ri], tx, ty);
        ty += lh;
      }
    }
    return this;
  }

  public axisXShadow(x:number, height:number) {
    const { sc, sl } = this.defaultShadow;
    this.ctx.save();
    const gradient = this.ctx.createLinearGradient(npx(x), 0,npx(x + sl), 0);
    sc.forEach(item => gradient.addColorStop(item[0] as number, item[1] as string));
    this.ctx.fillStyle = gradient;
    this.fillRect(x, 0, sl, height);
    this.ctx.restore();
  }
  public axisYShadow(y:number, width:number) {
    const { sc, sl } = this.defaultShadow;
    this.ctx.save();
    const gradient = this.ctx.createLinearGradient(0, npx(y), 0, npx(y + sl));
    sc.forEach(item => gradient.addColorStop(item[0] as number, item[1] as string));
    this.ctx.fillStyle = gradient;
    this.fillRect(0, y, width, sl);
    this.ctx.restore();
  }
  /**
   * 绘制直线
   * @param from 
   * @param to 
   * @param witdh 
   * @param color 
   */
  public straightLine(from: IPxPoint, to: IPxPoint, style: {
    width: number,
    color: string,
  }) {
    this.ctx.save();
    this.ctx.beginPath();
    const { color, width } = style;
    this.attr({
      strokeStyle: color,
      lineWidth: width,
    })
    this.moveTo(from.x, from.y);
    this.lineTo(to.x, to.y);
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  }
  multiText(txts: TxtObj[], rect:IRects, cellStyle:IStyle) {
    const { textWrap } = cellStyle;
    const [x, y, width, height] = rect;
    const { 
      align, valign, color, lh,
      fontName, fontSize, bold, italic
    } = cellStyle;
    let tx = (align ? width / align : 0) + x;
    let ty = (valign ? height / valign : 0) + y + ((lh - fontSize) / 2);
    const textAlign = align === 2 ? 'center' : (align === 0 ? 'left' :'right');
    const textBaseline = valign === 2 ? 'middle': (valign === 0 ? 'top' : 'bottom');
    this.attr({
      font: `${italic ? 'italic' : ''} ${bold ? 'bold' : ''} ${npx(fontSize)}px ${fontName}`,
      fillStyle: color,
      textBaseline,
      textAlign
    });
    const boxWidth = npx(width);
    const wrTxts: (TxtObj|TxtObj[])[] = [];
    let objs:TxtObj[] = [];
    let lTxt = '';
    txts.forEach((txt) => {
      if (txt.r) {
        if (objs.length) {
          wrTxts.push(objs);
        }
        objs = [];
        lTxt = '';
        const txtWidth = this.ctx.measureText(txt.t).width;
        if (textWrap && txtWidth > boxWidth) { // 处理换行
          let start = 0;
          let end = 1
          for (; end <= txt.t.length; end++) {
            const subStr = txt.t.substring(start, end);
            if (this.ctx.measureText(subStr).width > boxWidth) { // 子字符串超出检测
              wrTxts.push({ t: subStr.substr(0, subStr.length - 1), c: txt.c });
              start = end - 1;
              end--;
            }
          }
          if (end - start > 1) {
            const subStr = txt.t.substring(start, end);
            wrTxts.push({ t: subStr, c: txt.c });
          }
        } else { // 无需换行
          wrTxts.push(txt)
        }
      } else {
        // 检测起点
        let sp = lTxt.length;
        // 需要检测的字符串
        const cTxt = lTxt + txt.t;
        const lTxtWidth = this.ctx.measureText(cTxt).width;
        if (textWrap && lTxtWidth > boxWidth) { // 
          let start = 0;
          let end = sp
          for (; end < cTxt.length; end++) {
            const subStr = cTxt.substring(start, end);
            if (this.ctx.measureText(subStr).width > boxWidth) {
              const _subStr = cTxt.substring(start === 0 ? sp : start, end - 1);
              if (_subStr) { // 刚好凑够一行
                objs.push({t: _subStr, c: txt.c});
              }
              start = end - 1;
              end--;
              if (objs.length) {
                wrTxts.push(objs); // 成功插入一行
                objs = [];
              }
            }
          }
          if (end - start > 1 && start) { // 剩下的部分字符串
            lTxt = cTxt.substring(start, end);
            objs.push({t: lTxt, c: txt.c });
          }
        } else {
          lTxt += txt.t; 
          objs.push(txt);
        }
      }
    });
    if (objs.length) {
      wrTxts.push(objs);
      objs = [];
    }
    ty = ty - ((wrTxts.length / 2  - 0.5) * lh);
    for (let i = 0; i < wrTxts.length; i++) {
      const wrTxt =  wrTxts[i];
      if (wrTxt instanceof Array) {
        if (wrTxt.length === 1) {
          if (wrTxt[0].c) {
            this.ctx.fillStyle = wrTxt[0].c;
          }
          this.fillText(wrTxt[0].t, tx, ty);
        } else {
          const lens = [];
          let tLen = 0;
          for (let j = 0; j < wrTxt.length; j++) {
            const len = Math.ceil(this.ctx.measureText(wrTxt[j].t).width / dpr());
            tLen += len;
            lens.push(len);
          }
          // console.log(lens)
          let _tx = tx - (tLen / 2);
          for (let j = 0; j < wrTxt.length; j++) {
            if (wrTxt[j].c) {
              this.ctx.fillStyle = wrTxt[j].c as string;
            }
            this.fillText(wrTxt[j].t, _tx + (lens[j] / 2), ty);
            _tx += lens[j];
          }
        }
        
      } else {
        if (wrTxt.c) {
          this.ctx.fillStyle = wrTxt.c;
        }
        this.fillText(wrTxt.t, tx, ty);
      }
      ty += lh;
    }
    return this;
  }
  // 单元格渲染
  public cell(
    rect:IRects,
    text: ICellM,
    cellStyle: IStyle,
  ) {
    const [x, y, width, height] = rect;
    const { bgcolor, padding } = cellStyle;
    if (width > GridLine && height > GridLine) {
      this.ctx.save();
      this.ctx.beginPath();
      // 绘制底色
      this.attr({fillStyle: bgcolor});
      this.fillRect(x + GridLine, y + GridLine, width - GridLine, height - GridLine);
      // 绘制文本，超出裁剪
      const tRect:IRects = [x + GridLine + padding, y + GridLine + padding, width - GridLine - (2 * padding), height - GridLine  - (2 * padding)]
      const restore = this.clipRect(...tRect);
      const textType = typeof text;
      if (textType === 'string' || textType === 'number' || !text) {
        this.text(`${text || ''}`, tRect, cellStyle);
      } else {
        this.multiText(text as TxtObj[], tRect, cellStyle);
      }
      restore();
      this.ctx.restore();
    }
  }
  maskbox(rect:IRects) {
    const [x, y, width, height ] = rect;
    this.ctx.save();
    this.ctx.beginPath();
    this.attr({fillStyle: 'rgba(14,101,189,0.4)'});
    this.fillRect(x, y, width, height);
    this.attr({strokeStyle: 'rgb(14,101,189)', lineWidth: npx(1)})
    this.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1)
    this.ctx.restore();
  }
  dashedBorderBox(rect:IRects) {
    const [x, y, width, height ] = rect;
    this.ctx.save();
    this.ctx.beginPath();
    this.attr({strokeStyle: 'rgb(14,101,189)', lineWidth: npx(2)})
    this.ctx.setLineDash([npx(4), npx(2)]);
    this.strokeRect(x + 2, y + 2, width - 4, height - 4);
    this.ctx.restore();
  }
}

export {
  npx,
};
