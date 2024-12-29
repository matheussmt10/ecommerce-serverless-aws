import { DocumentClient } from "aws-sdk/clients/dynamodb";

export interface OrderEvent {
  pk: string;
  sk: string;
  createdAt: number;
  email: string;
  requestId: string;
  eventType: string;
  info: {
    orderId: string;
    productCodes: Array<string>;
    messageId: string;
  };
}

export class OrderEventRepository {
  private ddbClient: DocumentClient;
  private EventsDbd: string;

  constructor(ddbClient: DocumentClient, events: string) {
    this.ddbClient = ddbClient;
    this.EventsDbd = events;
  }

  create(orderEvent: OrderEvent) {
    return this.ddbClient
      .put({
        TableName: this.EventsDbd,
        Item: orderEvent,
      })
      .promise();
  }
}
