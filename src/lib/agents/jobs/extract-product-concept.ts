import { prisma } from "@/lib/db";
import { ConceptExtractorAgent } from "../concept-extractor";

export async function extractProductConcept(
  searchId: string
): Promise<void> {
  const startTime = Date.now();

  try {
    // 1. Idempotency: skip if already extracted for this search
    const existing = await prisma.productConceptExtraction.findFirst({
      where: { searchExecutionId: searchId },
    });
    if (existing) {
      console.log(
        `[ConceptExtractor] Already extracted for search ${searchId}, skipping.`
      );
      return;
    }

    // 2. Load product document from SearchExecution.bizPlan
    const search = await prisma.searchExecution.findUniqueOrThrow({
      where: { id: searchId },
    });
    const bizPlan = search.bizPlan as unknown as {
      productDocument?: string;
    } | null;
    if (!bizPlan?.productDocument) {
      console.warn(
        `[ConceptExtractor] No product document for search ${searchId}, skipping.`
      );
      return;
    }

    const agent = new ConceptExtractorAgent();

    // 3. Extract canonical concept from product document
    const concept = await agent.extractConcept(bizPlan.productDocument);

    // 4. Fetch all existing concept names for deduplication
    const existingConcepts = await prisma.productConcept.findMany({
      select: { name: true },
      orderBy: { demandCount: "desc" },
    });
    const existingNames = existingConcepts.map(
      (c: { name: string }) => c.name
    );

    // 5. Classify: does this match an existing concept?
    const classification = await agent.classifyConcept(concept, existingNames);

    // 6. Upsert concept + create audit trail atomically
    const conceptId = await prisma.$transaction(async (tx) => {
      let id: string;

      if (
        classification.matchedConceptName &&
        classification.confidence >= 0.8
      ) {
        // Increment demand counter on existing concept
        const updated = await tx.productConcept.update({
          where: { name: classification.matchedConceptName },
          data: {
            demandCount: { increment: 1 },
            lastSeenAt: new Date(),
          },
        });
        id = updated.id;
      } else {
        // Create new concept — handle race condition on unique constraint
        try {
          const created = await tx.productConcept.create({
            data: {
              name: concept.name,
              definition: concept.definition,
              category: concept.category,
              demandCount: 1,
            },
          });
          id = created.id;
        } catch (err: unknown) {
          // Race condition: another concurrent extraction created the same concept
          if (
            err &&
            typeof err === "object" &&
            "code" in err &&
            err.code === "P2002"
          ) {
            const updated = await tx.productConcept.update({
              where: { name: concept.name },
              data: {
                demandCount: { increment: 1 },
                lastSeenAt: new Date(),
              },
            });
            id = updated.id;
          } else {
            throw err;
          }
        }
      }

      // 7. Create audit trail (unique constraint guards idempotency)
      await tx.productConceptExtraction.create({
        data: {
          conceptId: id,
          searchExecutionId: searchId,
          rawExtraction: JSON.parse(
            JSON.stringify({
              extractedConcept: concept,
              classification,
            })
          ),
        },
      });

      return id;
    });

    // 8. Log to PipelineStageLog for observability
    await prisma.pipelineStageLog.create({
      data: {
        searchExecutionId: searchId,
        agentName: "ConceptExtractor",
        status: "complete",
        progress: 100,
        message: classification.matchedConceptName
          ? `Matched to existing concept: "${classification.matchedConceptName}"`
          : `Created new concept: "${concept.name}"`,
        inputData: {
          productDocumentLength: bizPlan.productDocument.length,
        } as never,
        outputData: JSON.parse(
          JSON.stringify({ concept, classification, conceptId })
        ),
        durationMs: Date.now() - startTime,
      },
    });

    console.log(
      `[ConceptExtractor] ${classification.matchedConceptName ? "Matched" : "Created"} concept "${classification.matchedConceptName ?? concept.name}" for search ${searchId} (${Date.now() - startTime}ms)`
    );
  } catch (error) {
    console.error(
      `[ConceptExtractor] Failed for search ${searchId}:`,
      error
    );

    // Log failure — never propagate from background job
    try {
      await prisma.pipelineStageLog.create({
        data: {
          searchExecutionId: searchId,
          agentName: "ConceptExtractor",
          status: "error",
          progress: 0,
          message:
            error instanceof Error ? error.message : "Unknown error",
          durationMs: Date.now() - startTime,
        },
      });
    } catch {
      // Swallow logging errors in background jobs
    }
  }
}
