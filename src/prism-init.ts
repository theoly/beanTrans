import Prism from 'prismjs';

const globalObj = globalThis as typeof globalThis & { Prism?: typeof Prism };
if (!globalObj.Prism) {
  globalObj.Prism = Prism;
}
if (typeof window !== 'undefined') {
  const winObj = window as Window & { Prism?: typeof Prism };
  if (!winObj.Prism) {
    winObj.Prism = Prism;
  }
}

export default Prism;
