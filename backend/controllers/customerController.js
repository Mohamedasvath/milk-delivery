import Customer from "../models/Customer.js";
import mongoose from "mongoose";

// GET ALL CUSTOMERS (Isolated by Owner)
export const getCustomers = async (req, res) => {
  try {
    const { ownerId } = req.query;

    if (!ownerId || ownerId === "undefined") {
      return res.status(400).json({ message: "Valid Owner ID is required" });
    }

    const customers = await Customer.find({ ownerId: new mongoose.Types.ObjectId(ownerId) })
      .sort({ createdAt: -1 });

    res.status(200).json(customers);
  } catch (error) {
    console.error("GET ALL Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// CREATE CUSTOMER
export const createCustomer = async (req, res) => {
  try {
    console.log("SERVER RECEIVED BODY:", req.body);
    const { ownerId, name, status } = req.body;

    if (!ownerId || ownerId === "undefined") {
      return res.status(400).json({ message: "Owner ID is required and cannot be undefined" });
    }
    if (!name) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    const customer = await Customer.create({
      ownerId: new mongoose.Types.ObjectId(ownerId), // Hard cast to ObjectId
      name,
      status: status || "active",
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error("SERVER CREATE Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE CUSTOMER
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerId, name, status } = req.body;

    if (!ownerId || ownerId === "undefined") {
      return res.status(400).json({ message: "Owner ID is required" });
    }

    const customer = await Customer.findOne({
      _id: id,
      ownerId: new mongoose.Types.ObjectId(ownerId),
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found or unauthorized" });
    }

    customer.name = name ?? customer.name;
    customer.status = status ?? customer.status;

    await customer.save();
    res.status(200).json(customer);
  } catch (error) {
    console.error("SERVER UPDATE Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE CUSTOMER
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerId } = req.body;

    if (!ownerId || ownerId === "undefined") {
      return res.status(400).json({ message: "Owner ID is required" });
    }

    const customer = await Customer.findOneAndDelete({
      _id: id,
      ownerId: new mongoose.Types.ObjectId(ownerId),
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found or unauthorized" });
    }

    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("SERVER DELETE Error:", error);
    res.status(500).json({ message: error.message });
  }
};