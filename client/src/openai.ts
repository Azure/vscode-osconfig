/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ChatMessage } from '@azure/openai';
import { v4 as uuid } from 'uuid';

export const systemMessage1 =
  'I want you to act as an IT administrator and Software Engineer. You will need to generate a desired configuration JSON document based on the information present in the attached list. Do not make up settings. You will only include relevant settings. Output must include JSON file only, no chat response. ';

const scdList = `
Configuration Scenario: ASHCIApplianceSecurityBaselineConfig; 
Schemaversion: 1.0; 
ID: ${uuid()}; 
version: 1.0; 
context: device. 
Action: set. 
Settings: 
 1. Name: InteractiveLogon_DoNotRequireCTRLALTDEL description: Interactive logon: Do not require CTRL+ALT+DEL, default value: 0;    
 2. Name: InteractiveLogon_DoNotDisplayLastSignedIn description: Interactive logon: Don't display last signed-in, default value: 1;    
 3. Name: InteractiveLogon_RequireDomainControllerAuthenticationToUnlock description: Interactive logon: Require Domain Controller authentication to unlock workstation, default value: 1;    
 4. Name: MicrosoftNetworkClient_DigitallySignCommunicationsAlways description: Microsoft network client: Digitally sign communications (always), default value: 1;    
 5. Name: MicrosoftNetworkClient_SendUnencryptedPasswordToThirdPartySMBServers description: Microsoft network client: Send unencrypted password to third-party SMB servers, default value: 0;    
 6. Name: EnableInsecureGuestLogons description: Enable insecure guest logons, default value: 0;    
 7. Name: EnumerateAdministrators description: Enumerate administrator accounts on elevation, default value: 0;    
 8. Name: Audit_ShutdownSystemImmediatelyIfUnableToLogSecurityAudits description: Audit: Shut down system immediately if unable to log security audits, default value: 0;    
 9. Name: DisallowDigestAuthentication description: Disallow Digest authentication, default value: 0;    
 10. Name: DomainMember_RefuseMachineAccountPasswordChanges description: Domain controller: Refuse machine account password changes, default value: 0;    
 11. Name: DomainMember_DisableMachineAccountPasswordChanges description: Domain member: Disable machine account password changes, default value: 0;    
 12. Name: NoGPOListChanges description: Process even if the Group Policy objects have not changed, default value: 0;    
 13. Name: WDigestAuthentication description: WDigest Authentication must be disabled, default value: 0;    
 14. Name: AllowICMPRedirectsToOverrideOSPFGeneratedRoutes description: prevent Internet Control Message Protocol (ICMP) redirects from overriding Open Shortest Path First (OSPF)-generated routes, def    
ault value: 0;    
 15. Name: InteractiveLogon_SmartCardRemovalBehavior description: Interactive logon: Smart card removal behavior, default value: 1;    
 16. Name: DoNotAllowDriveRedirection description: Do not allow drive redirection, default value: 1;    
 17. Name: TerminalServicesClient_DisablePasswordSaving description: Do not allow passwords to be saved, default value: 1;    
 18. Name: DontDisplayNetworkSelectionUI description: Do not display network selection UI, default value: 1;    
 19. Name: AllowTelemetry description: Allow Telemetry, default value: 0;    
 20. Name: Audit_ForceAuditPolicySubcategorySettingsToOverrideAuditPolicyCategorySettings description: Audit: Force audit policy subcategory settings (Windows Vista or later) to override audit policy     
category settings, default value: 1;
21. Name: WindowsUpdate_NoAutoUpdate description: Configure Automatic Updates, default value: 1;
 22. Name: OSPlatformValidation_UEFI_Enabled description: Configure TPM platform validation profile for native UEFI firmware configurations, default value: 0;
 23. Name: EnableSmartScreen description: Configure Windows Defender SmartScreen, default value: 1;
 24. Name: SetDefaultAutoRunBehavior description: Default AutoRun Behavior, default value: 1;
 25. Name: Disable_Windows_Error_Reporting description: Disable Windows Error Reporting, default value: 0;
 26. Name: DisallowAutoplayForNonVolumeDevices description: Disallow Autoplay for non-volume devices, default value: 1;
 27. Name: DomainMember_DigitallyEncryptOrSignSecureChannelDataAlways description: Domain member: Digitally encrypt or sign secure channel data (always), default value: 1;
 28. Name: DomainMember_DigitallyEncryptSecureChannelDataWhenPossible description: Domain member: Digitally encrypt secure channel data (when possible), default value: 1;
 29. Name: DomainMember_DigitallySignSecureChannelDataWhenPossible description: Domain member: Digitally sign secure channel data (when possible), default value: 1;`;

