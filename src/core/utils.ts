import { cloneDeep } from 'lodash'

export function throttle<T extends Function>(func: T, waitMs = 60): T {
  let times = 0;
  let tid:any = 0;
  return function (...args: any[]) {
    const now = Date.now();
    if (now - times > waitMs) {
      func(...args);
      times = now;
    } else {
      clearTimeout(tid);
      tid = setTimeout(() => {
        func(...args);
      }, waitMs * 2);
    }
  } as unknown as T;
}

export const defV = <T = unknown>(v:unknown, def:T):T => {
  if (v === undefined || v === null) {
    return def;
  }
  return v as T;
}
export const defVs = (vs:any[], def?:any):any => {
  for (let i = 0; i < vs.length; i++) {
    const v = vs[i];
    if (v !== null && v !== undefined && v !== '') {
      return v;
    }
  }
  return def;
}

export function clone<T = unknown>(data:T):T {
  return cloneDeep(data);
}

export function assign<T = unknown>(obj1:T, obj2:Partial<T>): T {
  Object.keys(obj2).forEach((k) => {
    if (obj2[k] !== undefined) {
      obj1[k] = obj2[k];
    }
  })
  return obj1;
}

export function mergeOptions(defOption: IOptions, options: IOptions):Required<IOptions> {
  const newOption:IOptions = cloneDeep(defOption);
  Object.keys(options).forEach((k) => {
    if (typeof options[k] === 'object') {
      Object.assign(newOption[k], options[k]);
    } else {
      newOption[k] = options[k];
    }
  });
  return newOption as Required<IOptions>;
}
