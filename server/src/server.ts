import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  DidChangeConfigurationNotification,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

import { ksvalidatorAvailable } from "./ksvalidator";
import { PLUGIN_SETTINGS_SECTION, ServerSettings, defaultSettings } from "./settings";
import { validateTextDocument, validateTextDocumentAt } from "./utils";

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let globalSettings: ServerSettings = defaultSettings();
const documentSettings: Map<string, Thenable<ServerSettings>> = new Map();

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasTextDocumentSyncCapability = false;

/**
 * Returns the settings for a document.
 * @param resource Document resource URI.
 * @returns Document settings.
 */
function getDocumentSettings(resource: string): Thenable<ServerSettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: PLUGIN_SETTINGS_SECTION
    });
    documentSettings.set(resource, result);
  }
  return result;
}

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );

  const result: InitializeResult = { capabilities: {} };
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true
      }
    };
  }

  // Only listen for text document changes if ksvalidator is available.
  hasTextDocumentSyncCapability = ksvalidatorAvailable();
  if (hasTextDocumentSyncCapability) {
    connection.console.info("Found `ksvalidator`. Kickstart files will be validated.");
    result.capabilities.textDocumentSync = TextDocumentSyncKind.Incremental;
  } else {
    connection.console.warn("Unable to find `ksvalidator`. Linting will be disabled.");
  }

  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(_event => {
      connection.console.log("Workspace folder change event received.");
    });
  }
});

connection.onDidChangeConfiguration(change => {
  if (hasConfigurationCapability) {
    documentSettings.clear(); // Reset all cached document settings.
  } else {
    globalSettings = <ServerSettings>((change.settings.kickstartLanugageSupport || defaultSettings));
  }

  // Revalidate all open text documents.
  documents.all().forEach(document => validateTextDocumentAt(document.uri, connection));
});

// Clear file-specific settings when files are closed.
documents.onDidClose(e => {
  documentSettings.delete(e.document.uri);
});

// Validate tracked files when they are opened.
documents.onDidOpen(async change => {
  await validateTextDocument(change.document, connection);
});

// Validate tracked files when changes are made.
documents.onDidSave(async change => {
  const document: TextDocument = change.document;
  const settings = await getDocumentSettings(document.uri);

  if (!settings.linting.lintOnSave) {
    await connection.sendDiagnostics({ uri: document.uri, diagnostics: [] });
    return;
  }

  await validateTextDocumentAt(document.uri, connection);
});

// Start the language server.
documents.listen(connection);
connection.listen();
