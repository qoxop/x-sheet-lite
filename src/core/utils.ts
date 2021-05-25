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