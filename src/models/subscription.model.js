import mongoose, { Schema } from "mongoose";


const SubscriptionSchema = new Schema({
  // the user is subscribing to the channel
  subscriber: {
    type: Schema.Types.ObjectId,
    ref: "User"

  },
  //whom the user is subscribing 
  channel: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }

},{
  timestamps: true
})

export const subscription = mongoose.model("Subscription", SubscriptionSchema)