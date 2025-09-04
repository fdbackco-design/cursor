
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  name: 'name',
  role: 'role',
  kakaoSub: 'kakaoSub',
  referrerCodeUsed: 'referrerCodeUsed',
  approve: 'approve',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  phoneNumber: 'phoneNumber',
  shippingAddress: 'shippingAddress',
  talkMessageAgreed: 'talkMessageAgreed'
};

exports.Prisma.SellerScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  companyName: 'companyName',
  representativeName: 'representativeName',
  phone: 'phone',
  address: 'address',
  isVerified: 'isVerified',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReferralCodeScalarFieldEnum = {
  id: 'id',
  code: 'code',
  currentUses: 'currentUses',
  isActive: 'isActive',
  sellerId: 'sellerId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  parentId: 'parentId',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VendorScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  isActive: 'isActive',
  cutoffTime: 'cutoffTime',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  shortDescription: 'shortDescription',
  priceB2B: 'priceB2B',
  priceB2C: 'priceB2C',
  comparePrice: 'comparePrice',
  sku: 'sku',
  weight: 'weight',
  length: 'length',
  width: 'width',
  height: 'height',
  images: 'images',
  categoryId: 'categoryId',
  vendorId: 'vendorId',
  isActive: 'isActive',
  isFeatured: 'isFeatured',
  stockQuantity: 'stockQuantity',
  lowStockThreshold: 'lowStockThreshold',
  tags: 'tags',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  descriptionImages: 'descriptionImages'
};

exports.Prisma.WishlistScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  productId: 'productId',
  createdAt: 'createdAt'
};

exports.Prisma.CouponScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  description: 'description',
  discountType: 'discountType',
  discountValue: 'discountValue',
  minAmount: 'minAmount',
  maxAmount: 'maxAmount',
  maxUses: 'maxUses',
  currentUses: 'currentUses',
  userMaxUses: 'userMaxUses',
  startsAt: 'startsAt',
  endsAt: 'endsAt',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserCouponScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  couponId: 'couponId',
  usageCount: 'usageCount',
  deletedAt: 'deletedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PointsLedgerScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  amount: 'amount',
  balance: 'balance',
  description: 'description',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.CartScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CartItemScalarFieldEnum = {
  id: 'id',
  cartId: 'cartId',
  productId: 'productId',
  quantity: 'quantity',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrderScalarFieldEnum = {
  id: 'id',
  orderNumber: 'orderNumber',
  userId: 'userId',
  couponId: 'couponId',
  status: 'status',
  subtotal: 'subtotal',
  discountAmount: 'discountAmount',
  shippingAmount: 'shippingAmount',
  taxAmount: 'taxAmount',
  totalAmount: 'totalAmount',
  referralCodeUsed: 'referralCodeUsed',
  couponCodeUsed: 'couponCodeUsed',
  shippingAddress: 'shippingAddress',
  billingAddress: 'billingAddress',
  notes: 'notes',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrderItemScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  productId: 'productId',
  productName: 'productName',
  productSku: 'productSku',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  totalPrice: 'totalPrice',
  discountAmount: 'discountAmount',
  finalPrice: 'finalPrice',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  orderName: 'orderName',
  paymentKey: 'paymentKey',
  paymentNumber: 'paymentNumber',
  amount: 'amount',
  currency: 'currency',
  method: 'method',
  status: 'status',
  customerKey: 'customerKey',
  customerId: 'customerId',
  customerEmail: 'customerEmail',
  customerName: 'customerName',
  customerMobilePhone: 'customerMobilePhone',
  idempotencyKey: 'idempotencyKey',
  pgTransactionId: 'pgTransactionId',
  pgResponse: 'pgResponse',
  failureReason: 'failureReason',
  approvedAt: 'approvedAt',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ShipmentScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  trackingNumber: 'trackingNumber',
  carrier: 'carrier',
  status: 'status',
  shippedAt: 'shippedAt',
  deliveredAt: 'deliveredAt',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ShipmentAllocationScalarFieldEnum = {
  id: 'id',
  shipmentId: 'shipmentId',
  orderItemId: 'orderItemId',
  qty: 'qty'
};

exports.Prisma.ReturnScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  orderItemId: 'orderItemId',
  type: 'type',
  reason: 'reason',
  status: 'status',
  refundAmount: 'refundAmount',
  notes: 'notes',
  adminNotes: 'adminNotes',
  processedBy: 'processedBy',
  processedAt: 'processedAt',
  refundId: 'refundId',
  trackingNumber: 'trackingNumber',
  carrier: 'carrier',
  exchangeTrackingNumber: 'exchangeTrackingNumber',
  exchangeCarrier: 'exchangeCarrier',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RefundScalarFieldEnum = {
  id: 'id',
  returnId: 'returnId',
  orderId: 'orderId',
  orderItemId: 'orderItemId',
  paymentKey: 'paymentKey',
  refundAmount: 'refundAmount',
  refundReason: 'refundReason',
  status: 'status',
  tossRefundId: 'tossRefundId',
  transactionKey: 'transactionKey',
  receiptKey: 'receiptKey',
  refundedAt: 'refundedAt',
  processedBy: 'processedBy',
  notes: 'notes',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReviewScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  userId: 'userId',
  orderId: 'orderId',
  orderItemId: 'orderItemId',
  rating: 'rating',
  title: 'title',
  content: 'content',
  isVerified: 'isVerified',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.QnaScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  userId: 'userId',
  question: 'question',
  answer: 'answer',
  isPublic: 'isPublic',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  orderId: 'orderId',
  paymentId: 'paymentId',
  action: 'action',
  resource: 'resource',
  resourceId: 'resourceId',
  oldValues: 'oldValues',
  newValues: 'newValues',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt'
};

exports.Prisma.UserAddressScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  name: 'name',
  receiverName: 'receiverName',
  receiverPhoneNumber1: 'receiverPhoneNumber1',
  receiverPhoneNumber2: 'receiverPhoneNumber2',
  zoneNumber: 'zoneNumber',
  baseAddress: 'baseAddress',
  detailAddress: 'detailAddress',
  isDefault: 'isDefault',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.UserRole = exports.$Enums.UserRole = {
  BIZ: 'BIZ',
  CONSUMER: 'CONSUMER',
  ADMIN: 'ADMIN'
};

exports.DiscountType = exports.$Enums.DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT'
};

exports.PointsType = exports.$Enums.PointsType = {
  EARN: 'EARN',
  SPEND: 'SPEND',
  EXPIRE: 'EXPIRE'
};

exports.OrderStatus = exports.$Enums.OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
  PARTIALLY_CANCELLED: 'PARTIALLY_CANCELLED'
};

