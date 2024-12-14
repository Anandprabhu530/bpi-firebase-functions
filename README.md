# BPI - (Basic Payment Interface)

I developed this project in order to mimic and understand the behavior of UPI system. Through out the project, I understood a how payments are generally processed in UPI with NPCI.

This repository consists of code related to firebase functions which is hosted in cloud run by Google Cloud.

## Project Components:

- Firebase Functions: These functions trigger the payment processing service and handle authentication

## How it Works:

Firebase functions publish a message to Pub/Sub trigger service and checks for the user authenticity, balance and other transaction related data.

The Pub/Sub message consists of data related to transactions like senderId, receiverId, TransactionId, amonunt. This data is consumed by cloud run with a trigger-payment subscription which is subscribed to cloud run.
