declare module 'tailwindcss' {
  const tailwindcss: any;
  export = tailwindcss;
  export default tailwindcss;
  
  export interface Config {
    content?: string[];
    theme?: {
      extend?: {
        colors?: Record<string, string | Record<string, string>>;
      };
    };
  }
}

