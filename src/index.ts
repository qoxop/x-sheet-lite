import StyleManager from "./core/style-manager";

export default class Sheet {
  private style: StyleManager;
  private container: HTMLDivElement;
  private observer: IntersectionObserver;
  constructor(props: {
    id: string,
    viewport?: boolean,
    defaultStyle:Partial<IStyle>
  }) {
    this.style = new StyleManager(props.defaultStyle);
    this.container = document.getElementById(props.id) as HTMLDivElement;
    if (
      this.container.style.position !== 'absolute' &&
      this.container.style.position !== 'fixed'
    ) {
      this.container.style.position = 'relative';
    }
    const options = {
      threshold: [0, 0.5],
      root: props.viewport ? null : this.container,
      rootMargin: "10px 10px 30px 20px",
    }
    this.observer = new IntersectionObserver(this.dispatchRenderTask.bind(this), options);
  }
  // 渲染
  render(data: ISheetData) {
    

  }
  dispatchRenderTask(entries: IntersectionObserverEntry[]) {

  }
  on(eventName:string, callback: (evt: any) => void) {

  }
  

}