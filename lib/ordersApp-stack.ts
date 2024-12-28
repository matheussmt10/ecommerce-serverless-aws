import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

interface OrdersAppStackProps extends cdk.StackProps {
  productDbd: dynamodb.Table;
}

export class OrdersAppStack extends cdk.Stack {
  readonly ordersHandler: lambdaNodeJs.NodejsFunction;
  readonly ordersDbd: dynamodb.Table;

  constructor(scope: Construct, id: string, props: OrdersAppStackProps) {
    super(scope, id, props);

    this.ordersDbd = new dynamodb.Table(this, "OrdersDbd", {
      partitionKey: {
        name: "pk",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: dynamodb.AttributeType.STRING,
      },
      tableName: "orders",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    });

    const ordersLayerArn = ssm.StringParameter.valueForStringParameter(
      this,
      "OrdersLayerArn"
    );

    const ordersLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "OrdersLayer",
      ordersLayerArn
    );

    const ordersApiLayerArn = ssm.StringParameter.valueForStringParameter(
      this,
      "OrdersApiLayerArn"
    );

    const ordersApiLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "OrdersApiLayer",
      ordersApiLayerArn
    );

    const productsLayerArn = ssm.StringParameter.valueForStringParameter(
      this,
      "ProductsLayerArn"
    );

    const productsLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "ProductsLayer",
      productsLayerArn
    );

    this.ordersHandler = new lambdaNodeJs.NodejsFunction(
      this,
      "OrdersFunction",
      {
        functionName: "OrdersFunction",
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: "lambda/orders/ordersFunction.ts",
        handler: "handler",
        memorySize: 512,
        timeout: cdk.Duration.seconds(10),
        bundling: {
          minify: true,
          sourceMap: true,
          nodeModules: ["aws-xray-sdk-core"],
        },
        environment: {
          PRODUCTS_TABLE: props.productDbd.tableName,
          ORDERS_TABLE: this.ordersDbd.tableName,
        },
        layers: [ordersLayer, productsLayer, ordersApiLayer],
        tracing: lambda.Tracing.ACTIVE,
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,
      }
    );

    this.ordersDbd.grantReadWriteData(this.ordersHandler);
    props.productDbd.grantReadData(this.ordersHandler);
  }
}
