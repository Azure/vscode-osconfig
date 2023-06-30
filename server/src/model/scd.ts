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
    documents: Array<ScdConfiguration>;
  }

  interface ScdConfiguration {
    configurations: Array<ConfigurationDefinition>;
  }

  interface ConfigurationDefinition{
    name: string; 
    version: string; 
    schemaversion: string; 
    context: string; 
    settings: Array<ScdSetting>; 
  }

  interface ScdSetting {
    name: string; 
    defaultvalue: string, 
    datatype: string; 
 }
 
const ScdSetting: D.Decoder<unknown, ScdSetting> = D.struct({
  name: D.string, 
  defaultvalue: D.string, 
  datatype: D.string, 
});

const ConfigurationComponent: D.Decoder<unknown, ConfigurationDefinition> = D.struct({
  name: D.string, 
  version: D.string, 
  schemaversion: D.string, 
  context: D.string, 
  settings: D.array(ScdSetting),
});
  
const ScdConfiguration: D.Decoder<unknown, ScdConfiguration> = D.struct({
  configurations: D.array(ConfigurationComponent),
});

const ScdComponents: D.Decoder<unknown, ScdDefinition> = D.struct({
  name: D.string, 
  documents: D.array(ScdConfiguration),
});
  
const Scd: D.Decoder<unknown, Scd> = D.struct({
  scenarioConfigDefinition: ScdComponents, 
});

function stringLiteral(value: string): EnumSchema
{
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

function settingsToSchema(scd: Scd): Schema {
  return {
    type: 'object', 
    fields: scd.scenarioConfigDefinition.documents[0].configurations[0].settings.map((component) => {
      return {
        name: component.name,
        schema: stringLiteral(component.defaultvalue),
      };
    })
  };
  
}
    
function scenarioToSchema(scd: Scd): ArraySchema 
{
  return {
    type: 'array',
    elementSchema: 
      {
        type: 'object', 
        fields: [
          {
            name: 'name', 
            schema: stringLiteral(scd.scenarioConfigDefinition.documents[0].configurations[0].name),
          },
          {
            name: 'schemaversion',
            schema: stringLiteral(scd.scenarioConfigDefinition.documents[0].configurations[0].schemaversion),
          },
          {
            name: 'action', 
            schema: 'string',
          },
          {
            name: scd.scenarioConfigDefinition.documents[0].configurations[0].name, 
            schema: settingsToSchema(scd),
          }
        ]
      }
  };
}


function documentToSchema(configuration: Scd): Schema {
  return {
    type: 'object', 
    fields: [
      {
        name: 'schemaversion', 
        schema: stringLiteral(configuration.scenarioConfigDefinition.documents[0].configurations[0].schemaversion),
      },
      {
        name: 'id',
        schema: 'string', 
      },
      {
        name: 'version', 
        schema: stringLiteral(configuration.scenarioConfigDefinition.documents[0].configurations[0].version),
      },
      {
        name: 'context', 
        schema: stringLiteral(configuration.scenarioConfigDefinition.documents[0].configurations[0].context),
      },
      {
        name: 'scenario', 
        schema: stringLiteral(configuration.scenarioConfigDefinition.documents[0].configurations[0].name),
      },
    ]
  };
}
  
function osConfigToSchema(scd: Scd): Schema {
  return {
    type: 'object', 
    fields: [
      {
        name: 'Document', 
        schema: documentToSchema(scd),
      },
      {
        name: 'Scenario',
        schema: scenarioToSchema(scd) , 
      }
    ]
  };
}
  

function dcToSchema(model: Scd): Schema {
  return {
    type: 'object', 
    fields: [ {
      name: 'OsConfiguration', 
      schema: osConfigToSchema(model),
    } 
    ]
  };
  
}
  
export function parseModel(content: string): Schema | undefined {
  return pipe(
    Scd.decode(JSON.parse(content)),
    fold(
      (errors) => { throw new Error(D.draw(errors)); },
      (model) => dcToSchema(model)
    ),
  );
}

