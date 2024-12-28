export enum PaymentType {
  CREDIT_CARD = "CREDIT_CARD",
  PAYPAL = "PAYPAL",
  DEBIT_CARD = "DEBIT_CARD",
}

export enum ShippingType {
  STANDARD = "STANDARD",
  EXPRESS = "EXPRESS",
}

export enum CarrierType {
  UPS = "UPS",
  FEDEX = "FEDEX",
  USPS = "USPS",
}

export interface OrderRequest {
  email: string;
  productsId: Array<string>;
  payment: PaymentType;
  shipping: {
    type: ShippingType;
    carrier: CarrierType;
  };
}

export interface OrderProductResponse {
  code: string;
  price: number;
}

export interface OrderResponse {
  email: string;
  id: string;
  createdAt: number;
  billing: {
    payment: PaymentType;
    totalPrice: number;
  };
  shipping: {
    type: ShippingType;
    carrier: CarrierType;
  };
  products: Array<OrderProductResponse>;
}
