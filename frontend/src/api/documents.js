import client from './client'
export const uploadDocument    = (formData) => client.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const getDocuments      = ()         => client.get('/documents')
export const saveAsAssignment  = (id)       => client.post(`/documents/${id}/save-as-assignment`)
export const reprocessDocument = (id)       => client.post(`/documents/${id}/re-process`)
