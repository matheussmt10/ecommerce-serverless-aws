import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ssm from "aws-cdk-lib/aws-ssm";

export class ProductsAppLayersStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsLayers = new lambda.LayerVersion(this, "ProductsLayers", {
      layerVersionName: "ProductsLayers",
      code: lambda.Code.fromAsset("lambda/products/layers/productsLayer"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    new ssm.StringParameter(this, "ProductsLayerArn", {
      parameterName: "ProductsLayerArn",
      stringValue: productsLayers.layerVersionArn,
    });

    const productEventsLayers = new lambda.LayerVersion(
      this,
      "ProductEventsLayer",
      {
        layerVersionName: "ProductEventsLayer",
        code: lambda.Code.fromAsset(
          "lambda/products/layers/productEventsLayer"
        ),
        compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );
    new ssm.StringParameter(this, "ProductEventsLayerArn", {
      parameterName: "ProductEventsLayerArn",
      stringValue: productEventsLayers.layerVersionArn,
    });
  }
}
