import { GatheredInformation, ReconAgent } from "./reconAgent";

export class NotesAgent implements ReconAgent<string> {
  readonly name = "notes";
  readonly description =
    "Provides a set of notes as context for the user's directions";

  async gather(options: string): Promise<GatheredInformation[]> {
    return [
      {
        tag: "notes",
        attrs: {},
        content: options,
      },
    ];
  }
}
