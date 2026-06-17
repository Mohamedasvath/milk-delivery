import api from "./api"; 

export const getCustomers = async (ownerId) => {
  // Query param template string correct-ah check pannunga
  const res = await api.get(`/customers?ownerId=${ownerId}`);
  return res.data;
};

export const createCustomer = async (data) => {
  const res = await api.post("/customers", data);
  return res.data;
};

export const updateCustomer = async (id, data) => {
  const res = await api.put(`/customers/${id}`, data);
  return res.data;
};

export const deleteCustomer = async (id, ownerId) => {
  const res = await api.delete(`/customers/${id}`, { data: { ownerId } });
  return res.data;
};