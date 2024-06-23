import { OpenAI } from 'openai'


export const ollamaApiCall = async (
  content: string,
  callback: (str: string) => void
) => {

  const openai = new OpenAI({
    baseURL: 'http://agingkills.eu:8088/v1', // change to http://localhost:8088/v1 for local launch
    apiKey: 'ollama', // required but unused
    dangerouslyAllowBrowser: true
  });

  const response = await openai.chat.completions.create({
    messages: [{ content, role: 'user'}],
    model: 'groq/llama3-70b-8192',
    stream: true,
  });

  for await (const part of response) {
    callback(part.choices[0]?.delta?.content || '');
  }
}
