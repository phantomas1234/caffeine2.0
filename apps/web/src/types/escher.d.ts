// Minimal ambient declaration; escher ships no types. We only use Builder.
declare module "escher" {
  export class Builder {
    constructor(
      mapData: unknown,
      modelData: unknown,
      embeddedCss: string | null,
      selection: unknown,
      options: Record<string, unknown>,
    );
    options?: Record<string, unknown>;
  }
}
