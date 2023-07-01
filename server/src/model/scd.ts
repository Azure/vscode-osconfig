/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as D from 'io-ts/Decoder';
import { fold } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';

import {
  ArraySchema,
  EnumSchema,
  Schema
} from '../common/schema';

interface Scd {
  scenarioConfigDefinition: ScdDefinition;
}

interface ScdDefinition {
  name: string;
  documents: Array<Document>;
}

interface Document {
  configurations: Array<Configuration>;
}

interface Configuration {
  name: string;
  version: string;
  schemaversion: string;
  context: string;
  settings: Array<Setting>;
}

interface Setting {
  name: string;
  defaultvalue: string,
  datatype: string;
}

const Setting: D.Decoder<unknown, Setting> = D.struct({
  name: D.string,
  defaultvalue: D.string,
  datatype: D.string,
});

const Configuration: D.Decoder<unknown, Configuration> = D.struct({
  name: D.string,
  version: D.string,
  schemaversion: D.string,
  context: D.string,
  settings: D.array(Setting),
});

const Document: D.Decoder<unknown, Document> = D.struct({
  configurations: D.array(Configuration),
});

const ScdDefinition: D.Decoder<unknown, ScdDefinition> = D.struct({
  name: D.string,
  documents: D.array(Document),
});

const Scd: D.Decoder<unknown, Scd> = D.struct({
  scenarioConfigDefinition: ScdDefinition,
});

//This function allows the EnumSchema interface to be leveraged to store the default value of a key. In the future, it may be beneficial to create a string schema type that can store a value. 
function stringLiteral(value: string): EnumSchema {
  return {
    type: 'enum',
    valueSchema: 'string',
    enumValues: [
      {
        name: '',
        enumValue: value,
      }
    ]
  };
}

function settingsToSchema(settings: Setting[]): Schema {
  return {
    type: 'object',
    fields: settings.map((component) => 
    {
      return {
        name: component.name,
        schema: stringLiteral(component.defaultvalue),
      };
    })
  };

}

function scenarioConfigurationToSchema(scenarioConfiguration: Configuration): ArraySchema {
  return {
    type: 'array',
    elementSchema:
    {
      type: 'object',
      fields: [
        {
          name: 'name',
          schema: stringLiteral(scenarioConfiguration.name),
        },
        {
          name: 'schemaversion',
          schema: stringLiteral(scenarioConfiguration.schemaversion),
        },
        {
          name: 'action',
          schema: 'string',
        },
        {
          name: scenarioConfiguration.name,
          schema: settingsToSchema(scenarioConfiguration.settings),
        }
      ]
    }
  };
}


function docConfigurationToSchema(configuration: Configuration): Schema {
  return {
    type: 'object',
    fields: [
      {
        name: 'schemaversion',
        schema: stringLiteral(configuration.schemaversion),
      },
      {
        name: 'id',
        schema: 'string',
      },
      {
        name: 'version',
        schema: stringLiteral(configuration.version),
      },
      {
        name: 'context',
        schema: stringLiteral(configuration.context),
      },
      {
        name: 'scenario',
        schema: stringLiteral(configuration.name),
      },
    ]
  };
}

function osConfigToSchema(osConfig: Configuration): Schema {
  return {
    type: 'object',
    fields: [
      {
        name: 'Document',
        schema: docConfigurationToSchema(osConfig),
      },
      {
        name: 'Scenario',
        schema: scenarioConfigurationToSchema(osConfig),
      }
    ]
  };
}


function scdToSchema(scd: Scd): Schema {
  return {
    type: 'object',
    fields: [{
      name: 'OsConfiguration',
      schema: osConfigToSchema(scd.scenarioConfigDefinition.documents[0].configurations[0]),
    }
    ]
  };
}

export function parseModel(content: string): Schema | undefined {
  return pipe(
    Scd.decode(JSON.parse(content)),
    fold(
      (errors) => { throw new Error(D.draw(errors)); },
      (model) => scdToSchema(model)
    ),
  );
}

