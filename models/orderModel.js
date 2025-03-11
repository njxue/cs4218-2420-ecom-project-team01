import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    products: {
      type: [{
        type: mongoose.ObjectId,
        ref: "Products",
      }],
      required: [true, "Products are required"],
      validate: {
        validator: function(v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "Order must contain at least one product"
      }
    },
    payment: {
      type: Object,
      required: [true, "Payment information is required"]
    },
    buyer: {
      type: mongoose.ObjectId,
      ref: "users",
      required: [true, "Buyer information is required"]
    },
    status: {
      type: String,
      default: "Not Process",
      enum: ["Not Process", "Processing", "Shipped", "Deliverd", "Cancel"],
      required: true
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);