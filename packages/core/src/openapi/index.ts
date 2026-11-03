import { z } from 'zod';
import {
  EntryCreateSchema,
  EntryUpdateSchema,
  RevisionCreateSchema,
  AnnotationUpdateSchema,
  FacetUpsertSchema,
  ClaimUpsertSchema,
  RelationUpsertSchema,
  EvidenceUpsertSchema,
  AskQuerySchema,
  BookingCreateSchema,
  RoutingConfigSchema,
  VisibilitySchema,
  EntryViewSchema,
  TemporalLevelSchema,
  AnnotationSourceSchema,
  AnnotationStatusSchema,
  FacetStatusSchema,
  ClaimKindSchema,
  OutcomeStatusSchema,
  RelationTypeSchema,
  RelationStatusSchema,
  EvidenceKindSchema,
  QueryClassSchema,
  DataClassSchema,
} from '../schemas/index.js';

export interface OpenApiSchemaObject {
  type?: string;
  format?: string;
  pattern?: string;
  enum?: (string | number | boolean)[];
  items?: OpenApiSchemaObject;
  properties?: Record<string, OpenApiSchemaObject>;
  required?: string[];
  nullable?: boolean;
  default?: any;
  oneOf?: OpenApiSchemaObject[];
  anyOf?: OpenApiSchemaObject[];
  allOf?: OpenApiSchemaObject[];
  description?: string;
  minimum?: number;
  maximum?: number;
  additionalProperties?: boolean | OpenApiSchemaObject;
  $ref?: string;
}

/**
 * Converts a Zod schema into an OpenAPI 3.1 compatible JSON Schema definition.
 */
export function zodToOpenApi(schema: z.ZodTypeAny): OpenApiSchemaObject {
  const def = (schema as any)._def;
  if (!def) return {};

  const typeName = def.typeName;

  switch (typeName) {
    case 'ZodString': {
      const res: OpenApiSchemaObject = { type: 'string' };
      if (def.checks) {
        for (const check of def.checks) {
          if (check.kind === 'datetime') res.format = 'date-time';
          else if (check.kind === 'uuid') res.format = 'uuid';
          else if (check.kind === 'url') res.format = 'uri';
          else if (check.kind === 'regex') res.pattern = check.regex.source;
          else if (check.kind === 'min') res.minimum = check.value;
          else if (check.kind === 'max') res.maximum = check.value;
        }
      }
      return res;
    }

    case 'ZodNumber': {
      const res: OpenApiSchemaObject = { type: 'number' };
      if (def.checks) {
        for (const check of def.checks) {
          if (check.kind === 'min') res.minimum = check.value;
          else if (check.kind === 'max') res.maximum = check.value;
          else if (check.kind === 'int') res.type = 'integer';
        }
      }
      return res;
    }

    case 'ZodBoolean':
      return { type: 'boolean' };

    case 'ZodEnum':
      return { type: 'string', enum: [...def.values] };

    case 'ZodArray':
      return {
        type: 'array',
        items: zodToOpenApi(def.type),
      };

    case 'ZodObject': {
      const shape = def.shape();
      const properties: Record<string, OpenApiSchemaObject> = {};
      const required: string[] = [];

      for (const [key, propSchema] of Object.entries<z.ZodTypeAny>(shape)) {
        properties[key] = zodToOpenApi(propSchema);
        // If not optional and not has default, it is required
        let isOptional = false;
        let cur: any = propSchema;
        while (cur && cur._def) {
          if (cur._def.typeName === 'ZodOptional' || cur._def.typeName === 'ZodDefault') {
            isOptional = true;
            break;
          }
          cur = cur._def.innerType;
        }
        if (!isOptional) {
          required.push(key);
        }
      }

      const res: OpenApiSchemaObject = {
        type: 'object',
        properties,
      };
      if (required.length > 0) {
        res.required = required;
      }
      return res;
    }

    case 'ZodRecord':
      return {
        type: 'object',
        additionalProperties: zodToOpenApi(def.valueType),
      };

    case 'ZodOptional':
      return zodToOpenApi(def.innerType);

    case 'ZodNullable': {
      const inner = zodToOpenApi(def.innerType);
      return { ...inner, nullable: true };
    }

    case 'ZodDefault': {
      const inner = zodToOpenApi(def.innerType);
      try {
        return { ...inner, default: def.defaultValue() };
      } catch {
        return inner;
      }
    }

    case 'ZodUnion':
      return {
        oneOf: def.options.map((opt: z.ZodTypeAny) => zodToOpenApi(opt)),
      };

    case 'ZodLiteral':
      return {
        type: typeof def.value,
        enum: [def.value],
      };

    case 'ZodAny':
    case 'ZodUnknown':
      return {};

    default:
      return {};
  }
}

