#!/usr/bin/env tsx

import { OpenAPIRegistry, extendZodWithOpenApi } from "zod-to-openapi";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

// Import all schemas
import * as authSchemas from "../src/auth";
import * as referralSchemas from "../src/referral";
import * as catalogSchemas from "../src/catalog";
import * as pricingSchemas from "../src/pricing";
import * as ordersSchemas from "../src/orders";
import * as paymentsSchemas from "../src/payments";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

// Create OpenAPI registry
const registry = new OpenAPIRegistry();

// Register all schemas
Object.values(authSchemas).forEach((schema) => {
  if (schema instanceof z.ZodSchema) {
    registry.register(schema);
  }
});

Object.values(referralSchemas).forEach((schema) => {
  if (schema instanceof z.ZodSchema) {
    registry.register(schema);
  }
});

Object.values(catalogSchemas).forEach((schema) => {
  if (schema instanceof z.ZodSchema) {
    registry.register(schema);
  }
});

Object.values(pricingSchemas).forEach((schema) => {
  if (schema instanceof z.ZodSchema) {
    registry.register(schema);
  }
});

Object.values(ordersSchemas).forEach((schema) => {
  if (schema instanceof z.ZodSchema) {
    registry.register(schema);
  }
});

Object.values(paymentsSchemas).forEach((schema) => {
  if (schema instanceof z.ZodSchema) {
    registry.register(schema);
  }
});

// Generate OpenAPI document
const openApiDocument = {
  openapi: "3.0.0",
  info: {
    title: "E-commerce API",
    version: "1.0.0",
    description: "E-commerce API with Kakao OAuth and payment integration",
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Development server",
    },
    {
      url: "https://api.yourdomain.com",
      description: "Production server",
    },
  ],
  paths: {
    // Health check
    "/healthz": {
      get: {
        summary: "Health check",
        description: "Check API health status",
        tags: ["Health"],
        responses: {
          "200": {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", format: "date-time" },
                    uptime: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Auth endpoints
    "/auth/kakao": {
      get: {
        summary: "Kakao OAuth login",
        description: "Redirect to Kakao OAuth",
        tags: ["Auth"],
        responses: {
          "302": {
            description: "Redirect to Kakao OAuth",
          },
        },
      },
    },
    "/auth/kakao/callback": {
      get: {
        summary: "Kakao OAuth callback",
        description: "Handle Kakao OAuth callback",
        tags: ["Auth"],
        parameters: [
          {
            name: "code",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "state",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "OAuth successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    user: { $ref: "#/components/schemas/SessionUser" },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Products endpoints
    "/products": {
      get: {
        summary: "Get products",
        description: "Get paginated list of products",
        tags: ["Products"],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
          {
            name: "categoryId",
            in: "query",
            schema: { type: "string" },
          },
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Products retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GetProductsResponse" },
              },
            },
          },
        },
      },
    },
    "/products/{id}": {
      get: {
        summary: "Get product by ID",
        description: "Get detailed product information",
        tags: ["Products"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Product retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Product" },
              },
            },
          },
        },
      },
    },
    // Orders endpoints
    "/orders": {
      post: {
        summary: "Create order",
        description: "Create a new order",
        tags: ["Orders"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateOrderRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Order created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Order" },
              },
            },
          },
        },
      },
      get: {
        summary: "Get orders",
        description: "Get paginated list of orders",
        tags: ["Orders"],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
          {
            name: "status",
            in: "query",
            schema: { $ref: "#/components/schemas/OrderStatus" },
          },
        ],
        responses: {
          "200": {
            description: "Orders retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GetOrdersResponse" },
              },
            },
          },
        },
      },
    },
    // Payments endpoints
    "/payments/kakao": {
      post: {
        summary: "Create KakaoPay payment",
        description: "Initialize KakaoPay payment",
        tags: ["Payments"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/KakaoPayRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Payment initialized successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/KakaoPayResponse" },
              },
            },
          },
        },
      },
    },
    "/payments/{id}/approve": {
      post: {
        summary: "Approve payment",
        description: "Approve a pending payment",
        tags: ["Payments"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApprovePaymentRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Payment approved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApprovePaymentResponse" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: registry.getDefinitions(),
  },
  tags: [
    { name: "Health", description: "Health check endpoints" },
    { name: "Auth", description: "Authentication endpoints" },
    { name: "Products", description: "Product management endpoints" },
    { name: "Orders", description: "Order management endpoints" },
    { name: "Payments", description: "Payment processing endpoints" },
    { name: "Referrals", description: "Referral code management endpoints" },
    { name: "Pricing", description: "Pricing policy endpoints" },
  ],
};

// Write OpenAPI document to file
const outputPath = path.join(__dirname, "../openapi.json");
fs.writeFileSync(outputPath, JSON.stringify(openApiDocument, null, 2));

// console.log(`OpenAPI document generated at: ${outputPath}`);
// console.log("Total schemas registered:", registry.getDefinitions().length);
