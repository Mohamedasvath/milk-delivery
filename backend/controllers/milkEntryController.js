import MilkEntry from "../models/MilkEntry.js";
import Customer from "../models/Customer.js";

// GET ALL MILK ENTRIES
export const getMilkEntries = async (req, res) => {
  try {
    const { ownerId } = req.query;

    if (!ownerId) {
      return res.status(400).json({
        message: "Owner ID is required",
      });
    }

    const entries = await MilkEntry.find({
      ownerId,
    })
      .populate("customerId", "name status")
      .sort({ date: -1 });

    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET SINGLE ENTRY
export const getMilkEntryById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { ownerId } = req.query;

    const entry = await MilkEntry.findOne({
      _id: id,
      ownerId,
    }).populate(
      "customerId",
      "name status"
    );

    if (!entry) {
      return res.status(404).json({
        message: "Entry not found",
      });
    }

    res.status(200).json(entry);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
 
//bulk entry


// GET BULK SHEET FOR DATE (REPLACED & FIXED)
export const getBulkSheetByDate = async (req, res) => {
  try {
    const { ownerId, date } = req.query;

    if (!ownerId || ownerId === "undefined" || !date) {
      return res.status(400).json({ message: "OwnerId and Date are required parameters." });
    }

    console.log("=== API LEDGER REACHED ===");
    console.log("Query Owner ID:", ownerId);
    console.log("Query String Date:", date);

    // 1. Flexible Owner Field Discovery Query Matrix
    // Schema-la 'ownerId' nu irundhalum சரி, 'owner' nu irundhalum சரி, ithu catch panni eduthurum.
    const customers = await Customer.find({
      $or: [
        { ownerId: ownerId },
        { owner: ownerId }
      ]
    });

    console.log(`Database match raw find count: ${customers.length}`);

    if (!customers || customers.length === 0) {
      return res.status(200).json([]); // Graceful exit if no customers saved under this owner
    }

    // 2. Safe Dynamic Active Status Check
    
    const activeCustomers = customers.filter(c => {
      if (c.status === undefined || c.status === null) return true; // Default schema fallback if missing
      return c.status.toLowerCase() === "active";
    });

    if (activeCustomers.length === 0) {
      console.log("Customers found, but none are marked 'active'.");
      return res.status(200).json([]);
    }

    // 3. Setup Explicit Pure ISO Date Range Parsing Boundaries
    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setUTCHours(23, 59, 59, 999));

    // 4. Find matching logged entries for target date session
    const existingEntries = await MilkEntry.find({
      ownerId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    // 5. Build Unified Data Matrix Response Output
    const bulkSheet = activeCustomers.map((customer) => {
      const entry = existingEntries.find(
        (e) => e.customerId?.toString() === customer._id.toString()
      );

      return {
        customerId: customer._id,
        name: customer.name || "Unnamed Client Profile", 
        rate: entry ? entry.rate : (customer.defaultRate || customer.rate || 40), 
        morningMilk: entry ? entry.morningMilk : 0,
        eveningMilk: entry ? entry.eveningMilk : 0,
        entryId: entry ? entry._id : null,
        isSaved: entry ? true : false
      };
    });

    return res.status(200).json(bulkSheet);

  } catch (error) {
    console.error("Bulk Sheet Controller Critical Error:", error);
    return res.status(500).json({ message: "Internal Server Error compiling dynamic sheet." });
  }
};
// CREATE ENTRY
export const createMilkEntry = async (
  req,
  res
) => {
  try {
    const {
      ownerId,
      customerId,
      date,
      morningMilk,
      eveningMilk,
      rate,
    } = req.body;

    if (
      !ownerId ||
      !customerId ||
      !date ||
      !rate
    ) {
      return res.status(400).json({
        message:
          "Owner, Customer, Date and Rate are required",
      });
    }

    const customer =
      await Customer.findOne({
        _id: customerId,
        ownerId,
      });

    if (!customer) {
      return res.status(404).json({
        message:
          "Customer not found for this owner",
      });
    }

    const startDate = new Date(date);
    startDate.setHours(
      0,
      0,
      0,
      0
    );

    const endDate = new Date(date);
    endDate.setHours(
      23,
      59,
      59,
      999
    );

    const existingEntry =
      await MilkEntry.findOne({
        ownerId,
        customerId,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      });

    if (existingEntry) {
      return res.status(400).json({
        message:
          "Milk entry already exists for this date",
      });
    }

    const totalMilk =
      Number(morningMilk || 0) +
      Number(eveningMilk || 0);

    const amount =
      totalMilk * Number(rate);

    const entry =
      await MilkEntry.create({
        ownerId,
        customerId,
        date,
        morningMilk:
          Number(morningMilk) || 0,
        eveningMilk:
          Number(eveningMilk) || 0,
        rate: Number(rate),
        totalMilk,
        amount,
      });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE ENTRY
export const updateMilkEntry = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { ownerId } = req.body;

    const entry =
      await MilkEntry.findOne({
        _id: id,
        ownerId,
      });

    if (!entry) {
      return res.status(404).json({
        message: "Entry not found",
      });
    }

    const {
      morningMilk,
      eveningMilk,
      rate,
    } = req.body;

    entry.morningMilk =
      morningMilk ??
      entry.morningMilk;

    entry.eveningMilk =
      eveningMilk ??
      entry.eveningMilk;

    entry.rate =
      rate ?? entry.rate;

    entry.totalMilk =
      Number(entry.morningMilk) +
      Number(entry.eveningMilk);

    entry.amount =
      entry.totalMilk *
      Number(entry.rate);

    await entry.save();

    res.status(200).json(entry);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// DELETE ENTRY
export const deleteMilkEntry = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { ownerId } = req.body;

    const entry =
      await MilkEntry.findOne({
        _id: id,
        ownerId,
      });

    if (!entry) {
      return res.status(404).json({
        message: "Entry not found",
      });
    }

    await MilkEntry.findByIdAndDelete(id);

    res.status(200).json({
      message:
        "Milk Entry Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};