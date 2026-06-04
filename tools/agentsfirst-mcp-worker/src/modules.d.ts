// Ambient declarations for non-JS imports bundled by wrangler.
declare module '*.wasm' {
  const mod: WebAssembly.Module;
  export default mod;
}
declare module '*.ttf' {
  const data: ArrayBuffer;
  export default data;
}
