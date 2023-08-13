import { CancellationToken, CompletionContext, CompletionItem, Position, ProviderResult, SnippetString, TextDocument } from "vscode";
import { CompletionItemKind } from "vscode-languageclient";
import { COMMANDS } from "./data";

/**
 * Performs code completion.
 * @param document Text document.
 * @param position Position from which the completion was triggered.
 * @param token Cancellation token.
 * @param context Completion context.
 * @returns Kickstart-related completion items.
 */
export function provideKickstartCompletionItems(document: TextDocument, position: Position, _token: CancellationToken, _context: CompletionContext): ProviderResult<CompletionItem[]> {
  const linePrefix = document.lineAt(position).text.substring(0, position.character);
  const prefixWords = linePrefix.trim().split(/\s+/);

  // Check if the first word has been completed in the prefix.
  if (/\S\s/.test(linePrefix)) {
    // Provide completions for the command's arguments.
    // The command is always the first word of a line.
    const command = prefixWords[0];
    if (!COMMANDS.has(command)) {
      return [];
    }

    return COMMANDS.get(command).map(arg => {
      const argWords = arg.split(/\s+/, 1);
      const item = new CompletionItem(argWords[0], CompletionItemKind.Property);
      item.insertText = new SnippetString(arg);
      return item;
    });
  }

  // Provide completions for a command.
  const completions = [];
  for (const command of COMMANDS.keys()) {
    completions.push(new CompletionItem(command, CompletionItemKind.Function));
  }

  return completions;
}
