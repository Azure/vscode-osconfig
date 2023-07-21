/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/lib/function';

import { JSONPath, Node } from 'jsonc-parser';

export type Schema =
  | Primitive
  | ArraySchema
  | EnumSchema
  | MapSchema
  | ObjectSchema 
  | RangeSchema
  | StringLiteralSchema;

export type Primitive = 'string' | 'number' | 'boolean';

export interface ArraySchema {
  type: 'array';
  elementSchema: 'string' | 'number' | ObjectSchema;
}

export interface EnumSchema {
  type: 'enum';
  valueSchema: 'string' | 'number';
  enumValues: Array<{
    name: string;
    enumValue: number | string;
  }>;
}

export interface MapSchema {
  type: 'map';
  mapKey: {
    name: string;
    schema: 'string';
  };
  mapValue: {
    name: string;
    schema: 'string' | 'number';
  };
}

export interface RangeSchema {
  type: 'range'; 
  valueSchema: 'string'; 
  rangeValues: {
    lowvalue: number; 
    highvalue: number; 
 };
}

export interface StringLiteralSchema {
  type: 'stringLiteral';
  valueSchema: 'string'
  value: string; 
}

export type ObjectSchema = GenericObject<Schema>;

export interface GenericObject<T> {
  type: 'object';
  fields: Array<Property<T>>;
}

export interface Property<T> {
  name: string;
  schema: T;
}

export const ObjectSchema: D.Decoder<unknown, ObjectSchema> = D.lazy('ObjectSchema', () =>
  D.struct({
    type: D.literal('object'),
    fields: D.array(
      D.struct({
        name: D.string,
        schema: Schema,
      }),
    ),
  }),
);

export const StringSchema: D.Decoder<unknown, 'string'> = D.literal('string');

export const IntegerSchema: D.Decoder<unknown, 'number'> = pipe(
  D.string,
  D.parse((s) => (s === 'integer' ? D.success('number') : D.failure(s, 'integer'))),
);

export const BooleanSchema: D.Decoder<unknown, 'boolean'> = D.literal('boolean');

export const ArraySchema: D.Decoder<unknown, ArraySchema> = D.struct({
  type: D.literal('array'),
  elementSchema: D.union(StringSchema, IntegerSchema, ObjectSchema),
});

export const EnumSchema: D.Decoder<unknown, EnumSchema> = D.struct({
  type: D.literal('enum'),
  valueSchema: D.union(StringSchema, IntegerSchema),
  enumValues: D.array(
    D.struct({
      name: D.string,
      enumValue: D.union(D.string, D.number),
    }),
  ),
});

export const MapSchema: D.Decoder<unknown, MapSchema> = D.struct({
  type: D.literal('map'),
  mapKey: D.struct({
    name: D.string,
    schema: StringSchema,
  }),
  mapValue: D.struct({
    name: D.string,
    schema: D.union(StringSchema, IntegerSchema),
  }),
});

export const RangeSchema: D.Decoder<unknown, RangeSchema> = D.struct({
  type: D.literal('range'),
  valueSchema: StringSchema, 
  rangeValues: D.struct({
    lowvalue: D.number, 
    highvalue: D.number, 
  }),
});

export const StringLiteralSchema: D.Decoder<unknown, StringLiteralSchema> = D.struct({
  type: D.literal('stringLiteral'),
  valueSchema: StringSchema,
  value: D.string, 
});

export const Schema: D.Decoder<unknown, Schema> = D.union(
  StringSchema,
  IntegerSchema,
  BooleanSchema,
  ArraySchema,
  EnumSchema,
  MapSchema,
  ObjectSchema,
  RangeSchema,
  StringLiteralSchema
);

export function isString(schema: Schema | undefined): schema is 'string' {
  return (schema !== undefined) && (schema === 'string');
}

export function isNumber(schema: Schema | undefined): schema is 'number' {
  return (schema !== undefined) && (schema === 'number');
}

export function isBoolean(schema: Schema | undefined): schema is 'boolean' {
  return (schema !== undefined) && (schema === 'boolean');
}

export function isArray(schema: Schema | undefined): schema is ArraySchema {
  return (schema !== undefined) && ((schema as ArraySchema).type === 'array');
}

export function isEnum(schema: Schema | undefined): schema is EnumSchema {
  return (schema !== undefined) && ((schema as EnumSchema).type === 'enum');
}

export function isMap(schema: Schema | undefined): schema is MapSchema {
  return (schema !== undefined) && ((schema as MapSchema).type === 'map');
}

export function isObject(schema: Schema | undefined): schema is ObjectSchema {
  return (schema !== undefined) && ((schema as ObjectSchema).type === 'object');
}

export function isPrimitive(schema: Schema | undefined): schema is Primitive {
  return (schema !== undefined) && isString(schema) || isNumber(schema) || isBoolean(schema);
}
export function isRange(schema: Schema | undefined): schema is RangeSchema {
  return (schema !== undefined) && ((schema as RangeSchema).type === 'range');
}
export function isStringLiteral(schema: Schema | undefined): schema is StringLiteralSchema {
  return (schema !== undefined) && ((schema as StringLiteralSchema).type === 'stringLiteral');
}

export function getType(schema: Schema): string {
  if (isPrimitive(schema)) {
    return schema;
  }

  if (isArray(schema)) {
    return 'array';
  }

  if (isEnum(schema)) {
    return `enum<${schema.valueSchema}>`;
  }

  if (isMap(schema)) {
    return 'map';
  }

  if (isObject(schema)) {
    return 'object';
  }
  if (isRange(schema) || isStringLiteral(schema)) {
    return 'string';
  }
  return 'unknown';
}

export function getEnumValues(schema: EnumSchema): string[] {
  if (schema.valueSchema === 'number') {
    return schema.enumValues.map((v) => `${v.enumValue}`);
  } else {
    return schema.enumValues.map((v) => `'${v.enumValue}'`);
  }
}

export abstract class Visitor<Context> {
  public visitNode(node: Node, context?: Context): void {
    switch (node?.type) {
      case 'string':
        this.onString(node, context);
        break;
      case 'number':
        this.onNumber(node, context);
        break;
      case 'boolean':
        this.onBoolean(node, context);
        break;
      case 'array':
        this.onArray(node, context);
        break;
      case 'object':
        this.onObject(node, context);
        break;
      case 'property':
        this.onProperty(node, context);
        break;
      case 'null':
        this.onNull(node, context);
        break;
      default:
        throw new Error(`Unknown node type: ${node?.type}`);
    }
  }

  public abstract onString(node: Node, context?: Context): void;
  public abstract onNumber(node: Node, context?: Context): void;
  public abstract onBoolean(node: Node, context?: Context): void;
  public abstract onNull(node: Node, context?: Context): void;
  public abstract onArray(node: Node, context?: Context): void;
  public abstract onObject(node: Node, context?: Context): void;
  public abstract onProperty(node: Node, context?: Context): void;
}

export function findSchemaAtLocation(schema: Schema, path: JSONPath): Schema | undefined {
  let current: Schema | undefined = schema;

  for (const segment of path) {
    if (current === undefined) {
      break;
    }

    if (isObject(current) && (typeof segment === 'string')) {
      current = current.fields.find(({ name }) => name === segment)?.schema;
    } else if (isArray(current) && (typeof segment === 'number')) {
      current = current.elementSchema;
    } else if (isMap(current) && (typeof segment === 'string')) {
      current = current.mapValue.schema;
    } else {
      current = undefined;
    }
  }

  return current;
}
