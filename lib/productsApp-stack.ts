import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ssm from "aws-cdk-lib/aws-ssm";
export class ProductsAppStack extends cdk.Stack {
  readonly productsFetchHandler: lambdaNodeJs.NodejsFunction;
  readonly productsAdminHandler: lambdaNodeJs.NodejsFunction;
  readonly productsDbd: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.productsDbd = new dynamodb.Table(this, "ProductsDbd", {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      tableName: "products",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    });
    const productsLayerArn = ssm.StringParameter.valueForStringParameter(
      this,
      "ProductsLayerArn"
    );

    const productsLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "ProductsLayer",
      productsLayerArn
    );
    this.productsFetchHandler = new lambdaNodeJs.NodejsFunction(
      this,
      "ProductsFetchFunction",
      {
        functionName: "ProductsFetchFunction",
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: "lambda/products/productsFetchFunction.ts",
        handler: "handler",
        memorySize: 512,
        timeout: cdk.Duration.seconds(10),
        bundling: {
          minify: true,
          sourceMap: true,
        },
        environment: {
          PRODUCTS_TABLE_NAME: this.productsDbd.tableName,
        },
        layers: [productsLayer],
      }
    );

    this.productsDbd.grantReadData(this.productsFetchHandler);

    this.productsAdminHandler = new lambdaNodeJs.NodejsFunction(
      this,
      "ProductsAdminFunction",
      {
        functionName: "ProductsAdminFunction",
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: "lambda/products/productsAdminFunction.ts",
        handler: "handler",
        memorySize: 512,
        timeout: cdk.Duration.seconds(10),
        bundling: {
          minify: true,
          sourceMap: true,
        },
        environment: {
          PRODUCTS_TABLE_NAME: this.productsDbd.tableName,
        },
        layers: [productsLayer],
      }
    );
    this.productsDbd.grantReadWriteData(this.productsAdminHandler);
  }
}
