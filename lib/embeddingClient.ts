import { pipeline } from '@xenova/transformers';

// Singleton pattern to load the model only once
class EmbeddingPipeline {
  static model = 'Xenova/all-MiniLM-L6-v2';
  static task = 'feature-extraction';
  static instance: Awaited<ReturnType<typeof pipeline>> | null = null;

  static async getInstance() {
    if (this.instance === null) {
      console.log('Initializing embedding model...');
      this.instance = await pipeline(this.task as 'feature-extraction', this.model);
      console.log('Model initialized.');
    }
    return this.instance;
  }
}

/**
 * Generates an embedding for a given text using a local model.
 * @param {string} text The text to embed.
 * @returns {Promise<number[]>} The 384-dimension vector.
 */
export async function embed(text: string): Promise<number[]> {
  const embedder = await EmbeddingPipeline.getInstance();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (embedder as any)(text, {
    pooling: 'mean',
    normalize: true,
  });
  return Array.from(result.data);
}


