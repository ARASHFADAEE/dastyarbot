import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AvalAiService } from '../ai/avalai.service';

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function chunkText(text: string, size = 800): string[] {
  const parts: string[] = [];
  const cleaned = text.replace(/\r/g, '').trim();
  for (let i = 0; i < cleaned.length; i += size) {
    parts.push(cleaned.slice(i, i + size));
  }
  return parts.filter(Boolean);
}

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly avalai: AvalAiService,
  ) {}

  list() {
    return this.prisma.knowledgeDocument.findMany({
      include: { _count: { select: { chunks: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async ingest(title: string, content: string, source?: string) {
    const doc = await this.prisma.knowledgeDocument.create({
      data: { title, content, source },
    });
    const chunks = chunkText(content);
    for (let i = 0; i < chunks.length; i += 1) {
      let embeddingJson: string | undefined;
      try {
        const embedding = await this.avalai.embed(chunks[i]);
        embeddingJson = JSON.stringify(embedding);
      } catch (err) {
        this.logger.warn(`Embedding failed: ${(err as Error).message}`);
      }
      await this.prisma.knowledgeChunk.create({
        data: {
          documentId: doc.id,
          content: chunks[i],
          chunkIndex: i,
          embedding: embeddingJson,
        },
      });
    }
    return this.prisma.knowledgeDocument.findUnique({
      where: { id: doc.id },
      include: { chunks: true, _count: { select: { chunks: true } } },
    });
  }

  async search(query: string, topK = 5) {
    const chunks = await this.prisma.knowledgeChunk.findMany({
      include: { document: true },
      take: 200,
    });
    if (!chunks.length) return [];

    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await this.avalai.embed(query);
    } catch {
      // keyword fallback
    }

    if (!queryEmbedding) {
      const q = query.toLowerCase();
      return chunks
        .filter(
          (c) =>
            c.content.toLowerCase().includes(q) ||
            c.document.title.toLowerCase().includes(q),
        )
        .slice(0, topK)
        .map((c) => ({
          score: 0.5,
          content: c.content,
          title: c.document.title,
          documentId: c.documentId,
        }));
    }

    const scored = chunks.map((c) => {
      let emb: number[] = [];
      try {
        emb = c.embedding ? (JSON.parse(c.embedding) as number[]) : [];
      } catch {
        emb = [];
      }
      const score = emb.length ? cosineSimilarity(queryEmbedding!, emb) : 0;
      return {
        score,
        content: c.content,
        title: c.document.title,
        documentId: c.documentId,
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter((s) => s.score > 0.2);
  }
}
