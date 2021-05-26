import { cloneDeep } from 'lodash'
export function throttle<T extends Function>(func: T, waitMs = 60) {
  let times = 0; 
  let tid = 0;
  return function (...args:any[]) {
    let now = Date.now();
    if (now - times > waitMs) {
      func(...args);
      times = now;
    }
    clearTimeout(tid);
    tid = setTimeout(() => {
      func(...args);
    }, waitMs * 2);
  };
}

export function clone<T = unknown>(data:T):T {
  return cloneDeep(data);
}

export function merge(defOption: IOptions, options: IOptions):Required<IOptions> {
  const newOption:IOptions = cloneDeep(defOption);
  Object.keys(options).forEach(k => {
    if (typeof options[k] === 'object') {
      Object.assign(newOption[k], options[k]);
    } else {
      newOption[k] = options[k];
    }
  });
  return newOption as Required<IOptions>;
}