const mongoose = require("mongoose")
const bcrypt = require("becrypt")

const vendorSchema = new mongoose({
    name: {
        type: String,
        require: [true, "please enter the name"],
        maxLength: [40, "name must be less than 40 characters"],
        match: [/^[A-Za-z]{2,}(?: [A-Za-z]+)*$/, "name is to short or cant have symbols or numbers"]
    },
    email: {
        type: String,
        require: [true, "please enter the Email"],
        unique: [true, "Email is token try another one"],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email address"]
    },
    password: {
        type: String,
        required: [true, "please enter the password"],
        match: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            "password at least one uppercase one lowercase one number one special character Minimum 8 characters, only from these allowed symbols"]
    },
    address: {
        country: {
            type: String,
            required: [true, "please Select The Country"],
            enum: ["egypt", "saudi Arabia", "jordan", "lebanon", "syria", "iraq", "libya", "algeria", "morocco",],
            default: "egypt",
            set: (value) => value.toLowerCase(),
        },
    },
    product: [
        {
            type: mongoose.Schema.Types.ObjectId, ref: "Product",
        },
    ],

});

vendorSchema.pre("save", async function (next) {
    console.log(this);
    var salt = await bcrypt.genSalt(10);
    var hashpass = await bcrypt.hash(this.password, salt);
    this.password = hashpass;
    next();
});

const vendorModel = mongoose.model("vendor", vendorSchema)
module.exports = vendorModel;
