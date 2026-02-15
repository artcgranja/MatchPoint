import { BaseAgent } from "./base";
import {
  ProductConceptSchema,
  ConceptClassificationSchema,
  type ProductConcept,
  type ConceptClassification,
} from "./schemas";
import {
  CONCEPT_EXTRACT_SYSTEM,
  CONCEPT_CLASSIFY_SYSTEM,
} from "./prompts/concept-extractor";

export class ConceptExtractorAgent extends BaseAgent {
  constructor() {
    super("advisor"); // Haiku — classification tasks don't need Opus
  }

  async extractConcept(productDocument: string): Promise<ProductConcept> {
    return this.invokeStructured(
      CONCEPT_EXTRACT_SYSTEM,
      `<product_document>\n${productDocument}\n</product_document>\n\nExtract the canonical product concept from this document.`,
      ProductConceptSchema,
      { maxTokens: 1024, timeout: 30_000 }
    );
  }

  async classifyConcept(
    newConcept: ProductConcept,
    existingNames: string[]
  ): Promise<ConceptClassification> {
    if (existingNames.length === 0) {
      return {
        matchedConceptName: null,
        confidence: 0,
        reasoning: "No existing concepts to compare against.",
      };
    }

    const existingList = existingNames
      .map((n, i) => `${i + 1}. ${n}`)
      .join("\n");

    return this.invokeStructured(
      CONCEPT_CLASSIFY_SYSTEM,
      `<new_concept>\nName: ${newConcept.name}\nDefinition: ${newConcept.definition}\nCategory: ${newConcept.category}\n</new_concept>\n\n<existing_concepts>\n${existingList}\n</existing_concepts>\n\nDoes the new concept match any existing concept? If so, which one?`,
      ConceptClassificationSchema,
      { maxTokens: 512, timeout: 30_000 }
    );
  }
}
