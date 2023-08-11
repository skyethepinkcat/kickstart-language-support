/**
 * Name of the settings section used to configure the plugin.
 */
export const PLUGIN_SETTINGS_SECTION = "kickstartLanguageSupport";

/**
 * Linting settings.
 */
export interface LintingSettings {
  lintOnSave: boolean;
}

/**
 * Server settings.
 */
export interface ServerSettings {
  linting: LintingSettings;
}

/**
 * Creates a new instance of the default server settings.
 * @returns Default server settings.
 */
export function defaultSettings(): ServerSettings {
  return {
    linting: {
      lintOnSave: true
    }
  };
}
