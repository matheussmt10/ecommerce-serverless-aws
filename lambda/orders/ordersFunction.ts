import { DynamoDB, SNS } from "aws-sdk";
import { OrderRepository } from "./layers/ordersLayer/nodejs";
import { ProductRepository } from "/opt/nodejs/productsLayer";
import * as AWSXRay from "aws-xray-sdk-core";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import {
  CarrierType,
  OrderProductResponse,
  OrderRequest,
  OrderResponse,
  PaymentType,
  ShippingType,
} from "/opt/nodejs/ordersApiLayer";
import { Product } from "lambda/products/layers/productsLayer/nodejs/productRepository";
import { Order } from "./layers/ordersLayer/nodejs/orderRepository";
import { OrderEventType } from "/opt/nodejs/orderEventsLayer";

AWSXRay.captureAWS(require("aws-sdk"));

const ordersDdb = process.env.ORDERS_TABLE_NAME ?? "orders";
const productDdb = process.env.PRODUCTS_TABLE_NAME ?? "products";

const ddbClient = new DynamoDB.DocumentClient();

const orderEventsTopicArn = process.env.ORDER_EVENTS_TOPIC_ARN ?? "";
const snsClient = new SNS();

const orderRepository = new OrderRepository(ddbClient, ordersDdb);

const productRepository = new ProductRepository(ddbClient, productDdb);

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const apiRequestId = event.requestContext.requestId;
  const lambdaRequestId = context.awsRequestId;

  if (method === "POST") {
    const body = JSON.parse(event.body ?? "") as OrderRequest;
    if (!body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Order data is required!",
        }),
      };
    }

    const products = await productRepository.getProductsByIds(body.productIds);

    if (products.length !== body.productIds.length) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Some Products were not found!",
        }),
      };
    }

    const orderMapped = mapOrder(body, products);
    const orderCreated = await orderRepository.create(orderMapped);

    await sendOrderEvent(orderCreated, OrderEventType.CREATED, lambdaRequestId);
    return {
      statusCode: 201,
      body: JSON.stringify(convertToOrderResponse(orderCreated)),
    };
  } else if (method === "DELETE") {
    const orderId = event.queryStringParameters!.orderId as string;
    const email = event.queryStringParameters!.email as string;
    try {
      const orderDeleted = await orderRepository.delete(email, orderId);
      await sendOrderEvent(
        orderDeleted,
        OrderEventType.DELETED,
        lambdaRequestId
      );

      return {
        statusCode: 200,
        body: JSON.stringify(convertToOrderResponse(orderDeleted)),
      };
    } catch (error) {
      console.error((<Error>error).message);
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: (<Error>error).message,
        }),
      };
    }
  } else if (method === "GET") {
    if (event.queryStringParameters) {
      const orderId = event.queryStringParameters!.orderId as string;
      const email = event.queryStringParameters!.email as string;
      if (email) {
        if (orderId) {
          try {
            const order = await orderRepository.getByEmailAndOrderId(
              email,
              orderId
            );
            return {
              statusCode: 200,
              body: JSON.stringify(convertToOrderResponse(order)),
            };
          } catch (error) {
            console.error((<Error>error).message);
            return {
              statusCode: 404,
              body: JSON.stringify({
                message: (<Error>error).message,
              }),
            };
          }
        } else {
          const orders = await orderRepository.getByEmail(email);
          return {
            statusCode: 200,
            body: JSON.stringify(orders.map(convertToOrderResponse)),
          };
        }
      }
    } else {
      const orders = await orderRepository.getAll();
      return {
        statusCode: 200,
        body: JSON.stringify(orders.map(convertToOrderResponse)),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify("orders"),
    };
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      message: "Invalid request!",
    }),
  };
}

function sendOrderEvent(
  order: Order,
  eventType: OrderEventType,
  lambdaRequestId: string
) {
  const orderEvent = {
    email: order.pk,
    orderId: order.sk,
    shipping: order.shipping,
    billing: order.billing,
    productCodes: order.products.map((product) => product.code),
    requestId: lambdaRequestId,
  };
  const envelope = {
    eventType: eventType,
    data: JSON.stringify(orderEvent),
  };

  console.log("Sending Order Event", orderEvent);

  return snsClient
    .publish({
      TopicArn: orderEventsTopicArn,
      Message: JSON.stringify(envelope),
    })
    .promise();
}

function convertToOrderResponse(order: Order): OrderResponse {
  const orderProducts: OrderProductResponse[] = [];
  order.products.forEach((product) => {
    orderProducts.push({
      code: product.code,
      price: product.price,
    });
  });
  const orderResponse: OrderResponse = {
    email: order.pk,
    id: order.sk!,
    createdAt: order.createdAt!,
    products: orderProducts,
    billing: {
      payment: order.billing.payment as PaymentType,
      totalPrice: order.billing.totalPrice,
    },
    shipping: {
      type: order.shipping.type as ShippingType,
      carrier: order.shipping.carrier as CarrierType,
    },
  };

  return orderResponse;
}

function mapOrder(orderRequest: OrderRequest, products: Array<Product>): Order {
  const orderProducts: OrderProductResponse[] = [];
  let totalPrice = 0;

  products.forEach((product) => {
    totalPrice += product.price;
    orderProducts.push({
      code: product.code,
      price: product.price,
    });
  });
  const order: Order = {
    pk: orderRequest.email,
    billing: {
      payment: orderRequest.payment,
      totalPrice: totalPrice,
    },
    shipping: {
      type: orderRequest.shipping.type,
      carrier: orderRequest.shipping.carrier,
    },
    products: orderProducts,
  };
  return order;
}
