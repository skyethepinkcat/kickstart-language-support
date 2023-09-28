import { spawnSync } from "child_process";
import { Diagnostic, DiagnosticSeverity, Position, uinteger } from "vscode-languageserver";
import { DocumentUri } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";

/**
 * Validates a document using `ksvalidator`, converting errors to diagnostics.
 * @param textDocumentUri URI of the text document to validate.
 * @returns Diagnostics from `ksvalidator`.
 */
export async function ksvalidatorDiagnostics(textDocumentUri: DocumentUri): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];

  // Only local files can be validated using ksvalidator.
  const uri = URI.parse(textDocumentUri);
  if (uri.scheme !== "file") {
    return diagnostics;
  }

  // Run ksvalidator and extract errors from stderr.
  const ksvalidator = spawnSync("ksvalidator", ["--", uri.fsPath]);
  const stderr = (ksvalidator.status !== 0 && ksvalidator.stderr) ? ksvalidator.stderr.toString() : "";
  const lines = stderr.split("\n").filter((str) => str);

  const lineRegex = RegExp("on line (\\d+) of");
  for (let i = 0; i < lines.length - 1; i += 2) {
    const lineMatches = lines[i].match(lineRegex);

    if (!lineMatches) {
      continue;
    }

    const line = Number.parseInt(lineMatches[1]) - 1;
    const message = lines[i + 1].trim();
    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Warning,
      range: {
        start: Position.create(line, 0),
        end: Position.create(line, uinteger.MAX_VALUE)
      },
      message,
      source: "ksvalidator"
    };

    diagnostics.push(diagnostic);
  }

  return diagnostics;
}

/**
 * Checks the availability of `ksvalidator`.
 * @returns `true` if `ksvalidator` is available.
 */
export function ksvalidatorAvailable(): boolean {
  try {
    // The --help flag should always result in a clean exit if the program is available.
    const ksvalidator = spawnSync("ksvalidator", ["--help"]);
    return ksvalidator.status === 0;
  } catch (error) {
    console.error("Failed to check ksvalidator availability", error);
  }

  return false;
}
