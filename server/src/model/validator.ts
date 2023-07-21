/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { Node, parseTree } from 'jsonc-parser';

import { Schema, Visitor, getEnumValues, getType, isArray, isEnum, isMap, isObject, isRange, isStringLiteral } from '../common';

export class Validator extends Visitor<Schema> {
  private diagnostics: Diagnostic[] = [];

  constructor(private readonly document: TextDocument) {
    super();
  }

  public validate(schema: Schema): Diagnostic[] {
    const root = parseTree(this.document.getText(), undefined, {
      allowTrailingComma: true,
      disallowComments: false,
    });

    if (root && schema) {
      this.visitNode(root, schema);
    }

    return this.diagnostics;
  }

  private diagnostic(message: string, node: Node, severity: DiagnosticSeverity = DiagnosticSeverity.Error) {
    let { offset, length } = node;

    if (node.type === 'string') {
      offset += 1;
      length -= 2;
    }

    const start = this.document.positionAt(offset);
    const end = this.document.positionAt(offset + length);

    this.diagnostics.push({
      message,
      range: {
        start,
        end
      },
      severity
    });
  }

  private validatePrimitive(node: Node, schema: Schema) {
    if (isEnum(schema)) {
      if (node.type === schema.valueSchema) {
        const enumValue = schema.enumValues.find(({ enumValue }) => enumValue === node.value);
        if (!enumValue) {
          this.diagnostic(`Invalid value '${node.value}'.`, node);
          this.diagnostic(`Must be one of: ${getEnumValues(schema).join(' | ')}`, node);
        }
      } else {
        this.diagnostic(`Invalid type '${node.type}', expected 'enum<${getType(schema.valueSchema)}>'.`, node);
      }
    } else if (isRange(schema))
    {
      if(node.type === schema.valueSchema)
      {
        if(!(schema.rangeValues.lowvalue <= node.value && schema.rangeValues.highvalue >=  node.value))
        {
          this.diagnostic(`Invalid value '${node.value}', expected value between ${schema.rangeValues.lowvalue} and ${schema.rangeValues.highvalue}.`, node);
        }
      }
      else {
        this.diagnostic(`Invalid type '${node.type}', expected 'type<${getType(schema.valueSchema)}>'.`, node);
      }
    } else if(isStringLiteral(schema)) {
      if(node.type === schema.valueSchema)
      {
        if(node.value !== schema.value) {
          this.diagnostic(`Invalid value '${node.value}'.`, node);
          this.diagnostic(`Must be "${schema.value}"`, node); 
        }
      } else {
        this.diagnostic(`Invalid type '${node.type}', expected 'type<${getType(schema.valueSchema)}>'.`, node);
      }
    } else if (node.type !== schema) {
      this.diagnostic(`Invalid type '${node.type}', expected '${getType(schema)}'.`, node);
    }
  }

  public onString(node: Node, schema: Schema) {
    this.validatePrimitive(node, schema);
  }

  public onNumber(node: Node, schema: Schema) {
    this.validatePrimitive(node, schema);
  }

  public onBoolean(node: Node, schema: Schema) {
    this.validatePrimitive(node, schema);
  }

  public onArray(node: Node, schema: Schema) {
    if (isArray(schema)) {
      node.children?.forEach((node) => this.visitNode(node, schema.elementSchema));
    } else {
      this.diagnostic(`Schema '${node.type}' is not assignable to type '${getType(schema)}'.`, node);
    }
  }

  public onObject(node: Node, schema: Schema) {
    if (isObject(schema)) {
      node.children?.forEach((node) => this.visitNode(node, schema));
    } else if (isMap(schema)) {
      node.children?.forEach((node) => {
        const value = node.children?.[1];
        if (value) {
          this.visitNode(value, schema.mapValue.schema);
        }
      });
    } else {
      this.diagnostic(`Schema '${node.type}' is not assignable to type '${getType(schema)}'.`, node);
    }
  }

  public onProperty(node: Node, schema: Schema) {
    if (isObject(schema)) {
      const key = node.children?.[0];
      const value = node.children?.[1];

      if (key?.value) {
        const field = schema.fields.find(({ name }) => name === key.value);
        if (!field) {
          this.diagnostic(`Invalid property '${key.value}'`, node);
        } else if (value) {
          this.visitNode(value, field.schema);
        }
      }
    }
  }

  public onNull(node: Node) {
    this.diagnostic(`Invalid type '${node.type}'`, node);
  }
}
