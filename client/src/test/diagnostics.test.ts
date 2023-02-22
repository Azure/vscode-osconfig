/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import * as assert from 'assert';
import { getUri, open } from './helper';

suite('Should show diagnostics', () => {
  test('Valid document', async () => {
    const docUri = getUri('diagnostics/valid.desired.json');
    await testDiagnostics(docUri, []);
  });

  test('Invalid component name', async () => {
    const docUri = getUri('diagnostics/invalid-component.desired.json');
    await testDiagnostics(docUri, [
      {
        severity: vscode.DiagnosticSeverity.Error,
        message: 'Invalid property \'invalid\'',
        range: toRange(1, 4, 3, 5),
      }
    ]);
  });

  test('Invalid object name', async () => {
    const docUri = getUri('diagnostics/invalid-object.desired.json');
    await testDiagnostics(docUri, [
      {
        severity: vscode.DiagnosticSeverity.Error,
        message: 'Invalid property \'invalid\'',
        range: toRange(2, 8, 2, 27),
      }
    ]);
  });

  test('Invalid object property', async () => {
    const docUri = getUri('diagnostics/invalid-property.desired.json');
    await testDiagnostics(docUri, [
      {
        severity: vscode.DiagnosticSeverity.Error,
        message: 'Invalid property \'invalid\'',
        range: toRange(4, 16, 4, 35),
      },
      {
        severity: vscode.DiagnosticSeverity.Error,
        message: 'Invalid property \'invalid\'',
        range: toRange(10, 12, 10, 31),
      }
    ]);
  });

  test('Invalid string value', async () => {
    const docUri = getUri('diagnostics/invalid-string.desired.json');
    await testDiagnostics(docUri, [
      {
        severity: vscode.DiagnosticSeverity.Error,
        message: 'Invalid type \'number\', expected \'string\'.',
        range: toRange(2, 19, 2, 22),
      }
    ]);
  });

  test('Invalid integer value', async () => {
    const docUri = getUri('diagnostics/invalid-integer.desired.json');
    await testDiagnostics(docUri, [
      {
        severity: vscode.DiagnosticSeverity.Error,
        message: 'Invalid type \'string\', expected \'number\'.',
        range: toRange(2, 20, 2, 26),
      }
    ]);
  });

  test('Invalid boolean value', async () => {
    const docUri = getUri('diagnostics/invalid-boolean.desired.json');
    await testDiagnostics(docUri, [
      {
        severity: vscode.DiagnosticSeverity.Error,
        message: 'Invalid type \'number\', expected \'boolean\'.',
        range: toRange(2, 19, 2, 22),
      }
    ]);
  });

  test('Invalid enum value', async () => {
    const docUri = getUri('diagnostics/invalid-enum.desired.json');
    await testDiagnostics(docUri, [
      {
        severity: vscode.DiagnosticSeverity.Error,
        message: 'Invalid value \'invalid\'.',
        range: toRange(2, 20, 2, 27),
      },
      {
        severity: vscode.DiagnosticSeverity.Error,
        message: 'Must be one of: \'enum-1\' | \'enum-2\'',
        range: toRange(2, 20, 2, 27),
      },
      {
        severity: vscode.DiagnosticSeverity.Error,
        message: 'Invalid value \'-1\'.',
        range: toRange(3, 19, 3, 21),
      },
      {
        severity: vscode.DiagnosticSeverity.Error,
        message: 'Must be one of: 1 | 2',
        range: toRange(3, 19, 3, 21),
      }
    ]);
  });

  test('Invalid array', async () => {
    const docUri = getUri('diagnostics/invalid-array.desired.json');
    await testDiagnostics(docUri, [
      {
        severity: vscode.DiagnosticSeverity.Error,
        message: 'Invalid type \'number\', expected \'string\'.',
        range: toRange(3, 12, 3, 13),
      },
      {
        severity: vscode.DiagnosticSeverity.Error,
        message: 'Invalid type \'string\', expected \'number\'.',
        range: toRange(6, 13, 6, 14),
      },
      {
        severity: vscode.DiagnosticSeverity.Error,
        message: 'Invalid property \'invalid\'',
        range: toRange(10, 16, 10, 36),
      }
    ]);
  });
});

function toRange(sLine: number, sChar: number, eLine: number, eChar: number) {
  const start = new vscode.Position(sLine, sChar);
  const end = new vscode.Position(eLine, eChar);
  return new vscode.Range(start, end);
}

async function testDiagnostics(docUri: vscode.Uri, expectedDiagnostics: vscode.Diagnostic[]) {
  await open(docUri);

  const actualDiagnostics = vscode.languages.getDiagnostics(docUri);
  assert.equal(actualDiagnostics.length, expectedDiagnostics.length);

  expectedDiagnostics.forEach((expectedDiagnostic, i) => {
    const actualDiagnostic = actualDiagnostics[i];
    assert.equal(actualDiagnostic.message, expectedDiagnostic.message);
    assert.deepEqual(actualDiagnostic.range, expectedDiagnostic.range);
    assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity);
  });
}
