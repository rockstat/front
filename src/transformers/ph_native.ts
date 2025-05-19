import { IN_GENERIC } from "@app/constants";
import { BaseIncomingMessage, IncomingMessage, BaseIncomingMessageWithBatch, BusBaseEnricher } from "@app/types";
import { flatten_dict } from './common'


const new_name = 'events'
const new_service = 'events_ph'

export class PHNativeTransformer implements BusBaseEnricher {

  handle = async (key: string, msg: IncomingMessage): Promise<BaseIncomingMessageWithBatch> => {

    type TypeBatchMsgData = { [s: string]: any };
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
  
  //     api_key: '<ph_project_api_key>',
  // sent_at: '2025-04-22T17:37:55.786Z'

    // console.log('ios batch msg', batch_msg)

    const submsg_base = {
      name: new_name,
      service: new_service,
      key: `${IN_GENERIC}.${new_service}.${new_name}`,
      channel: msg.channel,
      td: msg.td,
      projectId: msg.projectId,
      uid: msg.uid,
    };

    const new_recs: Array<BaseIncomingMessage> = [];

    
    if (msg.data && msg.data.batch && Array.isArray(msg.data.batch)) {

      const send_at = Number(new Date(msg.data.sent_at))
      const api_key = msg.data.api_key;

      batch_msg.data.api_key = api_key;
      batch_msg.data.sent_at = send_at;

      try {

        let i = 0;

        for (let [num, rec] of Object.entries(msg.data.batch)) {

          // console.log(rec)

          if (!rec.event) {
            console.error('MPIOSNativeTransformer: no event id');
            console.log(num, rec)
            continue;
          }
          // console.log(rec);

          

          const data = flatten_dict(rec);

          const event_ts = data['timestamp'];
          data['timestamp'] = undefined;
          data['origin_timestamp'] = event_ts;

          data['batch_timestamp'] = msg.time;
          data['batch_source_id'] = msg.id;
          data['batch_event_number'] = i;
          data['source_service'] = msg.service;
          data['source_name'] = msg.name;
          data['sent_at'] = send_at;
          data['api_key'] = api_key;
          

          const new_rec = { ...submsg_base, data, time: Number(new Date(event_ts)) }
          new_recs.push(new_rec);
          i++;
        }
        // } else {
        // console.error('Batch is not a batch')
        // }
      } catch (e) {

        // console.log('----')
        // console.error('Err during parsing batch', {bufStr, e}) 
        console.error('Err during parsing batch')
        // console.log('msg.data', msg.data);
        // console.log('msg.data', msg);
        // console.log('----')

        batch_msg.data.err = String(e);
        return [batch_msg, []];
      }
    }
    // console.log(batch_msg)
    // console.log(new_recs)

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
