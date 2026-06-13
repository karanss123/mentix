import api from "./axios";

export const fetchCurrentStore = async () => {
  const res = await api.get("/api/stores/current");
  return res.data; // { _id, name, ... }
};