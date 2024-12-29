import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ssm from "aws-cdk-lib/aws-ssm";

export class OrdersAppLayersStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ordersLayers = new lambda.LayerVersion(this, "OrdersLayers", {
      layerVersionName: "OrdersLayer",
      code: lambda.Code.fromAsset("lambda/orders/layers/ordersLayer"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    new ssm.StringParameter(this, "OrdersLayerArn", {
      parameterName: "OrdersLayerArn",
      stringValue: ordersLayers.layerVersionArn,
    });

    const ordersApiLayers = new lambda.LayerVersion(this, "OrdersApiLayers", {
      layerVersionName: "OrdersApiLayer",
      code: lambda.Code.fromAsset("lambda/orders/layers/ordersApiLayer"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    new ssm.StringParameter(this, "OrdersApiLayerArn", {
      parameterName: "OrdersApiLayerArn",
      stringValue: ordersApiLayers.layerVersionArn,
    });

    const ordersEventsLayers = new lambda.LayerVersion(
      this,
      "OrderEventsLayers",
      {
        layerVersionName: "OrderEventsLayer",
        code: lambda.Code.fromAsset("lambda/orders/layers/orderEventsLayer"),
        compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );
    new ssm.StringParameter(this, "OrderEventsLayerArn", {
      parameterName: "OrderEventsLayerArn",
      stringValue: ordersEventsLayers.layerVersionArn,
    });

    const ordersEventsRepositoryLayers = new lambda.LayerVersion(
      this,
      "OrderEventsRepositoryLayers",
      {
        layerVersionName: "OrderEventsRepositoryLayer",
        code: lambda.Code.fromAsset(
          "lambda/orders/layers/orderEventsRepositoryLayer"
        ),
        compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );
    new ssm.StringParameter(this, "OrderEventsRepositoryLayerArn", {
      parameterName: "OrderEventsRepositoryLayerArn",
      stringValue: ordersEventsRepositoryLayers.layerVersionArn,
    });
  }
}
