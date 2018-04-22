// Type definitions for merge-options
// Project:
// Definitions by: Dmitry Rodin <https://github.com/madiedinro>
// TypeScript Version: 2.8

declare module 'merge-options' {

  // type anyobj = { [key: string]: string };

  interface Assign {
    (...obj: object[]): any;
  }
  const mergeOptions: Assign;

  namespace mergeOptions { }
  export = mergeOptions;

}
