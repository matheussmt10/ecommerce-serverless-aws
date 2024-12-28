import { Callback, Context } from "aws-lambda";
import { ProductEvent } from "./layers/productEventsLayer/nodejs/productEvents";
import { DynamoDB } from "aws-sdk";
import * as AWSXRay from "aws-xray-sdk-core";

AWSXRay.captureAWS(require("aws-sdk"));

const eventsDbd = process.env.EVENTS_TABLE_NAME ?? "";
const dbdClient = new DynamoDB.DocumentClient();

export async function handler(
  event: ProductEvent,
  context: Context,
  callback: Callback
): Promise<void> {
  await createEvent(event);

  callback(
    null,
    JSON.stringify({
      productEventCreated: true,
      message: "Event created!",
    })
  );
}

async function createEvent(event: ProductEvent) {
  const timestamp = Date.now();

  dbdClient
    .put({
      TableName: eventsDbd,
      Item: {
        pk: `#PRODUCT_${event.productCode}`,
        sk: `${event.eventType}#${timestamp}`,
        email: event.userEmail,
        createdAt: timestamp,
        requestId: event.requestId,
        eventType: event.eventType,
        info: {
          productId: event.productId,
          productPrice: event.productPrice,
        },
      },
    })
    .promise();
}
