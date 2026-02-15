
import dotenv from 'dotenv';
import OpenAI from "openai";
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const apiKey = process.env.VITE_GROQ_API_KEY;

const groq = new OpenAI({
  apiKey: apiKey,
  baseURL: "https://api.groq.com/openai/v1"
});

async function main() {
  try {
    const models = await groq.models.list();
    console.log("--- Llama Models ---");
    models.data
      .filter(m => m.id.toLowerCase().includes('llama'))
      .forEach(m => console.log(m.id));
    console.log("--------------------");
  } catch (error) {
    console.error("Error listing models:");
    console.error(error.message);
  }
}

main();
