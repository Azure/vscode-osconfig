/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { activate, getPath } from './helper';

setup(async () => {
  await activate();

  // Configure the extension settings to use local test models
  const modelPath = getPath('models');
  const settings = await vscode.workspace.getConfiguration('osconfig');
  await settings.update('model.local.path', modelPath);
  await settings.update('model.priority', 'local');
});
