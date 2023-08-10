import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import {
  spawnSync
} from "node:child_process";

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  DidChangeConfigurationNotification,
} from "vscode-languageserver/node";

import {
  DocumentUri,
  TextDocument
} from "vscode-languageserver-textdocument";

import { ksvalidatorAvailable, ksvalidatorDiagnostics } from "./ksvalidator";

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasTextDocumentSyncCapability = false;

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

interface LintingSettings {
  lintOnSave: boolean;
}

interface ServerSettings {
  linting: LintingSettings;
}

// Initialize settings to their default values.
const defaultSettings: ServerSettings = {
  linting: {
    lintOnSave: true
  }
};
let globalSettings: ServerSettings = defaultSettings;
const documentSettings: Map<string, Thenable<ServerSettings>> = new Map();


connection.onDidChangeConfiguration(change => {
  if (hasConfigurationCapability) {
    documentSettings.clear(); // Reset all cached document settings.
  } else {
    globalSettings = <ServerSettings>((change.settings.kickstartLanugageSupport || defaultSettings));
  }

  // Revalidate all open text documents.
  documents.all().forEach(document => validateTextDocumentAt(document.uri));
});

function getDocumentSettings(resource: string): Thenable<ServerSettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: "kickstartLanguageSupport"
    });
    documentSettings.set(resource, result);
  }
  return result;
}

// Clear file-specific settings when files are closed.
documents.onDidClose(e => {
  documentSettings.delete(e.document.uri);
});

/**
 * Creates a new temporary directory.
 * Note that this directory must be manually removed when it is no longer needed.
 * @returns Path to a temporary directory.
 */
function temporaryDir(): string {
  return fs.mkdtempSync(fs.realpathSync(os.tmpdir()) + path.sep);
}

/**
 * Validates a text document.
 * @param textDocument Text document to validate.
 */
async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const dir = temporaryDir();
  try {
    const file = path.join(dir, "ksvalidator-input.ks");
    fs.writeFileSync(file, textDocument.getText());
    await validateTextDocumentAt(file);
    fs.unlinkSync(file);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Validates a text document at a given URI.
 * @param textDocumentUri URI to the text document to validate.
 */
async function validateTextDocumentAt(textDocumentUri: DocumentUri): Promise<void> {
  const diagnostics = await ksvalidatorDiagnostics(textDocumentUri);
  connection.sendDiagnostics({ uri: textDocumentUri, diagnostics });
}

// Validate tracked files when they are opened.
documents.onDidOpen(async change => {
  await validateTextDocument(change.document);
});

// Validate tracked files when changes are made.
documents.onDidSave(async change => {
  const document: TextDocument = change.document;
  const settings = await getDocumentSettings(document.uri);

  if (!settings.linting.lintOnSave) {
    await connection.sendDiagnostics({ uri: document.uri, diagnostics: [] });
    return;
  }

  await validateTextDocumentAt(document.uri);
});

documents.listen(connection);
connection.listen();
