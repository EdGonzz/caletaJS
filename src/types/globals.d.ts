// Declaración para importaciones de SVG cargados mediante asset/resource en Webpack
declare module '*.svg' {
  const content: string;
  export default content;
}

// Declaración mínima para variables de entorno provistas por dotenv-webpack en build time
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly API_URL?: string;
    readonly API_KEY?: string;
    readonly [key: string]: string | undefined;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};
