/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import * as assert from 'assert';
import { getUri, open } from './helper';

suite('Should do completion', () => {
  test('Completes the component names', async () => {
    const docUri = getUri('completions/osconfig_desired_component.json');
    await testCompletion(docUri, new vscode.Position(1, 5), {
      items: [
        { label: 'component1', kind: vscode.CompletionItemKind.Property },
        { label: 'component2', kind: vscode.CompletionItemKind.Property },
      ]
    });
  });

  test('Completes the object names for a component', async () => {
    const docUri = getUri('completions/osconfig_desired_object.json');
    await testCompletion(docUri, new vscode.Position(2, 9), {
      items: [
        { label: 'object1', kind: vscode.CompletionItemKind.Property },
        { label: 'object2', kind: vscode.CompletionItemKind.Property },
        { label: 'object3', kind: vscode.CompletionItemKind.Property },
        { label: 'object4', kind: vscode.CompletionItemKind.Property },
        { label: 'object5', kind: vscode.CompletionItemKind.Property },
        { label: 'object6', kind: vscode.CompletionItemKind.Property },
        { label: 'object7', kind: vscode.CompletionItemKind.Property },
        { label: 'object8', kind: vscode.CompletionItemKind.Property },
      ]
    });
  });

  test('Completes the object properties component.object', async () => {
    const docUri = getUri('completions/osconfig_desired_property.json');
    await testCompletion(docUri, new vscode.Position(3, 13), {
      items: [
        { label: 'object1.1', kind: vscode.CompletionItemKind.Property },
        { label: 'object1.2', kind: vscode.CompletionItemKind.Property },
        { label: 'object1.3', kind: vscode.CompletionItemKind.Property },
      ]
    });
  });

  test('Completes string enum values', async () => {
    const docUri = getUri('completions/osconfig_desired_enum.json');
    await testCompletion(docUri, new vscode.Position(2, 20), {
      items: [
        { label: 'enum-1', kind: vscode.CompletionItemKind.Value },
        { label: 'enum-2', kind: vscode.CompletionItemKind.Value },
      ]
    });
  });

  test('Completes integer enum values', async () => {
    const docUri = getUri('completions/osconfig_desired_enum.json');
    await testCompletion(docUri, new vscode.Position(3, 19), {
      items: [
        { label: '1', kind: vscode.CompletionItemKind.Value },
        { label: '2', kind: vscode.CompletionItemKind.Value },
      ]
    });
  });
});

async function testCompletion(
  docUri: vscode.Uri,
  position: vscode.Position,
  expectedCompletionList: vscode.CompletionList
) {
  await open(docUri);

  // Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
  const actualCompletionList = (await vscode.commands.executeCommand(
    'vscode.executeCompletionItemProvider',
    docUri,
    position
  )) as vscode.CompletionList;

  assert.ok(actualCompletionList.items.length >= expectedCompletionList.items.length);

  expectedCompletionList.items.forEach((expectedItem) => {
    const actualItem = actualCompletionList.items.find(item => item.label === expectedItem.label);
    assert.ok(actualItem);
    assert.equal(actualItem?.kind, expectedItem.kind);
  });
}
