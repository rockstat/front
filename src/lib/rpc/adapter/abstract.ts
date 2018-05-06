
export interface RPCAdapter {

  send(to: string, msg: any): void;
  receiver: (data: any) => void;

}