/**
 * Builds the canonical Living Portfolio OpenAPI 3.1.0 specification document.
 */
export function buildOpenApiDocument() {
  const schemas: Record<string, OpenApiSchemaObject> = {
    Visibility: zodToOpenApi(VisibilitySchema),
    EntryView: zodToOpenApi(EntryViewSchema),
    TemporalLevel: zodToOpenApi(TemporalLevelSchema),
    AnnotationSource: zodToOpenApi(AnnotationSourceSchema),
    AnnotationStatus: zodToOpenApi(AnnotationStatusSchema),
    FacetStatus: zodToOpenApi(FacetStatusSchema),
    ClaimKind: zodToOpenApi(ClaimKindSchema),
    OutcomeStatus: zodToOpenApi(OutcomeStatusSchema),
    RelationType: zodToOpenApi(RelationTypeSchema),
    RelationStatus: zodToOpenApi(RelationStatusSchema),
    EvidenceKind: zodToOpenApi(EvidenceKindSchema),
    QueryClass: zodToOpenApi(QueryClassSchema),
    DataClass: zodToOpenApi(DataClassSchema),
    EntryCreate: zodToOpenApi(EntryCreateSchema),
    EntryUpdate: zodToOpenApi(EntryUpdateSchema),
    RevisionCreate: zodToOpenApi(RevisionCreateSchema),
    AnnotationUpdate: zodToOpenApi(AnnotationUpdateSchema),
    FacetUpsert: zodToOpenApi(FacetUpsertSchema),
    ClaimUpsert: zodToOpenApi(ClaimUpsertSchema),
    RelationUpsert: zodToOpenApi(RelationUpsertSchema),
    EvidenceUpsert: zodToOpenApi(EvidenceUpsertSchema),
    AskQuery: zodToOpenApi(AskQuerySchema),
    BookingCreate: zodToOpenApi(BookingCreateSchema),
    RoutingConfig: zodToOpenApi(RoutingConfigSchema),
    AuthSetupInput: {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: { type: 'string' },
        password: { type: 'string', minimum: 12 },
        totpSecret: { type: 'string' },
      },
    },
    AuthLoginInput: {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: { type: 'string' },
        password: { type: 'string' },
        totpCode: { type: 'string' },
      },
    },
    TokenIssueInput: {
      type: 'object',
      properties: {
        label: { type: 'string', default: 'owner-api-token' },
      },
    },
    QuickLogInput: {
      type: 'object',
      required: ['body_md'],
      properties: {
        body_md: { type: 'string' },
        valid_from: { type: 'string', format: 'date-time' },
        profile: { type: 'string', default: 'observation' },
      },
    },
    RedactionPreviewInput: {
      type: 'object',
      required: ['body_md'],
      properties: {
        body_md: { type: 'string' },
        entryId: { type: 'string', format: 'uuid' },
      },
    },
    RedactApplyInput: {
      type: 'object',
      required: ['body_md'],
      properties: {
        body_md: { type: 'string' },
        redactionPreviewToken: { type: 'string' },
      },
    },
    PublishInput: {
      type: 'object',
      properties: {
        redactionPreviewToken: { type: 'string' },
        nda_confirmed: { type: 'boolean' },
      },
    },
    AskFeedbackInput: {
      type: 'object',
      required: ['query_id', 'rating'],
      properties: {
        query_id: { type: 'string' },
        rating: { type: 'string', enum: ['helpful', 'unhelpful'] },
        notes: { type: 'string' },
      },
    },
    ImportPlanInput: {
      type: 'object',
      required: ['source'],
      properties: {
        source: { type: 'string' },
        payload: { type: 'object' },
      },
    },
    ImportBatchInput: {
      type: 'object',
      required: ['plan_id', 'approved_items'],
      properties: {
        plan_id: { type: 'string' },
        approved_items: { type: 'array', items: { type: 'string' } },
      },
    },
  };

  const jsonContent = (schemaName: string) => ({
    'application/json': {
      schema: {
        $ref: `#/components/schemas/${schemaName}`,
      },
    },
  });

  const responseJson = (description: string, schema?: OpenApiSchemaObject) => ({
    description,
    content: schema ? { 'application/json': { schema } } : undefined,
  });

  return {
    openapi: '3.1.0',
    info: {
      title: 'Living Portfolio API',
      version: '1.0.0',
      description:
        'Dynamic professional identity system providing proof-first claims, query-guided interactive answers, NDA-safe confidential redacting, and multi-tier AI responses without vendor or domain lock-in.',
      contact: {
        name: 'Living Portfolio Community',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Living Portfolio API v1 canonical endpoint',
      },
    ],
    components: {
      schemas,
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'Hashed revocable API bearer token issued to the owner or automated tools.',
        },
        SessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'lp_session',
          description: 'HTTP-only authenticated owner session cookie.',
        },
        CsrfToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-CSRF-Token',
          description: 'Cross-Site Request Forgery prevention token bound to the current session.',
        },
      },
    },
    paths: {
      '/health': {
        get: {
          summary: 'System health, measured subsystem statuses, and provider availability',
          tags: ['System'],
          responses: {
            '200': responseJson('Health status object with measured subsystem statuses and providers'),
          },
        },
      },
      '/openapi.json': {
        get: {
          summary: 'Committed OpenAPI 3.1.0 specification document',
          tags: ['System'],
          responses: {
            '200': responseJson('Complete OpenAPI specification document'),
          },
        },
      },
      '/auth/setup': {
        post: {
          summary: 'First-run admin account initialization',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: jsonContent('AuthSetupInput'),
          },
          responses: {
            '201': responseJson('Admin account created successfully with initial credentials'),
            '400': responseJson('Missing or invalid credentials format'),
            '409': responseJson('Admin account has already been initialized'),
          },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Owner credentials authentication and session creation',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: jsonContent('AuthLoginInput'),
          },
          responses: {
            '200': responseJson('Authentication successful; session cookie and CSRF token returned'),
            '401': responseJson('Invalid credentials or TOTP challenge failure'),
            '429': responseJson('Too many authentication attempts (throttled)'),
          },
        },
      },
      '/auth/logout': {
        post: {
          summary: 'Invalidate current session and clear authentication cookies',
          tags: ['Authentication'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '200': responseJson('Session successfully revoked'),
          },
        },
      },
      '/auth/session': {
        get: {
          summary: 'Inspect active session state and CSRF token',
          tags: ['Authentication'],
          responses: {
            '200': responseJson('Session status and authenticated state'),
          },
        },
      },
      '/auth/tokens': {
        get: {
          summary: 'List active revocable API bearer tokens',
          tags: ['Authentication'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '200': responseJson('Array of bearer token records'),
          },
        },
        post: {
          summary: 'Issue a new hashed revocable API bearer token',
          tags: ['Authentication'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          requestBody: {
            content: jsonContent('TokenIssueInput'),
          },
          responses: {
            '201': responseJson('Bearer token issued with raw secret displayed once'),
          },
        },
      },
      '/auth/tokens/{id}': {
        delete: {
          summary: 'Revoke an existing API bearer token by ID',
          tags: ['Authentication'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Token revoked successfully'),
            '404': responseJson('Token not found'),
          },
        },
      },
      '/entries': {
        get: {
          summary: 'List portfolio entries with structure levels and visibility filtering',
          tags: ['Entries'],
          parameters: [
            {
              name: 'visibility',
              in: 'query',
              schema: { type: 'string' },
              description: 'Comma-separated visibility filter (public, unlisted, private) or all',
            },
            {
              name: 'venture_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter entries by venture UUID',
            },
            {
              name: 'as_of',
              in: 'query',
              schema: { type: 'string', format: 'date-time' },
              description: 'Bitemporal time-travel historical snapshot view date',
            },
          ],
          responses: {
            '200': responseJson('List of portfolio entry summaries'),
            '401': responseJson('Unauthorized filter request on non-public entries'),
          },
        },
        post: {
          summary: 'Create a new portfolio entry and initial revision',
          tags: ['Entries'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          requestBody: {
            required: true,
            content: jsonContent('EntryCreate'),
          },
          responses: {
            '201': responseJson('Entry and revision created successfully'),
            '400': responseJson('Validation error in entry payload'),
            '401': responseJson('Unauthorized: admin authentication required'),
          },
        },
      },
      '/entries/{id}': {
        get: {
          summary: 'Retrieve entry details, current revision, facets, and evidence',
          tags: ['Entries'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Entry UUID or unique slug',
            },
            {
              name: 'view',
              in: 'query',
              schema: { $ref: '#/components/schemas/EntryView' },
            },
            {
              name: 'as_of',
              in: 'query',
              schema: { type: 'string', format: 'date-time' },
            },
          ],
          responses: {
            '200': responseJson('Detailed entry response with revision and facets'),
            '404': responseJson('Entry not found'),
          },
        },
        patch: {
          summary: 'Update entry metadata, visibility, or profile',
          tags: ['Entries'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: jsonContent('EntryUpdate'),
          },
          responses: {
            '200': responseJson('Updated entry details'),
            '400': responseJson('Validation error'),
            '404': responseJson('Entry not found'),
          },
        },
        delete: {
          summary: 'Delete portfolio entry',
          tags: ['Entries'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Entry successfully deleted'),
            '404': responseJson('Entry not found'),
          },
        },
      },
      '/entries/{id}/revisions': {
        get: {
          summary: 'List historical revisions for an entry',
          tags: ['Entries'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Array of immutable entry revisions'),
          },
        },
        post: {
          summary: 'Create a new immutable revision for an entry',
          tags: ['Entries'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: jsonContent('RevisionCreate'),
          },
          responses: {
            '201': responseJson('Revision appended and structure level computed'),
            '400': responseJson('Validation error in revision content'),
          },
        },
      },
      '/entries/{id}/redaction-scan': {
        post: {
          summary: 'Scan entry body for confidential data and entity mentions',
          tags: ['Entries'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Scan findings, categories, and signed preview token'),
          },
        },
      },
      '/entries/redaction-preview': {
        post: {
          summary: 'Scan body content on the fly and issue preview verification token',
          tags: ['Entries'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          requestBody: {
            required: true,
            content: jsonContent('RedactionPreviewInput'),
          },
          responses: {
            '200': responseJson('Scan results and signed preview confirmation token'),
          },
        },
      },
      '/entries/quick-log': {
        post: {
          summary: 'Quickly capture an observation or engineering note',
          tags: ['Entries'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          requestBody: {
            required: true,
            content: jsonContent('QuickLogInput'),
          },
          responses: {
            '201': responseJson('Observation entry created'),
          },
        },
      },
      '/entries/{id}/redact': {
        post: {
          summary: 'Apply entity-level redactions with signed confirmation token',
          tags: ['Entries'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: jsonContent('RedactApplyInput'),
          },
          responses: {
            '200': responseJson('Masked body markdown and redaction audit summary'),
          },
        },
      },
      '/entries/{id}/publish': {
        post: {
          summary: 'Publish entry verifying preview tokens and NDA safety invariants',
          tags: ['Entries'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            content: jsonContent('PublishInput'),
          },
          responses: {
            '200': responseJson('Entry successfully published to public visibility'),
            '403': responseJson('Publication blocked: unconfirmed confidential findings'),
          },
        },
      },
      '/entries/{id}/archive': {
        post: {
          summary: 'Archive entry to private visibility',
          tags: ['Entries'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Entry archived'),
          },
        },
      },
      '/ask': {
        post: {
          summary: 'Query the multi-tier conversational portfolio engine',
          tags: ['Ask'],
          requestBody: {
            required: true,
            content: jsonContent('AskQuery'),
          },
          responses: {
            '200': responseJson('Synthesized answer, citations, and provider disclosure'),
            '429': responseJson('Rate limit or token budget governor capacity reached'),
          },
        },
      },
      '/ask/feedback': {
        post: {
          summary: 'Submit visitor feedback on an Ask answer',
          tags: ['Ask'],
          requestBody: {
            required: true,
            content: jsonContent('AskFeedbackInput'),
          },
          responses: {
            '200': responseJson('Feedback recorded'),
          },
        },
      },
      '/ask/status/{token}': {
        get: {
          summary: 'Check the status of an escalated visitor inquiry',
          tags: ['Ask'],
          parameters: [
            {
              name: 'token',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Escalation status and answer if resolved'),
            '404': responseJson('Escalation token not found'),
          },
        },
      },
      '/timeline': {
        get: {
          summary: 'Get Strata chronological entry aggregations and theme metrics',
          tags: ['Timeline'],
          parameters: [
            {
              name: 'as_of',
              in: 'query',
              schema: { type: 'string', format: 'date-time' },
            },
          ],
          responses: {
            '200': responseJson('Strata monthly buckets and total counts'),
          },
        },
      },
      '/book': {
        get: {
          summary: 'List consultation booking requests (admin only)',
          tags: ['Consultations'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '200': responseJson('List of consultation bookings'),
          },
        },
        post: {
          summary: 'Submit a consultation booking inquiry',
          tags: ['Consultations'],
          requestBody: {
            required: true,
            content: jsonContent('BookingCreate'),
          },
          responses: {
            '201': responseJson('Booking created and confirmation token returned'),
            '400': responseJson('Validation error in booking payload'),
          },
        },
      },
      '/structure/entries/{id}/facets': {
        get: {
          summary: 'Get structured facets for an entry',
          tags: ['Structure'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Array of confirmed and suggested facets'),
          },
        },
      },
      '/structure/facets': {
        post: {
          summary: 'Upsert structured facet',
          tags: ['Structure'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          requestBody: {
            required: true,
            content: jsonContent('FacetUpsert'),
          },
          responses: {
            '201': responseJson('Facet upserted'),
          },
        },
      },
      '/structure/facets/{id}': {
        patch: {
          summary: 'Update facet confirmation status or value',
          tags: ['Structure'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Facet updated'),
          },
        },
        delete: {
          summary: 'Delete facet',
          tags: ['Structure'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Facet deleted'),
          },
        },
      },
      '/structure/entries/{id}/evidence': {
        get: {
          summary: 'Get proof artifacts and evidence items for an entry',
          tags: ['Structure'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Array of evidence records'),
          },
        },
      },
      '/structure/evidence': {
        post: {
          summary: 'Upsert proof artifact or evidence record',
          tags: ['Structure'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          requestBody: {
            required: true,
            content: jsonContent('EvidenceUpsert'),
          },
          responses: {
            '201': responseJson('Evidence record created'),
          },
        },
      },
      '/structure/evidence/{id}': {
        delete: {
          summary: 'Delete evidence record',
          tags: ['Structure'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Evidence record deleted'),
          },
        },
      },
      '/structure/revisions/{id}/spans': {
        get: {
          summary: 'Get annotated semantic spans for a revision',
          tags: ['Structure'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Array of spans with character offsets and role suggestions'),
          },
        },
      },
      '/structure/annotations': {
        post: {
          summary: 'Create span annotation',
          tags: ['Structure'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '201': responseJson('Annotation created'),
          },
        },
      },
      '/structure/annotations/{id}': {
        patch: {
          summary: 'Update annotation role or acceptance status',
          tags: ['Structure'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: jsonContent('AnnotationUpdate'),
          },
          responses: {
            '200': responseJson('Annotation updated'),
          },
        },
      },
      '/structure/claims': {
        post: {
          summary: 'Upsert verified claim with outcome status',
          tags: ['Structure'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          requestBody: {
            required: true,
            content: jsonContent('ClaimUpsert'),
          },
          responses: {
            '201': responseJson('Claim created'),
          },
        },
      },
      '/structure/claims/{id}': {
        patch: {
          summary: 'Update claim status or outcome',
          tags: ['Structure'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Claim updated'),
          },
        },
        delete: {
          summary: 'Delete claim',
          tags: ['Structure'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Claim deleted'),
          },
        },
      },
      '/structure/relations': {
        post: {
          summary: 'Create typed relation edge between claims',
          tags: ['Structure'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          requestBody: {
            required: true,
            content: jsonContent('RelationUpsert'),
          },
          responses: {
            '201': responseJson('Relation edge established'),
          },
        },
      },
      '/structure/relations/{id}': {
        delete: {
          summary: 'Delete relation edge',
          tags: ['Structure'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Relation deleted'),
          },
        },
      },
      '/inbox': {
        get: {
          summary: 'List inbox triage items and suggested annotations',
          tags: ['Inbox'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '200': responseJson('Array of triage items'),
          },
        },
        post: {
          summary: 'Enqueue new inbox item',
          tags: ['Inbox'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '201': responseJson('Inbox item created'),
          },
        },
      },
      '/inbox/{id}/approve': {
        post: {
          summary: 'Approve inbox suggestion',
          tags: ['Inbox'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Inbox item approved'),
          },
        },
      },
      '/inbox/{id}/reject': {
        post: {
          summary: 'Reject and discard inbox suggestion',
          tags: ['Inbox'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Inbox item rejected'),
          },
        },
      },
      '/calibration': {
        get: {
          summary: 'Get self-calibration metrics and routing state',
          tags: ['Calibration'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '200': responseJson('Calibration metrics and window stats'),
          },
        },
        post: {
          summary: 'Update routing calibration parameters',
          tags: ['Calibration'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '200': responseJson('Calibration updated'),
          },
        },
      },
      '/audit': {
        get: {
          summary: 'Get system audit status and active checks',
          tags: ['Audit'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '200': responseJson('Audit summary'),
          },
        },
        post: {
          summary: 'Trigger audit execution',
          tags: ['Audit'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '200': responseJson('Audit execution report'),
          },
        },
      },
      '/audit/topology-conflicts': {
        get: {
          summary: 'Topology Conflicts (SIMULATED honest 501 endpoint per Fix 3 / AUD-18)',
          tags: ['Audit'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '501': responseJson('Honest 501 Not Implemented response'),
          },
        },
      },
      '/import/plan': {
        post: {
          summary: 'Analyze import payload and produce reviewable plan',
          tags: ['Import'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          requestBody: {
            required: true,
            content: jsonContent('ImportPlanInput'),
          },
          responses: {
            '200': responseJson('Import plan with candidate entries'),
          },
        },
      },
      '/import/batch': {
        post: {
          summary: 'Execute batch import of approved items',
          tags: ['Import'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          requestBody: {
            required: true,
            content: jsonContent('ImportBatchInput'),
          },
          responses: {
            '200': responseJson('Batch import result with success count'),
          },
        },
      },
      '/settings': {
        get: {
          summary: 'Get runtime settings and system configuration',
          tags: ['Settings'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '200': responseJson('Runtime settings object'),
          },
        },
      },
      '/settings/routing': {
        patch: {
          summary: 'Update query routing thresholds and tier floors',
          tags: ['Settings'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          requestBody: {
            required: true,
            content: jsonContent('RoutingConfig'),
          },
          responses: {
            '200': responseJson('Updated routing parameters'),
          },
        },
      },
      '/settings/theme': {
        patch: {
          summary: 'Update Strata design tokens and theme',
          tags: ['Settings'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '200': responseJson('Updated theme state'),
          },
        },
      },
      '/settings/notifications/test': {
        post: {
          summary: 'Dispatch test notification to verify adapter health',
          tags: ['Settings'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '200': responseJson('Notification test result'),
          },
        },
      },
      '/settings/backups/run-drill': {
        post: {
          summary: 'Execute automated scratch backup and restore verification drill',
          tags: ['Settings'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '200': responseJson('Drill completed successfully'),
          },
        },
      },
      '/settings/constraints/{id}/confirm': {
        patch: {
          summary: 'Confirm system constraint mined from data',
          tags: ['Settings'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Constraint confirmed'),
          },
        },
      },
      '/settings/constraints/{id}/discard': {
        patch: {
          summary: 'Discard mined system constraint',
          tags: ['Settings'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': responseJson('Constraint discarded'),
          },
        },
      },
      '/admin/metrics/shadow': {
        get: {
          summary: 'Get dual-write shadow repository execution metrics',
          tags: ['Operations'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '200': responseJson('Shadow execution metrics'),
          },
        },
      },
      '/admin/metrics/shadow/reset': {
        post: {
          summary: 'Reset dual-write shadow metrics counters',
          tags: ['Operations'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '200': responseJson('Counters reset'),
          },
        },
      },
      '/admin/metrics/shadow/parity': {
        get: {
          summary: 'Run bit-for-bit parity check between primary and shadow stores',
          tags: ['Operations'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '200': responseJson('Parity check status'),
          },
        },
      },
      '/publish/status': {
        get: {
          summary: 'Get current debounced static rebuild status and daily build counts (§13.7)',
          tags: ['Publishing'],
          responses: {
            '200': responseJson('Current publish and static site rebuild status'),
          },
        },
      },
      '/publish/now': {
        post: {
          summary: 'Trigger immediate static site rebuild bypassing 10-minute debounce window (§13.7)',
          tags: ['Publishing'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '200': responseJson('Publish build executed successfully'),
            '401': responseJson('Unauthorized: Admin credentials required'),
          },
        },
      },
      '/publish/enrich': {
        post: {
          summary: 'Queue or trigger background enrichment for an entry (§8, UX-05)',
          tags: ['Publishing'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    entryId: { type: 'string' },
                    revisionId: { type: 'string' },
                  },
                  required: ['entryId'],
                },
              },
            },
          },
          responses: {
            '200': responseJson('Background enrichment queued'),
            '401': responseJson('Unauthorized: Admin credentials required'),
          },
        },
      },
      '/seed': {
        post: {
          summary: 'Seed demo entries (disabled in production per OSR-04)',
          tags: ['Operations'],
          security: [{ SessionAuth: [] }, { BearerAuth: [] }],
          responses: {
            '200': responseJson('Seeded entries summary'),
            '403': responseJson('Seeding forbidden in production deployments'),
          },
        },
      },
    },
  };
}
