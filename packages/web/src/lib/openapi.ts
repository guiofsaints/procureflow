/**
 * OpenAPI 3.0 Specification for ProcureFlow API
 *
 * This module generates the OpenAPI spec programmatically.
 * The spec documents all API endpoints for the tech case.
 */

export interface OpenAPIDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, unknown>;
  components: {
    schemas: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
  security?: Array<Record<string, unknown>>;
} /**
 * Get the complete OpenAPI document
 */
export function getOpenApiDocument(): OpenAPIDocument {
  return {
    openapi: '3.0.0',
    info: {
      title: 'ProcureFlow API',
      version: '1.0.0',
      description:
        'REST API for ProcureFlow - AI-native procurement platform. Most endpoints require authentication via NextAuth session.',
    },
    servers: [
      {
        url: '/api',
        description: 'API base path',
      },
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          description: 'Check API and database health status',
          tags: ['System'],
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/HealthResponse',
                  },
                },
              },
            },
            '503': {
              description: 'Service is degraded',
            },
          },
        },
      },
      '/items': {
        get: {
          summary: 'Search catalog items',
          description:
            'Search for items in the catalog by keyword (optional). Public endpoint - no authentication required.',
          tags: ['Catalog'],
          parameters: [
            {
              name: 'q',
              in: 'query',
              description:
                'Search keyword (searches name, description, category)',
              required: false,
              schema: {
                type: 'string',
              },
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Maximum number of results',
              required: false,
              schema: {
                type: 'integer',
                default: 50,
              },
            },
          ],
          responses: {
            '200': {
              description: 'List of matching items',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      items: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Item',
                        },
                      },
                      count: {
                        type: 'integer',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create new catalog item',
          description:
            'Register a new item in the catalog (requires authentication)',
          tags: ['Catalog'],
          security: [{ session: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateItemRequest',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Item created successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Item',
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
            },
            '401': {
              description: 'Unauthorized',
            },
            '409': {
              description: 'Potential duplicate detected',
            },
          },
        },
      },
      '/cart': {
        get: {
          summary: 'Get user cart',
          description:
            "Retrieve the current user's cart (requires authentication)",
          tags: ['Cart'],
          security: [{ session: [] }],
          responses: {
            '200': {
              description: 'User cart',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Cart',
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
            },
          },
        },
      },
      '/cart/items': {
        post: {
          summary: 'Add item to cart',
          description: 'Add an item to the cart (requires authentication)',
          tags: ['Cart'],
          security: [{ session: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AddToCartRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Item added to cart',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Cart',
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
            },
            '401': {
              description: 'Unauthorized',
            },
            '404': {
              description: 'Item not found',
            },
          },
        },
      },
      '/cart/items/{itemId}': {
        patch: {
          summary: 'Update cart item quantity',
          description:
            'Update the quantity of an item in the cart (requires authentication)',
          tags: ['Cart'],
          security: [{ session: [] }],
          parameters: [
            {
              name: 'itemId',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['quantity'],
                  properties: {
                    quantity: {
                      type: 'integer',
                      minimum: 1,
                      maximum: 999,
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Cart updated',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Cart',
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
            },
            '401': {
              description: 'Unauthorized',
            },
          },
        },
        delete: {
          summary: 'Remove item from cart',
          description: 'Remove an item from the cart (requires authentication)',
          tags: ['Cart'],
          security: [{ session: [] }],
          parameters: [
            {
              name: 'itemId',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Item removed',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Cart',
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
            },
          },
        },
      },
      '/checkout': {
        post: {
          summary: 'Complete checkout',
          description:
            'Create purchase request and clear cart (requires authentication)',
          tags: ['Checkout'],
          security: [{ session: [] }],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    notes: {
                      type: 'string',
                      description: 'Optional notes/justification',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Checkout completed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                      },
                      purchaseRequest: {
                        $ref: '#/components/schemas/PurchaseRequest',
                      },
                      note: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Empty cart or validation error',
            },
            '401': {
              description: 'Unauthorized',
            },
          },
        },
      },
      '/agent/chat': {
        post: {
          summary: 'Send message to AI agent',
          description:
            'Conversational interface to the procurement agent (requires authentication)',
          tags: ['Agent'],
          security: [{ session: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AgentChatRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Agent response',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/AgentChatResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        session: {
          type: 'apiKey',
          in: 'cookie',
          name: 'next-auth.session-token',
          description:
            'NextAuth session cookie. Authenticate by logging in at the root path.',
        },
      },
      schemas: {
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['ok', 'degraded'],
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
            service: {
              type: 'string',
            },
            version: {
              type: 'string',
            },
            environment: {
              type: 'string',
            },
            checks: {
              type: 'object',
              properties: {
                api: {
                  type: 'string',
                },
                db: {
                  type: 'string',
                },
              },
            },
            uptime: {
              type: 'number',
            },
          },
        },
        Item: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            category: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            estimatedPrice: {
              type: 'number',
              format: 'float',
              description: 'Estimated unit price in the default currency',
            },
            unit: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['active', 'pending_review', 'inactive'],
              description: 'Item status in the catalog',
            },
            preferredSupplier: {
              type: 'string',
            },
            createdByUserId: {
              type: 'string',
              description: 'User ID of the person who registered this item',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateItemRequest: {
          type: 'object',
          required: ['name', 'category', 'description', 'estimatedPrice'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 200,
            },
            category: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
            },
            description: {
              type: 'string',
              minLength: 10,
              maxLength: 2000,
            },
            estimatedPrice: {
              type: 'number',
              format: 'float',
              minimum: 0.01,
            },
            unit: {
              type: 'string',
            },
            preferredSupplier: {
              type: 'string',
            },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            userId: {
              type: 'string',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem',
              },
            },
            totalCost: {
              type: 'number',
              format: 'float',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CartItem: {
          type: 'object',
          properties: {
            itemId: {
              type: 'string',
            },
            name: {
              type: 'string',
              description:
                'Snapshot of item name at the time of adding to cart',
            },
            unitPrice: {
              type: 'number',
              format: 'float',
              description:
                'Snapshot of item price at the time of adding to cart',
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              maximum: 999,
            },
            subtotal: {
              type: 'number',
              format: 'float',
            },
            addedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        AddToCartRequest: {
          type: 'object',
          required: ['itemId'],
          properties: {
            itemId: {
              type: 'string',
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              maximum: 999,
              default: 1,
            },
          },
        },
        PurchaseRequest: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            userId: {
              type: 'string',
            },
            requestNumber: {
              type: 'string',
              description: 'Purchase request number (e.g., PR-2024-0001)',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/PurchaseRequestItem',
              },
            },
            total: {
              type: 'number',
              format: 'float',
              description: 'Total estimated cost of the purchase request',
            },
            notes: {
              type: 'string',
            },
            source: {
              type: 'string',
              enum: ['ui', 'agent'],
              description: 'Source of the purchase request',
            },
            status: {
              type: 'string',
              enum: ['submitted', 'pending_approval', 'approved', 'rejected'],
              description: 'Purchase request status',
            },
            deliveryLocation: {
              type: 'string',
              description: 'Delivery location (future)',
            },
            requestedDeliveryDate: {
              type: 'string',
              format: 'date-time',
              description: 'Requested delivery date (future)',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        PurchaseRequestItem: {
          type: 'object',
          properties: {
            itemId: {
              type: 'string',
              description: 'Reference to the original catalog item',
            },
            itemName: {
              type: 'string',
              description: 'Snapshot: item name at checkout',
            },
            itemCategory: {
              type: 'string',
              description: 'Snapshot: item category at checkout',
            },
            itemDescription: {
              type: 'string',
              description: 'Snapshot: item description at checkout',
            },
            unitPrice: {
              type: 'number',
              format: 'float',
              description: 'Snapshot: unit price at checkout',
            },
            quantity: {
              type: 'integer',
              description: 'Quantity requested',
            },
            subtotal: {
              type: 'number',
              format: 'float',
              description: 'Subtotal for this line (unitPrice * quantity)',
            },
          },
        },
        AgentChatRequest: {
          type: 'object',
          required: ['message'],
          properties: {
            message: {
              type: 'string',
              minLength: 1,
              description: 'User message to the agent',
            },
            conversationId: {
              type: 'string',
              description:
                'Optional conversation ID to continue existing conversation',
            },
          },
        },
        AgentChatResponse: {
          type: 'object',
          properties: {
            conversationId: {
              type: 'string',
            },
            messages: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/AgentMessage',
              },
            },
          },
        },
        AgentMessage: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['user', 'agent', 'system'],
              description: 'Message sender role',
            },
            content: {
              type: 'string',
              description: 'Message content (text)',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
            items: {
              type: 'array',
              description:
                'Optional items attached to the message (search results)',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  category: { type: 'string' },
                  description: { type: 'string' },
                  price: { type: 'number' },
                  availability: {
                    type: 'string',
                    enum: ['in_stock', 'out_of_stock', 'limited'],
                  },
                },
              },
            },
            cart: {
              type: 'object',
              description: 'Optional cart data attached to the message',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      itemId: { type: 'string' },
                      itemName: { type: 'string' },
                      itemPrice: { type: 'number' },
                      quantity: { type: 'integer' },
                    },
                  },
                },
                totalCost: { type: 'number' },
                itemCount: { type: 'integer' },
              },
            },
            checkoutConfirmation: {
              type: 'object',
              description: 'Optional checkout confirmation data',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      itemId: { type: 'string' },
                      itemName: { type: 'string' },
                      itemPrice: { type: 'number' },
                      quantity: { type: 'integer' },
                      subtotal: { type: 'number' },
                    },
                  },
                },
                totalCost: { type: 'number' },
                itemCount: { type: 'integer' },
              },
            },
            purchaseRequest: {
              type: 'object',
              description: 'Optional purchase request data after checkout',
              properties: {
                id: { type: 'string' },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      itemName: { type: 'string' },
                      itemCategory: { type: 'string' },
                      quantity: { type: 'integer' },
                      unitPrice: { type: 'number' },
                      subtotal: { type: 'number' },
                    },
                  },
                },
                totalCost: { type: 'number' },
                status: { type: 'string' },
              },
            },
          },
        },
      },
    },
  };
}
