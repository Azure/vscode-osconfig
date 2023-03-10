/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import * as vscode from 'vscode';

export let doc: vscode.TextDocument;
export let editor: vscode.TextEditor;
export let documentEol: string;
export let platformEol: string;

export async function activate() {
  // The extensionId is `<publisher>.<name>` from package.json
  const ext = vscode.extensions.getExtension('edge-security.osconfig');
  await ext.activate();

  // Wait for language server activation
  await sleep(2000);
}

export async function open(docUri: vscode.Uri) {
  try {
    doc = await vscode.workspace.openTextDocument(docUri);
    editor = await vscode.window.showTextDocument(doc);

    // Wait for language server to load the document
    await sleep(500);
  } catch (e) {
    console.error(e);
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const getPath = (p: string) => {
  return path.resolve(__dirname, '../../test-fixture', p);
};

export const getUri = (p: string) => {
  return vscode.Uri.file(getPath(p));
};

export async function setTestContent(content: string): Promise<boolean> {
  const all = new vscode.Range(
    doc.positionAt(0),
    doc.positionAt(doc.getText().length)
  );
  return editor.edit(eb => eb.replace(all, content));
}
