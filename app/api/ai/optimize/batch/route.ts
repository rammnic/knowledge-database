import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "AI not configured" },
      { status: 503 }
    );
  }

  try {
    const { noteIds } = await request.json();

    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return NextResponse.json(
        { error: "No note IDs provided" },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      errors: 0,
      details: [] as Array<{ id: string; title: string; status: string; error?: string }>,
    };

    // Process each note
    for (const noteId of noteIds) {
      try {
        const note = await prisma.note.findUnique({
          where: { id: noteId },
        });

        if (!note) {
          results.errors++;
          results.details.push({
            id: noteId,
            title: "Unknown",
            status: "error",
            error: "Note not found",
          });
          continue;
        }

        // Call OpenRouter API for optimization
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://knowledge-database.com",
            "X-Title": "Knowledge Database",
          },
          body: JSON.stringify({
            model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp",
            messages: [
              {
                role: "system",
                content: `You are a technical writer assistant. Improve the given markdown content for clarity and structure. 
                Also suggest relevant tags (3-5) based on the content. 
                Return a JSON object with:
                - "optimizedContent": the improved markdown
                - "suggestedTags": array of tag strings`
              },
              {
                role: "user",
                content: `Title: ${note.title}\n\nContent:\n${note.content}`
              }
            ],
            max_tokens: 4000,
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        const rawContent = data.choices[0].message.content;
        
        console.log("AI raw response:", rawContent.substring(0, 500));
        
        // Extract JSON from markdown code block if present
        const cleanedContent = extractJsonFromMarkdown(rawContent);
        
        let result;
        try {
          result = JSON.parse(cleanedContent);
        } catch (parseError) {
          // Try to find JSON anywhere in the text with more flexible regex
          const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              result = JSON.parse(jsonMatch[0]);
            } catch (e2) {
              // Last resort: try to extract content between quotes
              const contentMatch = cleanedContent.match(/"optimizedContent"\s*:\s*"([\s\S]*?)"/);
              const tagsMatch = cleanedContent.match(/"suggestedTags"\s*:\s*(\[[\s\S]*?\])/);
              
              result = {
                optimizedContent: contentMatch ? contentMatch[1] : note.content,
                suggestedTags: tagsMatch ? JSON.parse(tagsMatch[1]) : [],
              };
            }
          } else {
            // If no JSON found, use the entire response as content
            result = {
              optimizedContent: cleanedContent,
              suggestedTags: [],
            };
          }
        }

        const optimizedContent = result.optimizedContent || result.content || note.content;
        const suggestedTags = result.suggestedTags || result.tags || [];

        // Update note with optimized content
        await prisma.note.update({
          where: { id: noteId },
          data: {
            content: optimizedContent,
            updatedAt: new Date(),
          },
        });

        // Handle tags
        if (suggestedTags.length > 0) {
          // Get or create tags
          for (const tagName of suggestedTags) {
            const tagSlug = tagName.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-");
            
            const tag = await prisma.tag.upsert({
              where: { slug: tagSlug },
              create: { name: tagName, slug: tagSlug },
              update: {},
            });

            // Connect tag to note if not already connected
            await prisma.noteTag.upsert({
              where: {
                noteId_tagId: { noteId, tagId: tag.id },
              },
              create: { noteId, tagId: tag.id },
              update: {},
            });
          }
        }

        results.success++;
        results.details.push({
          id: noteId,
          title: note.title,
          status: "success",
        });

      } catch (error) {
        console.error(`Error optimizing note ${noteId}:`, error);
        results.errors++;
        results.details.push({
          id: noteId,
          title: "Unknown",
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error("Batch optimization error:", error);
    return NextResponse.json(
      { error: "Batch optimization failed" },
      { status: 500 }
    );
  }
}

function extractJsonFromMarkdown(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  return text.trim();
}