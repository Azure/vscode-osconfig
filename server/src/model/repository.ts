/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as fs from 'fs';
import * as path from 'path';
import { request } from '@octokit/request';

import {
  LocalSettings,
  ModelSettings,
  ObjectSchema,
  RemoteSettings,
  Schema,
  isObject
} from '../common';
import { parseModel } from './mim';

// GitHub repository content response schema
// https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
interface ContentTree {
  type: string;
  size: number;
  name: string;
  path: string;
  sha: string;
  url: string;
  git_url: string | null;
  html_url: string | null;
  download_url: string | null;
  entries?: {
    type: string;
    size: number;
    name: string;
    path: string;
    content?: string;
    sha: string;
    url: string;
    git_url: string | null;
    html_url: string | null;
    download_url: string | null;
    _links: {
      git: string | null;
      html: string | null;
      self: string;
      [k: string]: unknown;
    };
    [k: string]: unknown;
  }[];
  _links: {
    git: string | null;
    html: string | null;
    self: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

type FileMeta = ContentTree | string;

export abstract class Repository {
  private model?: ObjectSchema;

  public abstract load(): Promise<Schema | undefined>;

  public schema(): ObjectSchema | undefined {
    return this.model;
  }

  protected parse(content: string, meta: FileMeta) {
    const name = (typeof meta === 'string') ? meta : meta.name;

    try {
      const schema = parseModel(content);

      if (schema && isObject(schema)) {
        this.mergeSchema(schema);
      } else {
        console.error(`Invalid model JSON: ${name}`);
      }
    } catch (e) {
      console.error(`Failed to parse model JSON: ${name}`);
      console.error(e);
    }
  }

  private mergeSchema(schema: ObjectSchema) {
    if (this.model) {
      this.model.fields.push(...schema.fields);
    } else {
      this.model = schema;
    }
  }
}

export class GitHubRepository extends Repository {
  constructor(
    private readonly owner: string,
    private readonly repo: string,
    private readonly path: string,
    private readonly ref?: string,
  ) {
    super();
  }

  public async load(): Promise<Schema | undefined> {
    console.log(`Loading models from remote GitHub repository: ${this.owner}/${this.repo}/${this.path}@${this.ref}`);

    const res = await request(
      'GET /repos/{owner}/{repo}/contents/{path}{?ref}',
      {
        owner: this.owner,
        repo: this.repo,
        path: this.path,
        ref: this.ref,
      }
    );

    if (res.status === 200) {
      const jsonFiles = (res.data as ContentTree[]).filter(
        (file) => file.type === 'file' && file.name.toLowerCase().endsWith('.json')
      );

      for (const file of jsonFiles) {
        const res = await request('GET {url}', {
          url: file.download_url,
        });

        this.parse(res.data as string, file);
      }
    } else {
      console.log(`Failed to load models from remote GitHub repository (${this.owner}/${this.repo}/${this.path}@${this.ref}): ${res.status} ${res.data}`);
    }

    return this.schema();
  }
}

export class LocalRepository extends Repository {
  constructor(private path: string) {
    super();
  }

  public async load(): Promise<Schema | undefined> {
    console.log(`Loading models from local repository: ${this.path}`);

    const files = fs
      .readdirSync(this.path)
      .map((fileName) => path.join(this.path, fileName))
      .filter(
        (filePath) =>
          fs.lstatSync(filePath).isFile() && filePath.toLowerCase().endsWith('.json')
      );

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      this.parse(content, file);
    }

    return this.schema();
  }
}

export function createRemoteRepository(config: RemoteSettings): Repository {
  const { repository: name, ref, path } = config;
  const [owner, repo] = name.split('/');
  return new GitHubRepository(owner, repo, path, ref);
}

export function createLocalRepository(config: LocalSettings): Repository {
  return new LocalRepository(config.path);
}

async function tryLoad(repositories: Repository[]): Promise<Repository | undefined> {
  for (const repository of repositories) {
    const schema = await repository.load();
    if (schema) {
      return repository;
    }
  }
  return undefined;
}

export async function createRepository(config: ModelSettings): Promise<Repository | undefined> {
  const { priority, remote, local } = config;

  const remoteRepository = createRemoteRepository(remote);
  const localRepository = createLocalRepository(local);

  let primary: Repository;
  let secondary: Repository;

  switch (priority) {
    case 'local':
      primary = localRepository;
      secondary = remoteRepository;
      break;
    case 'remote':
      primary = remoteRepository;
      secondary = localRepository;
      break;
    default:
      return undefined;
  }

  return tryLoad([primary, secondary]);
}
