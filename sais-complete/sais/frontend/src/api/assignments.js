import client from "./client";
export const getAssignments = (params) =>
  client.get("/assignments/", { params });
export const getUpcoming = (days = 7) =>
  client.get("/assignments/upcoming", { params: { days } });
export const createAssignment = (data) => client.post("/assignments/", data);
export const updateAssignment = (id, data) =>
  client.patch(`/assignments/${id}`, data);
export const deleteAssignment = (id) => client.delete(`/assignments/${id}`);
export const estimateTime = (data) =>
  client.post("/assignments/estimate-time", data);
