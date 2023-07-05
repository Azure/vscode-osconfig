/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
  InsertTextMode,
  MarkupKind,
  Position,
  TextEdit
} from 'vscode-languageserver';

import * as D from 'io-ts/Decoder';
import { Location } from 'jsonc-parser';
import { fold } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';

import {
  Schema,
  getType,
  isArray,
  isBoolean,
  isEnum,
  isMap,
  isNumber,
  isObject,
  isPrimitive,
  isString
} from '../common/schema';

interface Mim {
  name: string;
  type: 'mimModel';
  contents: Array<MimComponent>;
}

interface MimComponent {
  name: string;
  type: 'mimComponent';
  contents: Array<MimObject>;
}

interface MimObject {
  name: string;
  type: 'mimObject';
  desired: boolean;
  schema: Schema;
}

const MimObject: D.Decoder<unknown, MimObject> = D.struct({
  name: D.string,
  type: D.literal('mimObject'),
  desired: D.boolean,
  schema: Schema,
});

const MimComponent: D.Decoder<unknown, MimComponent> = D.struct({
  name: D.string,
  type: D.literal('mimComponent'),
  contents: D.array(MimObject),
});

const Mim: D.Decoder<unknown, Mim> = D.struct({
  name: D.string,
  type: D.literal('mimModel'),
  contents: D.array(MimComponent),
});

function componentToSchema(component: MimComponent): Schema {
  const desired = component.contents.filter((object) => object.desired);
  return {
    type: 'object',
    fields: desired.map((object) => 
    {
      return {
        name: object.name,
        schema: object.schema,
      };
    }),
  };
}

function modelToSchema(model: Mim): Schema {
  return {
    type: 'object',
    fields: model.contents.map((component) => 
    {
      return {
        name: component.name,
        schema: componentToSchema(component),
      };
    }),
  };
}

export function parseModel(content: string): Schema | undefined {
  return pipe(
    Mim.decode(JSON.parse(content)),
    fold(
      (errors) => { throw new Error(D.draw(errors)); },
      (model) => modelToSchema(model)
    ),
  );
}

export function getDocumentation(schema: Schema, location: Location): string {
  let documentation = '';

  const horizontalRule = '\n---\n';
  const codeBlock = '\n```\n';

  if (location.isAtPropertyKey) {
    documentation += codeBlock;

    if (location.path.length === 1) {
      documentation += '(Component)';
    } else if (location.path.length === 2) {
      documentation += '(Object)';
    } else {
      documentation += `(${getType(schema)})`;
    }

    documentation += codeBlock;
    documentation += horizontalRule;

    if (!isPrimitive(schema) && location.path.length > 1) {
      documentation += codeBlock;
      documentation += `${JSON.stringify(schema, undefined, 2)}`;
      documentation += codeBlock;
    }
  } else {
    if (isEnum(schema)) {
      const values = schema.enumValues.map((value) => {
        return (schema.valueSchema === 'string') ? `- \`${value.enumValue}\`` : `- \`${value.enumValue}\` - *${value.name}*`;
      }).join('\n');
      documentation += values;
    }
  }

  return documentation;
}

function createCompletion(label: string, kind: CompletionItemKind, documentation?: string, detail?: string): CompletionItem {
  const completion = CompletionItem.create(label);

  completion.label = label;
  completion.detail = detail;

  if (documentation) {
    completion.documentation = {
      kind: MarkupKind.Markdown,
      value: documentation,
    };
  }

  completion.kind = kind;

  return completion;
}

function createSnippetCompletion(label: string, snippet: string, position: Position, documentation?: string, detail?: string): CompletionItem {
  const completion = CompletionItem.create(label);

  completion.label = label;
  completion.detail = detail;

  if (documentation) {
    completion.documentation = {
      kind: MarkupKind.Markdown,
      value: documentation,
    };
  }

  completion.kind = CompletionItemKind.Snippet;
  completion.insertTextFormat = InsertTextFormat.Snippet;
  completion.insertTextMode = InsertTextMode.adjustIndentation;

  completion.textEdit = TextEdit.insert(position, snippet);

  return completion;
}

function createTabStop(tab: number, choices?: string[]): string {
  return (choices && choices.length > 0) ? `\${${tab}|${choices.join(',')}|}` : `$${tab}`;
}

interface SnippetContext {
  tab: number;
}

function createSnippetText(schema: Schema, context: SnippetContext = { tab: 1 }, depth = 0): string {
  let snippet = '';
  const indent = `${'\t'.repeat(depth)}`;

  if (isString(schema)) {
    snippet += `"${createTabStop(context.tab)}"`;
  } else if (isNumber(schema)) {
    snippet += `${createTabStop(context.tab)}`;
  } else if (isBoolean(schema)) {
    snippet += `${createTabStop(context.tab, ['true', 'false'])}`;
  } else if (isArray(schema)) {
    context.tab++;
    snippet += '[\n';
    snippet += `${indent}\t${createSnippetText(schema.elementSchema, context, depth + 1)}\n`;
    snippet += `${indent}]`;
  } else if (isObject(schema)) {
    const fields = schema.fields.map((field) => {
      context.tab++;
      return `${indent}\t"${field.name}": ${createSnippetText(field.schema, context, depth + 1)}`;
    });
    snippet += '{\n';
    snippet += `${fields.join(',\n')}\n`;
    snippet += `${indent}}`;
  } else if (isEnum(schema)) {
    const choices = schema.enumValues.map((value) => (schema.valueSchema === 'string') ? `"${value.enumValue}"` : `${value.enumValue}`);
    snippet += createTabStop(context.tab, choices);
  } else if (isMap(schema)) {
    context.tab += 2;
    snippet += '{\n';
    snippet += `${indent}\t"${createTabStop(context.tab - 1)}": ${createSnippetText(schema.mapValue.schema, context, depth + 1)}\n`;
    snippet += `${indent}}`;
  }

  return snippet;
}

export function getCompletions(schema: Schema, location: Location, position: Position): CompletionItem[] {
  const completionItems: CompletionItem[] = [];

  if (location.isAtPropertyKey && isObject(schema)) {
    schema.fields.forEach((field) => {
      let completion: CompletionItem;
      const documentation = getDocumentation(field.schema, location);

      if (location.previousNode) {
        completion = createCompletion(field.name, CompletionItemKind.Property, documentation);
      } else {
        const snippet = `"${field.name}": ${createSnippetText(field.schema)}`;
        completion = createSnippetCompletion(field.name, snippet, position, documentation);
      }

      completionItems.push(completion);
    });
  } else if (!location.isAtPropertyKey && isObject(schema)) {
    const property = location.path[location.path.length - 1];
    const propertySchema = schema.fields.find((field) => field.name === property)?.schema;

    if (isEnum(propertySchema)) {
      propertySchema.enumValues.forEach((value) => {
        const completion = createCompletion(value.enumValue.toString(), CompletionItemKind.Value);
        completionItems.push(completion);
      });
    }
  }

  return completionItems;
}
