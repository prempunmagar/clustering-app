import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { descriptions } = await request.json();

    if (!descriptions || !Array.isArray(descriptions)) {
      return NextResponse.json(
        { error: 'Invalid request: descriptions array is required' },
        { status: 400 }
      );
    }

    if (descriptions.length === 0) {
      return NextResponse.json(
        { error: 'Descriptions array cannot be empty' },
        { status: 400 }
      );
    }

    if (descriptions.length > 2000) {
      return NextResponse.json(
        { error: 'Too many descriptions. Maximum 2000 allowed.' },
        { status: 400 }
      );
    }

    // Validate that all descriptions are strings
    const invalidDescriptions = descriptions.filter(desc => typeof desc !== 'string' || desc.trim().length === 0);
    if (invalidDescriptions.length > 0) {
      return NextResponse.json(
        { error: 'All descriptions must be non-empty strings' },
        { status: 400 }
      );
    }

    const embeddings: number[][] = [];
    const batchSize = 50; // Process in smaller batches to avoid rate limits

    for (let i = 0; i < descriptions.length; i += batchSize) {
      const batch = descriptions.slice(i, i + batchSize);

      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-large',
          input: batch,
          dimensions: 1536 // Use 1536 dimensions for consistency
        });

        const batchEmbeddings = response.data.map(item => item.embedding);
        embeddings.push(...batchEmbeddings);

        // Add a small delay between batches to respect rate limits
        if (i + batchSize < descriptions.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error: unknown) {
        console.error('OpenAI API Error:', error);
        const apiError = error as { status?: number; message?: string };

        if (apiError.status === 429) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again in a moment.' },
            { status: 429 }
          );
        }

        if (apiError.status === 401) {
          return NextResponse.json(
            { error: 'Invalid OpenAI API key. Please check your configuration.' },
            { status: 401 }
          );
        }

        return NextResponse.json(
          { error: `OpenAI API error: ${apiError.message || 'Unknown error'}` },
          { status: 500 }
        );
      }
    }

    // Validate that we got embeddings for all descriptions
    if (embeddings.length !== descriptions.length) {
      return NextResponse.json(
        { error: 'Mismatch in embeddings count' },
        { status: 500 }
      );
    }

    // Validate embedding dimensions
    const expectedDimensions = 1536;
    const invalidEmbeddings = embeddings.filter(emb => emb.length !== expectedDimensions);
    if (invalidEmbeddings.length > 0) {
      return NextResponse.json(
        { error: `Invalid embedding dimensions. Expected ${expectedDimensions}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      embeddings,
      count: embeddings.length,
      dimensions: expectedDimensions,
      model: 'text-embedding-3-large'
    });

  } catch (error: unknown) {
    console.error('Embeddings API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing embeddings' },
      { status: 500 }
    );
  }
}