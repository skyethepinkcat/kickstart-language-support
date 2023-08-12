import * as path from "path";
import { languages, workspace, ExtensionContext } from "vscode";

import {
  DocumentFilter,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from "vscode-languageclient/node";
import { provideKickstartCompletionItems } from "./completion";

/**
 * Document selector for files that this extension can enhance.
 */
const DOCUMENT_SELECTOR: DocumentFilter = { scheme: "file", language: "kickstart" };

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  const completionProvider = languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, {
    provideCompletionItems: provideKickstartCompletionItems
  });
  context.subscriptions.push(completionProvider);

  const serverModule = context.asAbsolutePath(
    path.join("out", "server", "src", "server.js")
  );

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
    }
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [DOCUMENT_SELECTOR],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher("**/*.ks")
    }
  };

  client = new LanguageClient(
    "kickstartLanguageSupport",
    "Kickstart Language Support",
    serverOptions,
    clientOptions
  );

  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }

  return client.stop();
}
