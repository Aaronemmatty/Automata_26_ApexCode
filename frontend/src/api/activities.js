import client from './client'
export const getActivities    = ()      => client.get('/activities')
export const createActivity   = (data)  => client.post('/activities', data)
export const deleteActivity   = (id)    => client.delete(`/activities/${id}`)
export const refreshConflicts = ()      => client.post('/activities/refresh-conflicts')
