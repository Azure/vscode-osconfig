/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
  CompletionItem,
  DidChangeConfigurationNotification,
  Hover,
  InitializeParams,
  InitializeResult,
  MarkupKind,
  ProposedFeatures,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  TextDocuments,
  createConnection,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { getLocation } from 'jsonc-parser';
import { isEqual } from 'lodash';

import { ModelSettings, Schema, findSchemaAtLocation, isObject } from './common';
import { Repository, Validator, createRepository, getCompletions, getDocumentation } from './model';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

let settings: ModelSettings;
let repository: Repository | undefined;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
      },
      hoverProvider: true,
    },
  };

  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }

  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined
    );
  }
});

connection.onDidChangeConfiguration(() => documents.all().forEach(validateDocument));

documents.onDidChangeContent(({ document }) => validateDocument(document));

async function validateDocument(document: TextDocument): Promise<void> {
  const newSettings = await connection.workspace.getConfiguration({
    section: 'osconfig.model'
  }) as ModelSettings;


  if (!repository || !isEqual(settings, newSettings)) {
    settings = newSettings;
    repository = await createRepository(settings);
  }

  if (repository) {
    const schema = repository.schema() as Schema;
    const validator = new Validator(document);
    const diagnostics = validator.validate(schema);
    connection.sendDiagnostics({ uri: document.uri, diagnostics });
  }
}

connection.onHover((textDocumentPosition: TextDocumentPositionParams): Hover | undefined | null => {
  let hover: Hover | undefined = undefined;
  const schema = repository?.schema();

  if (schema && isObject(schema)) {
    const uri = textDocumentPosition.textDocument.uri;
    const document = documents.get(uri);

    if (document) {
      const location = getLocation(document.getText(), document.offsetAt(textDocumentPosition.position));
      const target = findSchemaAtLocation(schema, location.path);

      if (target) {
        const documentation = getDocumentation(target, location);

        hover = {
          contents: {
            kind: MarkupKind.Markdown,
            value: documentation
          }
        };
      }
    } else {
      console.log(`Unable to find text document: ${uri}`);
    }
  }

  return hover;
});

connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
  const completions: CompletionItem[] = [];
  const schema = repository?.schema();

  if (schema && isObject(schema)) {
    const uri = textDocumentPosition.textDocument.uri;
    const document = documents.get(uri);

    if (document) {
      const location = getLocation(document.getText(), document.offsetAt(textDocumentPosition.position));

      if (location.path.length > 0) {
        const path = location.path.slice(0, -1);
        const target = findSchemaAtLocation(schema, path);

        if (target) {
          const position = textDocumentPosition.position;

          if (!location.previousNode) {
            const line = document.getText({
              start: { line: position.line, character: 0 },
              end: position
            });
            const indent = line.match(/^\s*/)?.[0].length ?? 0;

            position.character -= (line.length - indent);
          }

          const items = getCompletions(target, location, position);
          completions.push(...items);
        }
      }
    }
  }

  return completions;
});

connection.onCompletionResolve((item: CompletionItem): CompletionItem => item);

documents.listen(connection);
connection.listen();
