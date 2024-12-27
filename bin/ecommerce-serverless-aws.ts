#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { EcommerceApiStack, ProductsAppStack } from "../lib/index";
import * as dotenv from "dotenv";
dotenv.config();

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.ACCOUNT_ID_AWS,
  region: process.env.AWS_REGION,
};

const tags = {
  cost: "ecommerce",
  team: "mathTeam",
};

const productsAppStack = new ProductsAppStack(app, "ProductsApp", {
  tags,
  env,
});

const ecommerceApiStack = new EcommerceApiStack(app, "EcommerceApi", {
  productsFetchHandler: productsAppStack.productsFetchHandler,
  tags,
  env,
});
ecommerceApiStack.addDependency(productsAppStack);
