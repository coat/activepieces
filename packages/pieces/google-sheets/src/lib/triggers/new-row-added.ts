import { createTrigger } from '@activepieces/framework';
import { TriggerStrategy } from '@activepieces/shared';
import { googleSheetsCommon } from '../common/common';

export const newRowAdded = createTrigger({
  name: 'new_row_added',
  displayName: 'New Row',
  description: 'Triggers when there is a new row added',
  props: {
    authentication: googleSheetsCommon.authentication,
    spreadsheet_id: googleSheetsCommon.spreadsheet_id,
    sheet_id: googleSheetsCommon.sheet_id
  },
  sampleData: {
    "value": [
      "1",
      "1",
      "1"
    ]
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    const sheetId = context.propsValue['sheet_id'];
    const accessToken = context.propsValue['authentication']['access_token'];
    const spreadSheetId = context.propsValue['spreadsheet_id'];
    const rowCount = (await context.store?.get<number>("rowCount_testing")) ?? 0;
    const allValues =  await googleSheetsCommon.getValues(spreadSheetId, accessToken, sheetId);    
    if(!allValues)
    {
      return [];
    }
    context.store?.put("rowCount_testing", allValues.length);
    if(rowCount ===0)
    {
      return allValues.slice(0,5).map(s => {
        return {
          value:s
        }
      });;
    }
    else
    {
      return allValues.slice(0,5).map(s => {
        return {
          value:s
        }
      });
    }
  },
  async onEnable(context) {
    const sheetId = context.propsValue['sheet_id'];
    const accessToken = context.propsValue['authentication']['access_token'];
    const spreadSheetId = context.propsValue['spreadsheet_id'];
    const currentValues = await googleSheetsCommon.getValues(spreadSheetId, accessToken, sheetId);
    console.log(`The spreadsheet ${spreadSheetId} started with ${currentValues.length} rows`);
    context.store?.put("rowCount", currentValues.length);
  },
  async onDisable(context) {
    console.log("Disabling new google sheets trigger");
   },
  async run(context) {
    const sheetId = context.propsValue['sheet_id'];
    const accessToken = context.propsValue['authentication']['access_token'];
    const spreadSheetId = context.propsValue['spreadsheet_id'];
    const rowCount = (await context.store?.get<number>("rowCount")) ?? 0;
    const currentValues = await googleSheetsCommon.getValues(spreadSheetId, accessToken, sheetId)
    let payloads: unknown[] = [];
    console.log(`The spreadsheet ${spreadSheetId} has now ${currentValues.length} rows, previous # of rows ${rowCount}`);
    if (currentValues.length > rowCount) {
      payloads = currentValues.slice(rowCount).map(value => {
        return {
          value: value
        }
      });
    }
    context.store?.put("rowCount", currentValues.length);
    return payloads;
  },
});

