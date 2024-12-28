import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { ProductRepository } from "./layers/productsLayer/nodejs";
import { DynamoDB } from "aws-sdk";
import * as AWSXRay from "aws-xray-sdk-core";

AWSXRay.captureAWS(require("aws-sdk"));

const productDbd = process.env.PRODUCTS_TABLE_NAME ?? "";
const dynamoDb = new DynamoDB.DocumentClient();

const productRepository = new ProductRepository(dynamoDb, productDbd);

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;

  if (event.resource === "/products") {
    if (method === "GET") {
      const products = await productRepository.get();
      return {
        statusCode: 200,
        body: JSON.stringify(products),
      };
    }
  } else if (event.resource === "/products/{id}") {
    const productId = event.pathParameters?.id;

    if (!productId) throw new Error("Product ID is required!");

    if (method === "GET") {
      try {
        const product = await productRepository.getById(productId);
        return {
          statusCode: 200,
          body: JSON.stringify(product),
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
