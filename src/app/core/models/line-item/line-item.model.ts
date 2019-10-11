import { BasketRebate } from 'ish-core/models/basket-rebate/basket-rebate.model';
import { BasketValidationErrorType } from 'ish-core/models/basket-validation/basket-validation.model';
import { Price } from 'ish-core/models/price/price.model';
import { Product } from 'ish-core/models/product/product.model';

export interface LineItem {
  id: string;
  position: number;
  quantity: {
    type?: string;
    value: number;
    unit?: string;
  };
  productSKU: string;
  price: Price;
  singleBasePrice: Price;
  itemSurcharges?: {
    amount: Price;
    description?: string;
    displayName?: string;
    text?: string;
  }[];
  valueRebates?: BasketRebate[];
  totals: {
    salesTaxTotal?: Price;
    shippingTaxTotal?: Price;
    shippingTotal: Price;
    total: Price;
    undiscountedTotal;
    valueRebatesTotal?: Price;

    // attributes needed for quote feature
    originTotal?: Price;
  };
  isHiddenGift: boolean;
  isFreeGift: boolean;

  // attributes needed for order line items
  name?: string;
  description?: string;
  fulfillmentStatus?: string;

  // attributes needed for quote feature
  originSingleBasePrice?: Price;
}

export interface LineItemView extends LineItem {
  product: Product;
  validationError?: BasketValidationErrorType;
}
