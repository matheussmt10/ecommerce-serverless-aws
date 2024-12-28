import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export interface ProductsAppStackProps extends cdk.StackProps {
  eventsDbd: dynamodb.Table;
}
export class ProductsAppStack extends cdk.Stack {
  readonly productsFetchHandler: lambdaNodeJs.NodejsFunction;
  readonly productsAdminHandler: lambdaNodeJs.NodejsFunction;
  readonly productsDbd: dynamodb.Table;

  constructor(scope: Construct, id: string, props: ProductsAppStackProps) {
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

    const productEventLayerArn = ssm.StringParameter.valueForStringParameter(
      this,
      "ProductEventsLayerArn"
    );

    const productEventLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "ProductEventsLayer",
      productEventLayerArn
    );

    const productEventsHandler = new lambdaNodeJs.NodejsFunction(
      this,
      "ProductsEventsFunction",
      {
        functionName: "ProductEventsFunction",
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: "lambda/products/productEventsFunction.ts",
        handler: "handler",
        memorySize: 512,
        timeout: cdk.Duration.seconds(10),
        bundling: {
          minify: true,
          sourceMap: true,
          nodeModules: ["aws-xray-sdk-core"],
        },
        environment: {
          EVENTS_TABLE_NAME: props.eventsDbd.tableName,
        },
        layers: [productEventLayer],
        tracing: lambda.Tracing.ACTIVE,
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,
      }
    );
    props.eventsDbd.grantWriteData(productEventsHandler);

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
          nodeModules: ["aws-xray-sdk-core"],
        },
        environment: {
          PRODUCTS_TABLE_NAME: this.productsDbd.tableName,
        },
        layers: [productsLayer],
        tracing: lambda.Tracing.ACTIVE,
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,
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
          nodeModules: ["aws-xray-sdk-core"],
        },
        environment: {
          PRODUCTS_TABLE_NAME: this.productsDbd.tableName,
          PRODUCT_EVENTS_FUNCTION_NAME: productEventsHandler.functionName,
        },
        layers: [productsLayer, productEventLayer],
        tracing: lambda.Tracing.ACTIVE,
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,
      }
    );
    this.productsDbd.grantWriteData(this.productsAdminHandler);
    productEventsHandler.grantInvoke(this.productsAdminHandler);
  }
}