export const systemMessage =
  'You are an AI assistant who is a Software Engineer and IT adminstrator. You will need to generate a new desired configuration JSON document based on the information present in the included list.' +
  'The desired configuration JSON will have an "OsConfiguration" object, with a "Document" Object and a "Scenario" array inside of it. The "Document" object is composed of a "schemaversion", "id", "version", "context", and "scenario" variable. ' +
  'The default values for these variables are included in the provided list. Make sure to use the uuid value for the "id" variable. The "Scenario" array is composed of an object that has ' +
  'a "name" variable, a "schemaversion" variable, a "action" variable, and an object that has the same name as the configuration scenario. ' +
  'This object is composed of the relevant settings from the list you are given. Inside this object, you should only include ' +
  'the setting name and default value of settings that are relevant to what is being requested. All values in the JSON should be in string format. ' +
  'Construct a JSON based on this information and the provided configuration information. Remember, you will never include any chat text in your response, just JSON data only. ' +
  'Do not include unrelated settings in the JSON.';

export function getMessages(input: string): Array<ChatMessage> {
  const paddedInput = `Construct a JSON based with settings related to ${input} based on the provided configuration information. Settings should only come from the given Settings list, do not make up any settings, even if there is no related ones in the list `;

  const messages = [
    {
      role: 'system',
      content: systemMessage,
    },
    {
      role: 'user',
      content:
        'Here is the list of configuration and setting data. Only use this list for the JSON.' +
        scdList,
    },
    {
      role: 'user',
      content: userMessage1,
    },
    {
      role: 'assistant',
      content: assistantResponse1,
    },
    {
      role: 'user',
      content: userMessage2,
    },
    {
      role: 'assistant',
      content: assistantResponse2,
    },
    {
      role: 'user',
      content: userMessage3,
    },
    {
      role: 'assistant',
      content: assistantResponse3,
    },
    {
      role: 'user',
      content: userMessage4,
    },
    {
      role: 'assistant',
      content: assistantResponse4,
    },
    {
      role: 'user',
      content: paddedInput,
    },
  ];
  return messages;
}

export const chatCompletionptions = {
  temperature: 0,
  top_p: 0.1,
  frequency_penalty: 0,
  presence_penalty: 0,
  max_tokens: 4000,
  stop: null,
};

const userMessage1 =
  'Construct a JSON based with settings related to Network Access based on the provided configuration information. Settings should only come from the given Settings list.';

const userMessage2 =
  'Construct a JSON based with settings related to Logons based on the provided configuration information. Settings should only come from the given Settings list.';

const userMessage3 =
  'Construct a JSON based with settings related to pizza based on the provided configuration information. Settings should only come from the given Settings list';

const userMessage4 =
  'Construct a JSON based with settings related to Biometrics based on the provided configuration information. Settings should only come from the given Settings list';

const assistantResponse4 =
  '#Error: No settings are related to biometrics in the list.';

const assistantResponse1 = `
{
  "OsConfiguration": {
    "Document": {
      "schemaversion": "1.0",
      "id": "e589c138-29dc-11ee-be56-0242ac120002",
      "version": "1.0",
      "context": "device",
      "scenario": "ASHCIApplianceSecurityBaselineConfig"
    },
    "Scenario": [
      {
        "name": "ASHCIApplianceSecurityBaselineConfig",
        "schemaversion": "1.0",
        "action": "set",
        "ASHCIApplianceSecurityBaselineConfig": {
          "NetworkAccess_DoNotAllowAnonymousEnumerationOfSamAccountsAndShares": "1",
          "NetworkAccess_DoNotAllowStorageOfPasswordsAndCredentialsForNetworkAuthentication": "0",
          "NetworkAccess_LetEveryonePermissionsApplyToAnonymousUsers": "0",
          "NetworkAccess_SharingAndSecurityModelForLocalAccounts": "0"
        }
      }
    ]
  }
}
`;

const assistantResponse2 = `
{
  "OsConfiguration": {
    "Document": {
      "schemaversion": "1.0",
      "id": "f1dd9d6a-29dc-11ee-be56-0242ac120002",
      "version": "1.0",
      "context": "device",
      "scenario": "ASHCIApplianceSecurityBaselineConfig"
    },
    "Scenario": [
      {
        "name": "ASHCIApplianceSecurityBaselineConfig",
        "schemaversion": "1.0",
        "action": "set",
        "ASHCIApplianceSecurityBaselineConfig": {
          "InteractiveLogon_DoNotRequireCTRLALTDEL": "0",
          "InteractiveLogon_DoNotDisplayLastSignedIn": "1",
          "InteractiveLogon_RequireDomainControllerAuthenticationToUnlock": "1",
          "EnableInsecureGuestLogons": "0",
          "InteractiveLogon_SmartCardRemovalBehavior": "1" 
        }
      }
    ]
  }
}
`;
const assistantResponse3 =
  '#Error: Pizza is not a valid configuration scenario';
