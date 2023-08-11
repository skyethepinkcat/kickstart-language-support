import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { DocumentUri, TextDocument } from "vscode-languageserver-textdocument";
import { ksvalidatorDiagnostics } from "./ksvalidator";
import { _Connection } from "vscode-languageserver";

/**
 * Creates a new temporary directory.
 * Note that this directory must be manually removed when it is no longer needed.
 * @returns Path to a temporary directory.
 */
export function temporaryDir(): string {
  return fs.mkdtempSync(fs.realpathSync(os.tmpdir()) + path.sep);
}

/**
 * Validates a text document.
 * @param textDocument Text document to validate.
 */
export async function validateTextDocument(textDocument: TextDocument, connection: _Connection): Promise<void> {
  const dir = temporaryDir();
  try {
    const file = path.join(dir, "ksvalidator-input.ks");
    fs.writeFileSync(file, textDocument.getText());
    await validateTextDocumentAt(file, connection);
    fs.unlinkSync(file);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Validates a text document at a given URI.
 * @param textDocumentUri URI to the text document to validate.
 */
export async function validateTextDocumentAt(textDocumentUri: DocumentUri, connection: _Connection): Promise<void> {
  const diagnostics = await ksvalidatorDiagnostics(textDocumentUri);
  connection.sendDiagnostics({ uri: textDocumentUri, diagnostics });
}
