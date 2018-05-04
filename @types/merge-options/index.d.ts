// Type definitions for merge-options
// Project:
// Definitions by: Dmitry Rodin <https://github.com/madiedinro>
// TypeScript Version: 2.8

declare module 'merge-options' {

  // type anyobj = { [key: string]: string };
  type OptionsType = object
  interface Assign {
    (...obj: OptionsType[]): any;
  }
  const mergeOptions: Assign;

  namespace mergeOptions { }
  export = mergeOptions;

}
