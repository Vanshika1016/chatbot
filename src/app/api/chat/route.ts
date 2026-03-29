import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function POST(req: NextRequest) {
  try {
    const { message, history, language, level } = await req.json();

    if (!language || !level) {
      return NextResponse.json(
        { error: 'Language and level are required.' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a friendly, encouraging language tutor.

Language: ${language}
Student Level: ${level}

Guidelines:
- Speak mostly in ${language}, mixing in English explanations when helpful
- Adjust vocabulary and grammar complexity to the ${level} level
- Gently correct any mistakes the student makes, explaining the correction briefly
- Occasionally give small exercises, prompts, or vocabulary quizzes
- Keep responses concise and natural — this is a conversation, not a lecture
- Be warm, patient, and encouraging`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((h: Message) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = completion.choices[0].message.content ?? '';
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get a response. Please try again.' },
      { status: 500 }
    );
  }
}
