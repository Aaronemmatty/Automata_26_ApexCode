import client from './client'

export const uploadTimetable = (formData) =>
  client.post('/timetable/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const bulkSaveTimetableEntries = (entries) =>
  client.post('/timetable/entries/bulk', entries)

export const getTimetableEntries = () => client.get('/timetable/entries')
export const getTodayTimetable = () => client.get('/timetable/today')
export const deleteTimetableEntry = (id) => client.delete(`/timetable/entries/${id}`)

export const getMorningCheckin = () => client.get('/timetable/reminders/morning-checkin')
export const getUnmarkedReminders = () => client.get('/timetable/reminders/unmarked')
export const getEndOfDaySummary = () => client.get('/timetable/reminders/end-of-day')
