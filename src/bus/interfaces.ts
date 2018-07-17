import { BusMsgHdr, BusMsgHdrResult } from '@app/types';
export { BusMsgHdr, BusMsgHdrResult } from '@app/types';

export interface LevelChildrenStr {
  handlers: string[];
  children: { [key: string]: LevelChildrenStr };
}

export interface LevelChildrenAsync {
  handlers: BusMsgHdr[];
  children: { [key: string]: LevelChildrenAsync };
}

export type LevelChildren = LevelChildrenAsync | LevelChildrenStr;
