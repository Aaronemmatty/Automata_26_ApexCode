import client from './client'

// ── Conversations ───────────────────────────────────────────

export async function createConversation({ mode = 'general', document_id = null, title = null } = {}) {
  const { data } = await client.post('/chat/conversations', { mode, document_id, title })
  return data
}

export async function listConversations() {
  const { data } = await client.get('/chat/conversations')
  return data
}

export async function getConversation(conversationId) {
  const { data } = await client.get(`/chat/conversations/${conversationId}`)
  return data
}

export async function deleteConversation(conversationId) {
  await client.delete(`/chat/conversations/${conversationId}`)
}

// ── Messages ────────────────────────────────────────────────

export async function sendMessage(conversationId, message) {
  const { data } = await client.post(`/chat/conversations/${conversationId}/messages`, { message })
  return data
}

// ── Viva ────────────────────────────────────────────────────

export async function startViva(documentId, numQuestions = 5) {
  const { data } = await client.post('/chat/viva', {
    document_id: documentId,
    num_questions: numQuestions,
  })
  return data
}
