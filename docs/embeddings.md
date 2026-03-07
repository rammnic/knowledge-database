OpenRouter's embeddings API allows you to convert text into numerical vectors that capture semantic meaning, which is perfect for building knowledge database systems with semantic search capabilities 
1
.

What are Embeddings?
Embeddings transform text into high-dimensional vectors where semantically similar texts are positioned closer together in vector space . For example, "cat" and "kitten" would have similar embeddings, while "cat" and "airplane" would be far apart . This makes them ideal for understanding relationships between pieces of text in your knowledge database.

Setting Up Basic Embeddings
To generate embeddings for your knowledge database content, send a POST request to /embeddings with your text and chosen model :

import { OpenRouter } from '@openrouter/sdk';
const openRouter = new OpenRouter({
  apiKey: 'your-api-key',
});
const response = await openRouter.embeddings.generate({
  model: 'openai/text-embedding-3-small',
  input: 'Your knowledge base article content here',
});
console.log(response.data[0].embedding);

Building a Knowledge Database Search System
Here's how to implement semantic search for your knowledge database using embeddings :

// Sample knowledge base articles
const knowledgeBase = [
  "How to reset your password: Go to settings and click forgot password",
  "Troubleshooting login issues: Clear your browser cache and cookies",
  "Setting up two-factor authentication for enhanced security",
  "Managing user permissions and access controls",
  "Database backup and recovery procedures"
];
// Function to calculate similarity between vectors
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
async function searchKnowledgeBase(query: string, articles: string[]) {
  // Generate embeddings for the search query and all articles
  const response = await openRouter.embeddings.generate({
    model: 'openai/text-embedding-3-small',
    input: [query, ...articles],
  });
  const queryEmbedding = response.data[0].embedding;
  const articleEmbeddings = response.data.slice(1);
  // Calculate similarity scores
  const results = articles.map((article, i) => ({
    article: article,
    similarity: cosineSimilarity(
      queryEmbedding as number[],
      articleEmbeddings[i].embedding as number[]
    ),
  }));
  // Sort by relevance (highest similarity first)
  results.sort((a, b) => b.similarity - a.similarity);
  return results;
}
// Search your knowledge base
const searchResults = await searchKnowledgeBase("I can't log in", knowledgeBase);

Batch Processing for Large Knowledge Bases
When processing multiple articles, use batch requests to reduce latency and costs :

const response = await openRouter.embeddings.generate({
  model: 'openai/text-embedding-3-small',
  input: [
    'Article 1: User authentication guide',
    'Article 2: Database configuration steps',
    'Article 3: API integration tutorial'
  ],
});
// Process each embedding
response.data.forEach((item, index) => {
  console.log(`Article ${index}: ${item.embedding.length} dimensions`);
});

Available Models for Knowledge Bases
You can view all available embedding models at the OpenRouter models page . To list them programmatically:

const models = await openRouter.embeddings.listModels();
console.log(models.data);

Different models have different strengths - smaller models like openai/text-embedding-3-small are faster and cheaper, while larger models provide better quality .

Best Practices for Knowledge Databases
Cache Your Embeddings: Embeddings for the same text are deterministic, so store them in your database to avoid regenerating them repeatedly .

Use Appropriate Chunking: For long knowledge base articles, split them into meaningful chunks (paragraphs, sections) rather than arbitrary character limits to preserve semantic coherence .

Choose Cosine Similarity: When comparing embeddings, use cosine similarity rather than Euclidean distance, as it's scale-invariant and works better for high-dimensional vectors .

Consider Context Length: Each model has a maximum input length, so longer articles may need to be chunked or truncated .

Common Use Cases for Knowledge Databases
Embeddings are particularly useful for:

Semantic Search: Find relevant articles based on meaning rather than just keyword matching
Content Recommendation: Suggest related articles based on semantic similarity
Duplicate Detection: Identify similar or duplicate content in your knowledge base
Content Classification: Automatically categorize articles into topics
This approach will give you a much more intelligent search system than traditional keyword-based search, as it understands the meaning and context of both user queries and your knowledge base content.