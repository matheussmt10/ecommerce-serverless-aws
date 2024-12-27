import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ssm from "aws-cdk-lib/aws-ssm";

export class ProductsAppLayersStack extends cdk.Stack {
  readonly productsLayers: lambda.LayerVersion;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.productsLayers = new lambda.LayerVersion(this, "ProductsLayers", {
      layerVersionName: "ProductsLayers",
      code: lambda.Code.fromAsset("lambda/products/layers/productsLayer"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new ssm.StringParameter(this, "ProductsLayerArn", {
      parameterName: "ProductsLayerArn",
      stringValue: this.productsLayers.layerVersionArn,
    });
  }
}
