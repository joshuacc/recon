// src/functionAgent.ts
import {
  GatheredInformation,
  ReconAgent,
  isGatheredInformation,
} from "./reconAgent.js";

type GatherFunction = () =>
  | Promise<GatheredInformation[]>
  | GatheredInformation[];
type FunctionAgentOptions = GatherFunction[] | GatherFunction;

export class FunctionAgent implements ReconAgent<FunctionAgentOptions> {
  readonly name = "function";
  readonly description =
    "Allows users define their own functions in .recon.config.mjs to gather information";

  async gather(fns: FunctionAgentOptions): Promise<GatheredInformation[]> {
    const funcs = Array.isArray(fns) ? fns : [fns];

    const results: GatheredInformation[] = [];

    for (const func of funcs) {
      if (typeof func !== "function") {
        throw new Error("Invalid function provided");
      }

      const result = await func();
      if (!Array.isArray(result) || !result.every(isGatheredInformation)) {
        throw new Error(
          "Function must return an array of GatheredInformation objects",
        );
      }
      results.push(...result);
    }

    return results;
  }
}
