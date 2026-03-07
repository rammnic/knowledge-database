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
    const { title, content } = await request.json();

    // Use OpenRouter to optimize content
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://knowledge-database.com",
        "X-Title": "Knowledge Database",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL,
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
            content: `Title: ${title}\n\nContent:\n${content}`
          }
        ],
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("OpenRouter API error:", await response.text());
      return NextResponse.json(
        { error: "AI optimization failed" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    
    console.log("AI raw response:", rawContent.substring(0, 500));
    
    // Извлекаем JSON из markdown code block (если есть)
    const cleanedContent = extractJsonFromMarkdown(rawContent);
    
    // Пробуем распарсить JSON
    let result;
    try {
      result = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", cleanedContent.substring(0, 200));
      // Пробуем найти JSON в любом месте текста
      const jsonInText = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonInText) {
        try {
          result = JSON.parse(jsonInText[0]);
        } catch (e2) {
          return NextResponse.json(
            { error: "AI returned invalid JSON format" },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "AI returned non-JSON response" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      optimizedContent: result.optimizedContent || result.content || cleanedContent,
      suggestedTags: result.suggestedTags || result.tags || [],
    });
  } catch (error) {
    console.error("AI optimization error:", error);
    return NextResponse.json(
      { error: "AI optimization failed" },
      { status: 500 }
    );
  }
}

// Извлекает JSON из markdown code block (по аналогии с aibot_tg/utils.py)
function extractJsonFromMarkdown(text: string): string {
  // Удаляем обёртку ```json ... ``` или ``` ... ```
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  return text.trim();
}
