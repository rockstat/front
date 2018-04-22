// Type definitions for node-xxhash
// Project: https://github.com/mscdex/node-xxhash
// Definitions by: Dmitry Rodin <https://github.com/madiedinro>
// TypeScript Version: 2.7

/// <reference types="node" />

declare module 'xxhash' {

  import { Duplex } from "stream";

  type EncBuf = 'buffer' | 'hex' | 'base64' | 'binary' | Buffer;
  type Bits = 32 | 64;

  class XXHash {

    /**
     *
     * @param data
     * @param seed unsigned integer or a Buffer containing (1 <= n <= 4) b
     * @param encbuf string [buffer, hex, base64, or binary] or Buffer of at least 4 bytes. The default value for encbuf is 'buffer'.
     */
    static hash(data: Buffer, seed: number | Buffer, encbuf?: EncBuf): number | Buffer;

    /**
     *
     * @param data
     * @param seed be an unsigned integer or a Buffer containing (1 <= n <= 8)
     * @param encbuf string [buffer, hex, base64, or binary] or Buffer of at least 8 bytes. The default value for encbuf is 'buffer'.
     */
    static hash64(data: Buffer, seed: number | Buffer, encbuf?: EncBuf | Buffer): number | string | Buffer;

    static Stream(seed: number | Buffer, bits?: Bits, encbuf?: EncBuf): Duplex;

    constructor(seed: number | Buffer);

    update(data: Buffer): void;

    digest(encbuf: EncBuf): number | Buffer;

  }

  namespace XXHash { }
  export = XXHash;
}