exports.ShipmentStatus = exports.$Enums.ShipmentStatus = {
  PENDING: 'PENDING',
  SHIPPED: 'SHIPPED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED'
};

exports.ReturnType = exports.$Enums.ReturnType = {
  RETURN: 'RETURN',
  EXCHANGE: 'EXCHANGE',
  CANCEL: 'CANCEL'
};

exports.ReturnStatus = exports.$Enums.ReturnStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED'
};

exports.RefundReason = exports.$Enums.RefundReason = {
  PRODUCT_DEFECT: 'PRODUCT_DEFECT',
  CUSTOMER_CHANGE: 'CUSTOMER_CHANGE',
  DELIVERY_ERROR: 'DELIVERY_ERROR',
  WRONG_ITEM: 'WRONG_ITEM',
  DAMAGED_PACKAGE: 'DAMAGED_PACKAGE',
  SIZE_MISMATCH: 'SIZE_MISMATCH',
  COLOR_MISMATCH: 'COLOR_MISMATCH',
  OTHER: 'OTHER'
};

exports.RefundStatus = exports.$Enums.RefundStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

exports.Prisma.ModelName = {
  User: 'User',
  Seller: 'Seller',
  ReferralCode: 'ReferralCode',
  Category: 'Category',
  Vendor: 'Vendor',
  Product: 'Product',
  Wishlist: 'Wishlist',
  Coupon: 'Coupon',
  UserCoupon: 'UserCoupon',
  PointsLedger: 'PointsLedger',
  Cart: 'Cart',
  CartItem: 'CartItem',
  Order: 'Order',
  OrderItem: 'OrderItem',
  Payment: 'Payment',
  Shipment: 'Shipment',
  ShipmentAllocation: 'ShipmentAllocation',
  Return: 'Return',
  Refund: 'Refund',
  Review: 'Review',
  Qna: 'Qna',
  AuditLog: 'AuditLog',
  UserAddress: 'UserAddress'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
