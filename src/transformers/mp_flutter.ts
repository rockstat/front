import { IN_GENERIC } from "@app/constants";
import { BaseIncomingMessage, IncomingMessage, BaseIncomingMessageWithBatch, BusBaseEnricher } from "@app/types";
import { flatten_dict, decodeMPPayload } from './common'


const new_name = 'events'
const new_service = 'events_mp_flutter'
const time2040 = 2536696935;
type TypeBatchMsgData = { [s: string]: any };

export class MPFlutterTransformer implements BusBaseEnricher {

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

    if (msg.data && 'data' in msg.data) {
      try {
        const recs = decodeMPPayload(msg.data.data);
        if (!recs) {
          console.error('MPFlutterTransformer: batch is not a batch');
          batch_msg.data.err = 'Batch is not a batch';
          return [batch_msg, []];
        }

        let i = 0;
        for (const rec of recs) {
          if (!rec || typeof rec !== 'object' || !rec.event) {
            console.error('MPFlutterTransformer: no event name');
            continue;
          }

          const data = flatten_dict(rec);
          if ('id' in data) {
            data['internal_id'] = data['id'];
            data['id'] = undefined;
          }
          data['src'] = msg.projectId;
          data['batch_timestamp'] = msg.time;
          data['batch_source_id'] = msg.id;
          data['batch_event_number'] = i;
          data['source_service'] = msg.service;
          data['source_name'] = msg.name;

          // client time: seconds (native sdks) or milliseconds (web)
          let new_client_time = Number(data['properties_time']);
          if (!new_client_time) {
            new_client_time = msg.time;
          } else if (new_client_time < time2040) {
            new_client_time = new_client_time * 1000;
          }

          new_recs.push({ ...submsg_base, time: new_client_time, data });
          i++;
        }
      } catch (e) {
        console.error('MPFlutterTransformer: err during parsing batch')
        batch_msg.data.err = String(e);
        return [batch_msg, []];
      }
    }

    return [batch_msg, new_recs];
  }
}
