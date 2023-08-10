import * as path from 'path';
import * as vscode from 'vscode';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

import { chatCompletionptions, getMessages } from './openai';

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
    documentSelector: [
      {
        scheme: 'file',
        language: 'json',
        pattern: '**/osconfig_desired*.json',
      },
    ],
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

  const endpoint = process.env['AZURE_OPENAI_ENDPOINT2'];
  const azureApiKey = process.env['AZURE_OPENAI_KEY2'];
  const deploymentId = process.env['AZURE_DEPLOYMENT_ID'];

  vscode.commands.registerCommand('vscode-osconfig.DCGenerator', async () => {
    const userInput = await vscode.window.showInputBox({
      placeHolder: 'Enter setting here',
      prompt:
        'Enter in desired configuration setting for DC document (Ex: Network Access)',
    });

    if (userInput === undefined) {
      vscode.window.showErrorMessage('Not a valid input');
    } else if (userInput === '') {
      vscode.window.showErrorMessage(
        'Setting configuration is required to execute this action'
      );
    } else {
      vscode.window.showInformationMessage(
        'Generating DC Doc with: ' + userInput
      );
      const messagesArray = getMessages(userInput);

      if (azureApiKey && endpoint) {
        const client = new OpenAIClient(
          endpoint,
          new AzureKeyCredential(azureApiKey)
        );
        const result = await client.getChatCompletions(
          deploymentId,
          messagesArray,
          chatCompletionptions
        );
        if (
          result.choices.length > 0 &&
          result.choices[0].finishReason !== null
        ) {
          if (!result.choices[0].message.content.includes('#')) {
            if (vscode.window.activeTextEditor) {
              vscode.window.activeTextEditor.edit((editBuilder) => {
                editBuilder.insert(
                  vscode.window.activeTextEditor.selection.active,
                  result.choices[0].message.content
                );
              });
            } else {
              vscode.window.showErrorMessage(
                'vscode-osconfig: Must have file or workspace opened to generate DC Document.'
              );
            }
          } else {
            vscode.window.showErrorMessage(
              'vscode-osconfig: Unable to generate DC document for ' + userInput
            );
          }
        } else {
          vscode.window.showErrorMessage(
            'vscode-osconfig: Error generating response.'
          );
        }
      }
    }
  });
}

export function deactivate(): Thenable<void> | undefined {
  return client ? client.stop() : undefined;
}
