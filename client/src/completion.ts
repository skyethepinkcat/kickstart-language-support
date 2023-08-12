import { CancellationToken, CompletionContext, CompletionItem, Position, ProviderResult, TextDocument } from "vscode";

/**
 * Command names to complete.
 */
const COMMANDS = [
  "%include",
  "%ksappend",
  "authselect",
  "autopart",
  "bootloader",
  "cdrom",
  "clearpart",
  "cmdline",
  "driverdisk",
  "eula",
  "fcoe",
  "firewall",
  "firstboot",
  "graphical",
  "group",
  "halt",
  "harddrive",
  "ignoredisk",
  "iscsi",
  "iscsiname",
  "keyboard",
  "lang",
  "liveimg",
  "logging",
  "logvol",
  "mediacheck",
  "module",
  "mount",
  "network",
  "nfs",
  "nvdimm",
  "ostreesetup",
  "part",
  "partition",
  "poweroff",
  "raid",
  "realm",
  "reboot",
  "repo",
  "reqpart",
  "rescue",
  "rhsm",
  "rootpw",
  "selinux",
  "services",
  "shutdown",
  "skipx",
  "snapshot",
  "sshkey",
  "sshpw",
  "syspurpose",
  "text",
  "timesource",
  "timezone",
  "url",
  "user",
  "vnc",
  "volgroup",
  "xconfig",
  "zerombr",
  "zfcp",
  "zipl",
];

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

  // Only provide completions for the command name.
  // The command name is always the first word of a line.
  //
  // Note that this check does not take sections into consideration.
  // Thus, completions may not always be useful in these situations.
  if (/\S\s/.test(linePrefix)) {
    return [];
  }

  return COMMANDS.map(command => new CompletionItem({
    label: command,
  }));
}
