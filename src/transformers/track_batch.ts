import { IN_GENERIC } from "@app/constants";
import { BaseIncomingMessage, IncomingMessage, BaseIncomingMessageWithBatch, BusBaseEnricher } from "@app/types";
import { flatten_dict } from './common'


type TypeBatchMsgData = { [s: string]: any };

export class TrackBatchTransformer implements BusBaseEnricher {

  handle = async (key: string, msg: IncomingMessage): Promise<BaseIncomingMessageWithBatch> => {
    const batchMsgData: TypeBatchMsgData = {}
    const batch_msg = {
      id: msg.id,
      time: msg.time,
      key: `${IN_GENERIC}.batch.batch`,
      service: 'batch',
      name: 'batch',
      source_service: msg.service,
      source_name: msg.name,
      channel: msg.channel,
      projectId: msg.projectId,
      uid: msg.uid,
      td: msg.td,
      data: batchMsgData
    };

    if (!msg['data']) {
      return [batch_msg, []];
    }

    const submsg_base = {
      service: msg.service,
      channel: msg.channel,
      td: msg.td,
      projectId: msg.projectId,
      uid: msg.uid,
      // i: msg.
    };

    const new_recs: Array<BaseIncomingMessage> = [];

    if ('data' in msg.data) {
      let bufStr = ''
      try {
        let buf = Buffer.from(msg.data.data, 'base64');
        bufStr = buf.toString()
        let recs = JSON.parse(bufStr);
        if (Array.isArray(recs)) {

          let i = 0;
          for (let rec of recs) {
            const data = flatten_dict(rec);

            data['src'] = msg.projectId;
            data['batch_timestamp'] = msg.time;
            data['batch_source_id'] = msg.id;
            data['batch_event_number'] = i;
            data['service'] = rec.service;
            
            const new_rec = { 
              name: rec.name, 
              key: `${IN_GENERIC}.${rec.service}.${rec.name}`, 
              data, ...submsg_base, 
            }
            new_recs.push(new_rec);
            i++;
          }
        } else {
          console.error('Batch is not a batch')
        }
      } catch (e) {
        // console.error('Err during parsing batch', {bufStr, e}) 
        batch_msg.data.err = String(e);
        return [batch_msg, []];
      }
    }

    return [batch_msg, new_recs];
  }
}



// export const RedirectHandler = () => {
//   return async (key: string, msg: BaseIncomingMessage): Promise<BandResponse> => {
//     if (msg.data.to) {
//       return response.redirect({ location: msg.data.to })
//     } else {
//       return response.error({ errorMessage: 'Parameter "to" is required', statusCode: STATUS_BAD_REQUEST })
//     }
//   }

// }
