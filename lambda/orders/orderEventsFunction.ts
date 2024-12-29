import { AWSError, DynamoDB } from "aws-sdk";
import * as AWSXRay from "aws-xray-sdk-core";
import { Context, SNSEvent, SNSMessage } from "aws-lambda";
import { Envelope, OrderEvent } from "/opt/nodejs/orderEventsLayer";
import { OrderEventRepository } from "./layers/orderEventsRepositoryLayer/nodejs/orderEventsRepositoryLayer";
import { PromiseResult } from "aws-sdk/lib/request";

AWSXRay.captureAWS(require("aws-sdk"));

const eventsDbd = process.env.EVENTS_TABLE_NAME ?? "events";
const ddbClient = new DynamoDB.DocumentClient();
const orderEventsRepository = new OrderEventRepository(ddbClient, eventsDbd);

export async function handler(
  event: SNSEvent,
  context: Context
): Promise<void> {
  const promises: Array<
    Promise<PromiseResult<DynamoDB.DocumentClient.PutItemOutput, AWSError>>
  > = [];

  event.Records.forEach(async (record) => {
    promises.push(createEvent(record.Sns));
  });

  await Promise.all(promises);
}

async function createEvent(body: SNSMessage) {
  const envelope = JSON.parse(body.Message) as Envelope;

  const event = JSON.parse(envelope.data) as OrderEvent;
  console.log("Creating event", { event, body });
  return orderEventsRepository.create({
    pk: `#ORDER_${event.orderId}`,
    sk: `${envelope.eventType}#${Date.now()}`,
    eventType: envelope.eventType,
    createdAt: Date.now(),
    email: event.email,
    requestId: event.requestId,
    info: {
      orderId: event.orderId,
      productCodes: event.productCodes,
      messageId: body.MessageId,
    },
  });
}
