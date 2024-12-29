import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cwlogs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

interface EcommerceApiStackProps extends cdk.StackProps {
  productsFetchHandler: lambdaNodeJs.NodejsFunction;
  productsAdminHandler: lambdaNodeJs.NodejsFunction;
  orderHandler: lambdaNodeJs.NodejsFunction;
}

export class EcommerceApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EcommerceApiStackProps) {
    super(scope, id, props);

    const logGroup = new cwlogs.LogGroup(this, "EcommerceApiLogGroup");
    const api = new apigateway.RestApi(this, "EcommerceApi", {
      restApiName: "EcommerceApi",
      cloudWatchRole: true,
      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
      },
    });

    this.createProductsService(props, api);
    this.createOrdersService(props, api);
  }

  private createProductsService(
    props: EcommerceApiStackProps,
    api: apigateway.RestApi
  ) {
    const productsFetchIntegration = new apigateway.LambdaIntegration(
      props.productsFetchHandler
    );
    // GET /products
    const productsResource = api.root.addResource("products");
    productsResource.addMethod("GET", productsFetchIntegration);

    // GET /products/{id}
    const productIdResource = productsResource.addResource("{id}");
    productIdResource.addMethod("GET", productsFetchIntegration);

    const productsAdminIntegration = new apigateway.LambdaIntegration(
      props.productsAdminHandler
    );

    // POST /products
    productsResource.addMethod("POST", productsAdminIntegration);

    // PUT /products/{id}
    productIdResource.addMethod("PUT", productsAdminIntegration);

    // DELETE /products/{id}
    productIdResource.addMethod("DELETE", productsAdminIntegration);
  }

  private createOrdersService(
    props: EcommerceApiStackProps,
    api: apigateway.RestApi
  ) {
    const ordersIntegration = new apigateway.LambdaIntegration(
      props.orderHandler
    );

    // GET /orders
    const ordersResource = api.root.addResource("orders");
    ordersResource.addMethod("GET", ordersIntegration);

    const orderModel = new apigateway.Model(this, "OrderModel", {
      restApi: api,
      modelName: "OrderModel",
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          email: {
            type: apigateway.JsonSchemaType.STRING,
          },
          productIds: {
            type: apigateway.JsonSchemaType.ARRAY,
            minItems: 1,
            items: {
              type: apigateway.JsonSchemaType.STRING,
            },
          },
          payment: {
            type: apigateway.JsonSchemaType.STRING,
            enum: ["CREDIT_CARD", "PAYPAL", "DEBIT_CARD"],
          },
        },
        required: ["email", "productIds", "payment"],
      },
    });

    // POST /orders
    ordersResource.addMethod("POST", ordersIntegration, {
      requestValidator: new apigateway.RequestValidator(
        this,
        "OrderCreationValidator",
        {
          restApi: api,
          requestValidatorName: "OrderCreationValidator",
          validateRequestBody: true,
        }
      ),
      requestModels: {
        "application/json": orderModel,
      },
    });

    // PUT /orders/{id}
    ordersResource.addMethod("DELETE", ordersIntegration, {
      requestParameters: {
        "method.request.querystring.email": true,
        "method.request.querystring.orderId": true,
      },
      requestValidator: new apigateway.RequestValidator(
        this,
        "OrderDeletionValidator",
        {
          restApi: api,
          requestValidatorName: "OrderDeletionValidator",
          validateRequestParameters: true,
        }
      ),
    });
  }
}
