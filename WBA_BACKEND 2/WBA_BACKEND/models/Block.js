const mongoose = require("mongoose");

const BlockSchema = new mongoose.Schema(
{
    name:{
        type:String,
        required:true
    },

    type:{
        type:String,
        required:true
    },

    category:{
        type:String,
        enum:["basic","advanced"],
        required:true
    },

    view:[
        {
            type:String
        }
    ],

    icon:{
        type:String,
        default:""
    },

    previewImage:{
        type:String,
        default:""
    },

    defaultData:{
        type:Object,
        default:{}
    }

},
{
    timestamps:true
});

module.exports = mongoose.model("Block", BlockSchema);