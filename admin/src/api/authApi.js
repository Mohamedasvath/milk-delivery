import api from "./api";

// LOGIN (IMPORTANT FIX)
export const loginOwner = (data) => {
  return api.post("/auth/login", {
    phone: String(data.phone).trim(),
    pin: String(data.pin).trim(),
  });
};

// SIGNUP
export const createOwner = (data) => {
  return api.post("/auth/create-owner", data);
};

// RESET PIN
export const resetPin = (data) => {
  return api.put("/auth/reset-pin", data);
};