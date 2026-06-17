import Owner from "../models/Owner.js";

export const getSettings = async (req, res) => {
  const owner = await Owner.findById(req.user.id).select("-pin");
  res.json({ success: true, data: owner });
};

export const updateBusiness = async (req, res) => {
  const owner = await Owner.findByIdAndUpdate(req.user.id, 
    { businessDetails: req.body }, { new: true });
  res.json({ success: true, data: owner });
};

export const updatePreferences = async (req, res) => {
  const owner = await Owner.findByIdAndUpdate(req.user.id, 
    { preferences: req.body }, { new: true });
  res.json({ success: true, data: owner });
};