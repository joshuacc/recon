
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
  }

  /**
   * The actual information gathered.
   */
  content: string;
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
   * @returns A promise that resolves to the gathered information as a string.
   */
  gather(options: T): Promise<GatheredInformation[]>;

  /**
   * Converts a string representation of the options (used in the CLI) into the appropriate type for the agent..
   */
  parseOptions?(options: string): T;
}

export function isGatheredInformation(obj: any): obj is GatheredInformation {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.tag === "string" &&
    typeof obj.attrs === "object" &&
    typeof obj.content === "string"
  );
}