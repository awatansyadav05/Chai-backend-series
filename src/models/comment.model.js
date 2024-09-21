import mongoose,{plugin, Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema (
  {
    content :{
      type: String,
      required: true
    },
    video:{
      type: Schema.Types.ObjectId,
      ref: "video"
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }

  },
  {
    timestamps: true
  }
)

commentSchema.plugin(mongooseAggregatePaginate)

//use of plugin it only used to ki kha se paginate dena hai.. divide the pagination

export const Comment = mongoose.model( "Comment", commentSchema)