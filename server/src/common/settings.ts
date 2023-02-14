/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

export interface Settings {
  model: ModelSettings;
}

export interface ModelSettings {
  priority: Priority;
  local: LocalSettings;
  remote: RemoteSettings;
}

export type Priority = 'local' | 'remote';

export interface LocalSettings {
  path: string;
}

export interface RemoteSettings {
  repository: string;
  ref: string;
  path: string;
}
