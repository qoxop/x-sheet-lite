


const config:IConfig = {
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
  sizes: {
    defWidth: 60,
    minWidth: 60,
    defHeight: 25,
    minHeight: 25,
  },
  gridStyle: {
    width: 1,
    color: '#f2f2f2',
  },
  sliceStrategy: (rows: number, cols: number) => {
    if (rows * cols < 2000) {
      return rows;
    }
    return Math.floor(2000 / cols);
  } 
}

export const get = () => config;

export const set = (cfg: Partial<IConfig> = {}) => {
  Object.assign(config, cfg);
}