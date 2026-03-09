import { z } from 'zod';

function enumRefine(baseSchema, values) {
  const allowed = Array.isArray(values) ? values : [];
  if (allowed.length === 0) return baseSchema;
  return baseSchema.refine((value) => allowed.includes(value), {
    message: `Value must be one of: ${allowed.join(', ')}`,
  });
}

function jsonSchemaToZodInternal(schema, depth = 0) {
  if (!schema || typeof schema !== 'object' || depth > 6) {
    return z.any();
  }

  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    const options = schema.anyOf.map((item) => jsonSchemaToZodInternal(item, depth + 1));
    return options.length === 1 ? options[0] : z.union(options);
  }

  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    const options = schema.oneOf.map((item) => jsonSchemaToZodInternal(item, depth + 1));
    return options.length === 1 ? options[0] : z.union(options);
  }

  const type = typeof schema.type === 'string' ? schema.type : '';

  if (type === 'string') {
    return enumRefine(z.string(), schema.enum);
  }

  if (type === 'number') {
    return enumRefine(z.number(), schema.enum);
  }

  if (type === 'integer') {
    return enumRefine(z.number().int(), schema.enum);
  }

  if (type === 'boolean') {
    return z.boolean();
  }

  if (type === 'array') {
    return z.array(jsonSchemaToZodInternal(schema.items, depth + 1));
  }

  const treatAsObject = type === 'object' || schema.properties || schema.required;
  if (treatAsObject) {
    const properties = schema.properties && typeof schema.properties === 'object' ? schema.properties : {};
    const required = new Set(Array.isArray(schema.required) ? schema.required : []);
    const shape = {};

    for (const [key, childSchema] of Object.entries(properties)) {
      const converted = jsonSchemaToZodInternal(childSchema, depth + 1);
      shape[key] = required.has(key) ? converted : converted.optional();
    }

    return z.object(shape).passthrough();
  }

  return z.any();
}

export function jsonSchemaToZod(schema) {
  return jsonSchemaToZodInternal(schema, 0);
}

export function splitText(text, chunkSize = 24) {
  const chunks = [];
  let current = '';
  for (const char of String(text ?? '')) {
    current += char;
    if (current.length >= chunkSize) {
      chunks.push(current);
      current = '';
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function normalizeRole(role) {
  if (role === 'assistant' || role === 'system') return role;
  return 'user';
}
