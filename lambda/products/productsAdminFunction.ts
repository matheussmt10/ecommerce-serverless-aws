import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { ProductRepository } from "./layers/productsLayer/nodejs";
import { DynamoDB, Lambda } from "aws-sdk";
import {
  ProductEvent,
  ProductEventType,
} from "./layers/productEventsLayer/nodejs/productEvents";
import * as AWSXRay from "aws-xray-sdk-core";
import { Product } from "./layers/productsLayer/nodejs/productRepository";

AWSXRay.captureAWS(require("aws-sdk"));

const productDbd = process.env.PRODUCTS_TABLE_NAME ?? "";
const productEventsFunctionName =
  process.env.PRODUCT_EVENTS_FUNCTION_NAME ?? "";

const dynamoDb = new DynamoDB.DocumentClient();
const lambdaClient = new Lambda();

const productRepository = new ProductRepository(dynamoDb, productDbd);

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;

  if (event.resource === "/products") {
    if (method === "POST") {
      const body = JSON.parse(event.body ?? "");
      if (!body) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Product data is required!",
          }),
        };
      }
      const productCreated = await productRepository.create(body);
      const response = await sendProductEvents(
        productCreated,
        ProductEventType.CREATED,
        "ma@ma.com.br",
        context.awsRequestId
      );
      console.log(response);
      return {
        statusCode: 201,
        body: JSON.stringify(productCreated),
      };
    }
  } else if (event.resource === "/products/{id}") {
    const productId = event.pathParameters?.id;
    if (method === "PUT") {
      const body = JSON.parse(event.body ?? "");
      if (!productId || !body) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Product data is required!",
          }),
        };
      }
      try {
        const productUpdated = await productRepository.update(productId, body);
        const response = await sendProductEvents(
          productUpdated,
          ProductEventType.UPDATED,
          "ma@ma.com.br",
          context.awsRequestId
        );
        console.log(response);
        return {
          statusCode: 201,
          body: JSON.stringify(productUpdated),
        };
      } catch (ConditionCheckFailedException) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            message: "Product not found!",
          }),
        };
      }
    }
  } else if (event.resource === "/products/{id}") {
    const productId = event.pathParameters?.id;
    if (method === "DELETE") {
      if (!productId) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Product ID is required!",
          }),
        };
      }
      try {
        const productDeleted = await productRepository.delete(productId);
        const response = await sendProductEvents(
          productDeleted,
          ProductEventType.DELETED,
          "ma@ma.com.br",
          context.awsRequestId
        );
        console.log(response);
        return {
          statusCode: 201,
          body: JSON.stringify({
            message: "Product deleted!",
          }),
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
    }
  }
  return {
    statusCode: 400,
    body: JSON.stringify({
      message: "Server Internal Error!",
      input: event,
    }),
  };
}

async function sendProductEvents(
  product: Product,
  eventType: ProductEventType,
  email: string,
  lambdaRequestId: string
) {
  const event: ProductEvent = {
    requestId: lambdaRequestId,
    eventType: eventType,
    productId: product.id,
    productCode: product.code,
    productPrice: product.price,
    userEmail: email,
    type: eventType,
  };

  return lambdaClient
    .invoke({
      FunctionName: productEventsFunctionName,
      InvocationType: "RequestResponse",
      Payload: JSON.stringify(event),
    })
    .promise();
}
