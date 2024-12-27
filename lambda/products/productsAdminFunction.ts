import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { ProductRepository } from "./layers/productsLayer/nodejs";
import { DynamoDB } from "aws-sdk";

const productDbd = process.env.PRODUCTS_TABLE_NAME ?? "";
const dynamoDb = new DynamoDB.DocumentClient();

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
        await productRepository.delete(productId);
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
