import axios from "axios";
import crypto from "crypto";
import Request from "../database/requestDB.js";

const CASHFREE = {
  APP_ID: process.env.CF_APP_ID,
  SECRET_KEY: process.env.CF_SECRET,
  BASE_URL: "https://sandbox.cashfree.com/pg",
};

export const order = async (req, res) => {
  try {
    const { id: requestId } = req.params;
    const { email, phone, name } = req.body;

    if (!requestId || !email || !phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const userReq = await Request.findById(requestId);

    if (!userReq || !userReq.paymentAmount) {
      return res.status(404).json({ message: "Invalid request or amount not set" });
    }

    const orderId = `REQ_${requestId}_${Date.now()}`;

    const response = await axios.post(
      `${CASHFREE.BASE_URL}/orders`,
      {
        order_id: orderId,
        order_amount: userReq.paymentAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: userReq.userId.toString(),
          customer_email: email,
          customer_phone: phone,
          customer_name: name || "Customer",
        },
        order_meta: {
          return_url: "http://localhost:5173/payment-success?order_id={order_id}",
        },
      },
      {
        headers: {
          "x-client-id": CASHFREE.APP_ID,
          "x-client-secret": CASHFREE.SECRET_KEY,
          "x-api-version": "2023-08-01",
          "Content-Type": "application/json",
        },
      }
    );

    const { payment_session_id } = response.data;

    await Request.findByIdAndUpdate(requestId, {
      paymentStatus: "Pending",
      cashfreeOrderId: orderId,
      cashfreePaymentSession: payment_session_id,
    });

    res.status(200).json({
      paymentSessionId: payment_session_id,
      orderId,
    });

  } catch (error) {
    console.error("Cashfree Error:", error?.response?.data || error.message);
    res.status(500).json({
      message: "Cashfree order creation failed",
    });
  }
};



export const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await Request.findById(id);
    if (!request || !request.cashfreeOrderId) {
      return res.status(404).json({ error: "Order not found" });
    }

    const response = await axios.get(
      `https://sandbox.cashfree.com/pg/orders/${request.cashfreeOrderId}`,
      {
        headers: {
          "x-client-id": process.env.CF_APP_ID,
          "x-client-secret": process.env.CF_SECRET,
          "x-api-version": "2023-08-01",
        },
      }
    );

    const orderStatus = response.data.order_status;

    if (orderStatus === "PAID") {
      request.paymentStatus = "completed"; // MUST MATCH ENUM
      await request.save();

      return res.json({
        success: true,
        status: "completed",
      });
    }

    return res.json({
      success: false,
      status: orderStatus,
    });

  } catch (error) {
    console.error("Payment verify error:", error.response?.data || error);
    return res.status(500).json({ error: "Payment verification failed" });
  }
};