import * as path from 'path';
import * as vscode from 'vscode';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
  const serverModule = context.asAbsolutePath(
    path.join('dist', 'server', 'src', 'server.js')
  );

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: {
        execArgv: ['--nolazy', '--inspect=6009'],
      },
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{
      scheme: 'file',
      language: 'json',
      pattern: '**/osconfig_desired*.json'
    }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc'),
    },
  };

  client = new LanguageClient(
    'desiredConfigurationLanguageServer',
    'DC Language Server',
    serverOptions,
    clientOptions
  );

  client.start(); 

  const endpoint = process.env['AZURE_OPENAI_ENDPOINT'];
  const azureApiKey = process.env['AZURE_OPENAI_KEY'];

  const systemMessage = 'You are an AI assistant that helps IT administrators generate JSON documents based on the related '+
	'settings that the user requests. You will never include any chat text in your response, just a JSON file only.';

  vscode.commands.registerCommand('intern-input-test.DCGenerator', async () => {
    const userInput = await vscode.window.showInputBox({
      placeHolder: 'Enter setting here',
      prompt: 'Enter in desired configuration setting for DC document (Ex: Network Access)'
    });

    if (userInput === undefined) {
      vscode.window.showErrorMessage('Not a valid input');
      return;
    }
    else if (userInput === '') {
      vscode.window.showErrorMessage('Setting configuation is required to execute this action');
    }
    else {
      vscode.window.showInformationMessage('Generating DC Doc with: ' + userInput);
      const userMessage = 'You will need to generate a new desired configuration JSON document based on the information present in the included list. ' +
				'The desired configuration JSON will have an "OsConfiguration" object, with a "Document" Object and a "Scenario" array ' +
				'inside of it. The "Document" object is composed of a "schemaversion", "id", "version", "context", and "scenario" variable. ' +
				'The default values for these variables are included in the document. The "Scenario" array is composed of an object that has ' +
				'a "name" variable, a "schemaversion" variable, a "action" variable, and an object that has the same name as the configuration scenario. ' +
				'This object is composed of the relevant settings from the document I am giving you. Inside this object, you should only include ' +
				'the setting name and default value of settings that relate to ' + userInput + ' only. All values in the JSON should be in string format. ' +
				'Construct a JSON based on this information and the provided configuration information. Remember, you will never include any chat text in your response, just JSON data only. ' +
				'Also, you should only include settings that are related to ' + userInput + '. Do not include unrelated settings in the JSON. \n --- \n LIST \n ';

      const scdList: string = 'Configuration Scenario: ASHCIApplianceSecurityBaselineConfig; Schemaversion: 1.0; ID: 64789; version: 1.0; context: device. Action: set.   \n Settings: \n' +
				'1. Name: InteractiveLogon_RequireDomainControllerAuthenticationToUnlock, description: Interactive logon: Require Domain Controller authentication to unlock workstation, default value: 1; \n' +
				'2. Name: NetworkAccess_DoNotAllowStorageOfPasswordsAndCredentialsForNetworkAuthentication, description: Network access: Do not allow storage of passwords and credentials for network authentication, default value: 0; \n' +
				'3. Name: NetworkSecurity_AllowLocalSystemNULLSessionFallback, description: Network security: Allow LocalSystem NULL session fallback, default value: 0; \n' +
				'4. Name: EnableInsecureGuestLogons, description: Enable insecure guest logons, default value: 0;\n' +
				'5. Name: TLS11_Server_Enabled, description: TLS1.1 is not enabled - server, default value: 0;\n' +
				'6. Name: FVE_FDVActiveDirectoryInfoToStore, description: FVE FDVActiveDirectoryInfoToStore, default value: 1';

      const messages = [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage + scdList},
      ];

      const parameters = {
        'temperature': 0.2,
        'top_p': 0.1, 
        'frequency_penalty': 0, 
        'presence_penalty': 0, 
        'max_tokens': 4000, 
        'stop': null
      }; 

      if ((endpoint && azureApiKey) && typeof endpoint === 'string') {
        const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));
        const deploymentId = 'dsilfa75';
        const result = await client.getChatCompletions(deploymentId, messages, parameters);
      }
    }
  });
} 

export function deactivate(): Thenable<void> | undefined {
  return client ? client.stop() : undefined;
}
