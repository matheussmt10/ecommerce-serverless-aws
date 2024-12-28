import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { randomUUID } from "node:crypto";

export interface Product {
  id: string;
  productName: string;
  code: string;
  price: number;
  model: string;
}

export class ProductRepository {
  private readonly client: DocumentClient;
  private readonly tableName: string;

  constructor(client: DocumentClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
  }

  async get(): Promise<Array<Product>> {
    const params = {
      TableName: this.tableName,
    };

    const data = await this.client.scan(params).promise();

    return data.Items as Product[];
  }

  async getById(id: string): Promise<Product> {
    const params = {
      TableName: this.tableName,
      Key: {
        id,
      },
    };

    const data = await this.client.get(params).promise();

    if (!data.Item) {
      throw new Error("Product not found");
    }

    return data.Item as Product;
  }

  async getProductsByIds(productIds: string[]): Promise<Array<Product>> {
    const keys: { id: string }[] = [];

    productIds.forEach((productId) => {
      keys.push({
        id: productId,
      });
    });

    const data = await this.client
      .batchGet({
        RequestItems: {
          [this.tableName]: {
            Keys: keys,
          },
        },
      })
      .promise();
    return data.Responses![this.tableName] as Product[];
  }

  async create(product: Product): Promise<Product> {
    product.id = randomUUID();
    const params = {
      TableName: this.tableName,
      Item: product,
    };

    await this.client.put(params).promise();

    return product;
  }

  async update(id: string, product: Product): Promise<Product> {
    const params = {
      TableName: this.tableName,
      Key: {
        id,
      },
      ConditionExpression: "attribute_exists(id)",
      UpdateExpression:
        "set productName = :n, code = :c, price = :p, model = :m",
      ExpressionAttributeValues: {
        ":n": product.productName,
        ":c": product.code,
        ":p": product.price,
        ":m": product.model,
      },
      ReturnValues: "UPDATED_NEW",
    };

    const data = await this.client.update(params).promise();

    return data.Attributes as Product;
  }

  async delete(id: string): Promise<Product> {
    const params = {
      TableName: this.tableName,
      Key: {
        id,
      },
      ReturnValues: "ALL_OLD",
    };

    const data = await this.client.delete(params).promise();

    if (!data.Attributes) {
      throw new Error(
        "Cannot delete product because it does not exist in the database"
      );
    }

    return data.Attributes as Product;
  }
}
