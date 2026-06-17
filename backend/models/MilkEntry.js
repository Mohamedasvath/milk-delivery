import mongoose from "mongoose";

const milkEntrySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    morningMilk: {
      type: Number,
      default: 0,
    },

    eveningMilk: {
      type: Number,
      default: 0,
    },

    rate: {
      type: Number,
      required: true,
    },

    totalMilk: {
      type: Number,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Faster duplicate checking
milkEntrySchema.index({
  customerId: 1,
  date: 1,
});



const MilkEntry = mongoose.model(
  "MilkEntry",
  milkEntrySchema
);


export default MilkEntry;