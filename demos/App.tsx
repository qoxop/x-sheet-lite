import React, { useEffect } from 'react'
import Draw from '../src/canvas/draw';

const textStyle:ITextStyle = {
  color:'green',
  font: {
    italic:false, // 是否斜体
    bold:false,   // 是否加粗
    size: 12,    // 字体大小
    name: 'sans-serif',    // 字体名
  },
  lh: 14, // 行高
  align: 2,
  valign: 2,
}

const text = () => {
  const n =( Math.ceil(Math.random() * 1000) % 9) || 1;
  return ('转i9sh').repeat(n);
}
const getStyle = ():ITextStyle => {
  return textStyle
}
const getCellStyle = ():ICellStyle => {
  return {
    bgcolor: '#ffffff',
    textWrap: true,
    padding: 4,
  }
}
let ii = 0;
function getTable() {
  const canvas = document.createElement('canvas');
  const w = 1000; 
  const h = 10000;
  const u = 100;
  const draw = new Draw(canvas, w, h);
  for (let x = 0; x < w; x += u) {
    for (let y = 0; y < h; y += u) {
      ii++;
      draw.cell(
        [x, y, u, u],
        {v: text(), style: getStyle()},
        getCellStyle(),
      )
    }
  }
  document.getElementById('sheet-container')?.appendChild(canvas)
}
function App() {
  useEffect(() => {
    function ren(num: number) {
      getTable();
      if (num > 0) {
        setTimeout(() => {
          ren(num - 1);
        }, 50);
      } else {
        console.log(ii)
      }
    }
    ren(100)
  }, []);
  return (
    <div className="App" id="sheet-container">
      
    </div>
  )
}

export default App
