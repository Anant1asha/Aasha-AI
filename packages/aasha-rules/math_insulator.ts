/**
 * AASHA Math Insulator Engine
 * Insulates LaTeX equations, formulas, and single-letter algebraic variables
 * from being mangled or collision-matched by LLE word wrapping or dictionary lookups.
 */

export interface MathTokenMap {
  tokens: Map<string, string>;
}

export class MathInsulator {
  private static MATH_PATTERNS = [
    /\\\[[\s\S]*?\\\]/g,            // Display LaTeX \[ ... \]
    /\\\([\s\S]*?\\\)/g,            // Inline LaTeX \( ... \)
    /\$\$[\s\S]*?\$\$/g,            // Display TeX $$ ... $$
    /\$[^\$\n]+?\$/g,               // Inline TeX $ ... $
    /<span[^>]*class=["'][^"']*math[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, // Math spans
  ];

  /**
   * Replaces all mathematical blocks with unique immutable placeholders.
   */
  static tokenize(text: string): { maskedText: string; tokenMap: Map<string, string> } {
    const tokenMap = new Map<string, string>();
    let counter = 0;
    let masked = text;

    for (const pattern of this.MATH_PATTERNS) {
      masked = masked.replace(pattern, (match) => {
        const token = `__AASHA_MATH_${counter++}__`;
        tokenMap.set(token, match);
        return token;
      });
    }

    return { maskedText: masked, tokenMap };
  }

  /**
   * Restores exact, untouched mathematical blocks back into the text.
   */
  static restore(maskedText: string, tokenMap: Map<string, string>): string {
    let restored = maskedText;
    for (const [token, original] of tokenMap.entries()) {
      restored = restored.replace(token, () => original);
    }
    return restored;
  }

  /**
   * Wraps LaTeX expressions with math-isolation tags to guarantee
   * zero collision with client-side rt() dictionary wrappers.
   */
  static wrapWithIsolation(formula: string): string {
    return `<span class="math-var" data-math="true">${formula}</span>`;
  }
}