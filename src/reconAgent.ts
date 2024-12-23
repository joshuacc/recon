import { z } from "zod";
/**
 * Represents information gathered by a recon agent. It will be converted into XML format.
 * For example:
 * ```xml
 * <dbQuery query="SELECT COUNT(*) FROM users" time="2021-09-01T12:00:00Z">
 *   1700
 * </dbQuery>
 */
export interface GatheredInformation {
  /**
   * The tag of the gathered information. Used to group related information together. e.g. "dbQuery"
   */
  tag: string;

  /**
   * Attributes of the gathered information. e.g. { query: "SELECT COUNT(*) FROM users", time: "2021-09-01T12:00:00Z" }
   */
  attrs: {
    [attrName: string]: string;
  };

  /**
   * The actual information gathered.
   */
  content: string;
}

const GatheredInformationSchema = z.object({
  tag: z.string(),
  attrs: z.record(z.string()),
  content: z.string(),
});

export function isGatheredInformation(
  obj: unknown,
): obj is GatheredInformation {
  return GatheredInformationSchema.safeParse(obj).success;
}

/**
 * Context information passed to agents when gathering information
 */
export interface GatherContext {
  /**
   * The directory containing the config file, if one was found
   */
  configDir?: string;

  /**
   * Whether the options came from a config file (true) or command line (false)
   */
  fromConfig: boolean;
}

/**
 * Represents a recon agent that can gather information based on the provided options.
 */
export interface ReconAgent<T> {
  /**
   * The name of the recon agent, which will be used as an identifier in the configuration.
   * Each agent must provide a unique name.
   */
  readonly name: string;

  /**
   * A brief description of what the recon agent does.
   * Each agent must provide a description.
   */
  readonly description: string;

  /**
   * Gathers information based on the provided options.
   * Each subclass must provide its own implementation of this method.
   *
   * @param options - The options specifying what information to gather.
   * @param context - Optional context information about where the options came from.
   *                 Only used by agents that need to know about the config environment,
   *                 such as resolving file paths relative to config location.
   * @returns A promise that resolves to the gathered information.
   */
  gather(options: T, context?: GatherContext): Promise<GatheredInformation[]>;

  /**
   * Converts a string representation of the options (used in the CLI) into the appropriate type for the agent.
   */
  parseOptions?(options: string): T;
}
