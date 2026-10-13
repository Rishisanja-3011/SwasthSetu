const MEDIBOT_API_URL = 'http://127.0.0.1:8000/api/v1/chat';

/**
 * Send a question to the MediBot FastAPI backend.
 *
 * history must contain only:
 * {
 *   role: 'user' | 'assistant',
 *   content: '...'
 * }
 */
export async function sendMessageToMediBot(question, history = []) {
  const response = await fetch(MEDIBOT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      history,
    }),
  });

  if (!response.ok) {
    throw new Error(`MediBot API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success || !data.data?.answer) {
    throw new Error('Invalid response received from MediBot');
  }

  return data.data.answer;
}
