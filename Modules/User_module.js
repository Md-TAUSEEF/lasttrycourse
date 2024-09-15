const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config({ path: "./Config/.env" });
const bcrypt = require('bcryptjs');
const crypto = require("crypto");//ishka kam hota h token send karna email par
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
    validate: [validator.isEmail, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  subscription: {
    id: String,
    status: String,
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  playlist: [
    {
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
      poster: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,  
});


// Encrypting password before saving user
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare user password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Adding a method to the user schema to generate JWT token
userSchema.methods.getJWTToken = function() {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });
}


//<=============Forword password====================>

  userSchema.methods.getResetToken=function(){
  const resetToken=crypto.randomBytes(20).toString("hex");
 this.resetPasswordToken= crypto.createHash("sha256").update(resetToken).toString("hex");  //ap ham token to has karenege ishke liye ham sha256 ko kiya h aur bhi method h

this.resetPasswordExpire=Date.now() + 15 * 60 * 1000;
  return resetToken;
  }



const User = mongoose.model('User', userSchema);

module.exports = User;
