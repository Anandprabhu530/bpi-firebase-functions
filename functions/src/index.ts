import {initializeApp} from "firebase-admin/app";
import {Firestore} from "firebase-admin/firestore";
import {onCall} from "firebase-functions/v2/https";
import {PubSub} from "@google-cloud/pubsub";

initializeApp();

const firestore = new Firestore();
const pubSubClient = new PubSub();
const triggerServiceId = "trigger-payment";

/**
 * Cloud Function triggered by a client-side callable function.
 * Validates user accounts, performs balance checks, initiates transactions,
 * and publishes messages to a Pub/Sub topic for further processing.
 *
 * @param {object} request - Incoming request object with payment data.
 *   @param {object} request.data.payment - Payment details sent from client.
 *     @param {string} senderId - ID of the sender account.
 *     @param {string} receiverId - ID of the receiver account.
 *     @param {number} amount - Payment amount.
 *     @param {string} pin - Sender's PIN for authentication.
 *     @param {string} transactionId - Unique identifier for transaction.
 *
 * @returns {object} - Response object containing status, code, and error code.
 *   @param {string} status - Description of the payment processing state.
 *   @param {number} code - HTTP status code indicating success or error.
 *   @param {number} errorCode - Custom error code for specific errors.
 *
 * @param {number} errorCode - Type of error codes.
 *  0 - No error occured.
 *  1 - User does not exists.
 *  2 - User pin is not matched.
 *  3 - User does not have sufficient balance in his account.
 *  4 - Internal error occured.
 */

export const triggerpayment = onCall(
  {cors: [/firebase\.com$/, "http://localhost:3000"]},
  async (request) => {
    const {senderId, receiverId, amount, transactionId} = request.data.payment;
    const senderInfo = await firestore
      .collection("account")
      .doc(senderId)
      .get();
    const receiverInfo = await firestore
      .collection("account")
      .doc(receiverId)
      .get();

    const backendAccountData = senderInfo.data();
    if (!backendAccountData || !receiverInfo) {
      return {status: "User does not exists", errorCode: 1};
    }
    if (amount > backendAccountData.balance) {
      return {status: "Insufficinet Balance", errorCode: 3};
    }

    const data = JSON.stringify({senderId, receiverId, amount, transactionId});
    const dataBuffer = Buffer.from(data);

    const topic = pubSubClient.topic(triggerServiceId);
    try {
      const messageId = await topic.publishMessage({data: dataBuffer});
      console.log(`Message ${messageId} published.`);
    } catch (error) {
      console.log("error");
      console.log(error);
      return {status: "Error processing", errorCode: 4};
    }
    return {
      status: "Payment Initiated",
      errorCode: 0,
    };
  }
);
