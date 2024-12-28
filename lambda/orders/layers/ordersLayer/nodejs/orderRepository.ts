import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { randomUUID } from "node:crypto";

export interface OrdersProduct {
  code: string;
  price: number;
}

export enum PaymentType {
  CREDIT_CARD = "CREDIT_CARD",
  PAYPAL = "PAYPAL",
  DEBIT_CARD = "DEBIT_CARD",
}

export enum ShippingType {
  STANDARD = "STANDARD",
  EXPRESS = "EXPRESS",
}

export enum CarrierType {
  UPS = "UPS",
  FEDEX = "FEDEX",
  USPS = "USPS",
}

export interface Order {
  pk: string;
  sk?: string;
  createdAt?: number;
  shipping: {
    type: ShippingType;
    carrier: CarrierType;
  };
  billing: {
    payment: PaymentType;
    totalPrice: number;
  };
  orderId?: string;
  products: Array<OrdersProduct>;
}

export class OrderRepository {
  private readonly ordersDbd: string;
  private readonly dbdClient: DocumentClient;
  constructor(dbdClient: DocumentClient, ordersDbd: string) {
    this.dbdClient = dbdClient;
    this.ordersDbd = ordersDbd;
  }

  async create(order: Order): Promise<Order> {
    order.sk = randomUUID();
    order.createdAt = Date.now();

    await this.dbdClient
      .put({
        TableName: this.ordersDbd,
        Item: order,
      })
      .promise();
    return order;
  }

  async getAll(): Promise<Array<Order>> {
    const orders = await this.dbdClient
      .scan({
        TableName: this.ordersDbd,
      })
      .promise();
    return orders.Items as Array<Order>;
  }

  async getByEmail(email: string): Promise<Array<Order>> {
    const orders = await this.dbdClient
      .query({
        TableName: this.ordersDbd,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: {
          ":pk": email,
        },
      })
      .promise();
    return orders.Items as Array<Order>;
  }

  async getByEmailAndOrderId(email: string, orderId: string): Promise<Order> {
    const order = await this.dbdClient
      .get({
        TableName: this.ordersDbd,
        Key: {
          pk: email,
          sk: orderId,
        },
      })
      .promise();

    if (!order.Item) {
      throw new Error("Order not found");
    }

    return order.Item as Order;
  }

  async delete(email: string, orderId: string): Promise<Order> {
    const orderDeleted = await this.dbdClient
      .delete({
        TableName: this.ordersDbd,
        Key: {
          pk: email,
          sk: orderId,
        },
        ReturnValues: "ALL_OLD",
      })
      .promise();

    if (!orderDeleted.Attributes) {
      throw new Error("Order not found");
    }
    return orderDeleted.Attributes as Order;
  }
}
