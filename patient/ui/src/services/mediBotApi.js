const MEDIBOT_API_URL =
  import.meta.env.VITE_MEDIBOT_API_URL || 'http://127.0.0.1:8000/api/v1/chat';

export async function sendMessageToMediBot(question, history = []) {
  const response = await fetch(MEDIBOT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success || typeof data?.data?.answer !== 'string') {
    throw new Error(`MediBot API error: ${response.status}`);
  }

  return data.data.answer;
}
