import client from "./client";
export const getAlerts = (unreadOnly = false) =>
  client.get("/alerts/", { params: { unread_only: unreadOnly } });
export const refreshAlerts = () => client.post("/alerts/refresh");
export const markAlertRead = (id) => client.patch(`/alerts/${id}/read`);
