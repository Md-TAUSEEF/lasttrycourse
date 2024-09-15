const ErrorResponse = require("../Utils/ErrorHandlear");
const User = require("../Modules/User_module");
const SendToken = require("../Utils/SendToken");
const sendEmail = require("../Utils/SendEmail");
const dotenv = require("dotenv");
dotenv.config({ path: "./Config/.env" });
const Course = require("../Modules/Course_module");
const cloudinary = require("cloudinary");
const getDataUri=require("../Utils/datauri");
const crypto = require("crypto");
//<==============Register==================>//

const Register = async (req, res, next) => {
    try {

        const file=req.file;
        const { name, email, password } = req.body;
        console.log("this is name ",name);
        console.log("this is email ",email);
        console.log("this is password of email",password);
        console.log("this is file ",file)

        if (!name || !email || !password || !file) {
            return next(new ErrorResponse('Please fill in all required fields', 400));
        }

        const user = await User.findOne({ email });

        if (user) {
            return next(new ErrorResponse('This user already exists in the database', 409));
        }

     //<=============yah line file ka url lene ke liye use karte hai==============>//

        const fileurl=getDataUri(file);
        const mycloud=await cloudinary.v2.uploader.upload(fileurl.content)

        const usercrt = await User.create({
            name,
            email,
            password,
            avatar: {
                public_id: mycloud.public_id,
                url: mycloud.secure_url,
            },
        });

        

        SendToken(res, usercrt, "Register Successfully", 201);

    } catch (err) {
        console.error('Error:', err);  
        next(new ErrorResponse('Failed to register user', 500));
    }
}

//<==================loginUser==========================>

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new ErrorResponse("Please provide email and password", 400));
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return next(new ErrorResponse("Invalid email or password", 401));
        }

        const isPasswordMatched = await user.comparePassword(password);

        if (!isPasswordMatched) {
            return next(new ErrorResponse("Invalid email or password", 401));
        }

        SendToken(res, user, "Login Successfully", 200);

    } catch (error) {
        console.error('Error:', error);  
        next(new ErrorResponse('Failed to log in user', 500));
    }
}

//<============LogoutUser============================>

    const Logout=async(req,res,next)=>{
        try{

            res.status(200).cookie("token",null,{
                expires:new Date(Date.now()),
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', 
                sameSite: 'Strict',
            }).json({msg:"logout sucessfully",
                sucess:true
            })

        }catch(error){
            next(new ErrorResponse('logut user error', 500));
        }
    }


//<==============GetMyprofile=====================>
    const Getmyprofile=async(req,res,next)=>{
        try{
            const user= await User.findById(req.user._id);

            res.status(200).json({
                sucess:true,
                user
            })
        }catch(error){
            next(new ErrorResponse('get my profile error', 500));
        }
    }

    const UpdateProfilepicture=async(req,res,next)=>{
        try{
            const file=req.file;
            const user=await User.findById(req.user._id);
           const fileurl=getDataUri(file);
           const mycloud=await cloudinary.v2.uploader.upload(fileurl.content);
           await cloudinary.v2.uploader.destroy(user.avatar.public_id)

           user.avatar = {
            public_id: mycloud.public_id,
            url: mycloud.secure_url,
          };
        
          await user.save();

        }catch(error){
            next(new ErrorResponse("this error is coming then your is updated"));
        }
    }



//<==============change Password========================>//

const ChangePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;


        const user = await User.findById(req.user.id).select("+password");

        if (!user) {
            return next(new ErrorResponse("User not found", 404));
        }


        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return next(new ErrorResponse("Old password is incorrect", 401));
        }

        // Set new password
        user.password = newPassword;

        // Save user with new password
        await user.save();

        res.status(200).json({
            status: true,
            msg: "Password changed successfully"
        });

    } catch (error) {
        next(new ErrorResponse("Error changing password", 500));
    }
};


//<=================Update profile==============================>
    const UpdateProfile = async (req, res, next) => {
        try {
          const { name, email } = req.body;
          const user = await User.findById(req.user._id);
      
          if (name) {
            user.name = name;
          }
      
          if (email) {
            user.email = email;
          }
      
          // Save the updated user
          await user.save();
      
          res.status(200).json({
            message: "User updated successfully",
            status: true,
            user // Optionally return the updated user data
          });
        } catch (error) {
          next(new ErrorResponse("An error occurred while updating the profile", 500));
        }
      }
      

//<=============ForgetPassword===============================>//

const ForgetPassword=async(req,res,next)=>{
    try{
        const{email}=req.body;

        const user=await User.findOne({email});

        if(!user){
            next(new ErrorResponse("Usr not Found ",400));
        }

        //Agar user found kar liya hai to send kare token password forword karne ke liye
        const resetToken=await user.getResetToken();
        await user.save();

        const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

        const message=`Click on the  linke for reset yor password ${url}.if you have not request then please ignore it.`;
        //send token by email
      await  sendEmail(user.email,"Const Bundler Reset Password",message)

        res.status(201).json({msg:`RestToken token has been send to ${user.email}`,
            status:true
        })

    }catch(error){
        next(new ErrorResponse("this error is coming when Forgetpassword is doing",500));
    }
}


//<=================ResetPassword==============================>
    const ResetPassword = async (req, res, next) => {
        try {
            const { token } = req.params;
            const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    console.log("token",resetPasswordToken);
            const user = await User.findOne({
                resetPasswordToken,
                resetPasswordExpire: { $gt: Date.now() },
            });
 
            if (!user) {
                return next(new ErrorResponse("Token is invalid or has expired", 400));
            }
    
            user.password = req.body.password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
    
            res.status(200).json({
                msg: "Password changed successfully",
                success: true
            });
    
        } catch (error) {
            next(new ErrorResponse("Error during reset password process", 500));
        }
    }

//<================Add To Playlist====================>//
const AddtoPlayList = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        const course = await Course.findById(req.body.id);
        
        if (!course) {
            return next(new ErrorResponse("Invalid Course ID", 400));
        }

        const itemExist = user.playlist.find((item) => item.course.toString() === course._id.toString());

        if (itemExist) {
            return next(new ErrorResponse("Item already exists in the playlist", 409));
        }

        user.playlist.push({
            course: course._id,
            poster: course.poster.url,
        });

        await user.save();

        res.status(201).json({
            msg: "Successfully added to playlist",
            status: true
        });

    } catch (error) {
        next(new ErrorResponse("An error occurred while adding to playlist", 500));
    }
};


//<================Delet to Playlist=========================>//
const DeleteFromPlaylist = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        const course = await Course.findById(req.query.id);

        if (!course) {
            return next(new ErrorResponse("Invalid Course ID", 400));
        }

        const newPlayList = user.playlist.filter((item) => item.course.toString() !== course._id.toString());

        user.playlist = newPlayList;

        await user.save();

        res.status(200).json({
            msg: "Successfully removed from playlist",
            status: true
        });

    } catch (error) {
        next(new ErrorResponse("An error occurred while deleting from playlist", 500));
    }
};



//<===============Admin controller=====================>


//<=============get all user data================>//

    const getallUser=async(req,res)=>{
        try{
            const user=await User.find({});

            res.status(210).json({status:true,
                user
            })
        }
        catch(error){
            console.log("this error is coming when admin user getting");
        }
    }


  //<============update user role====================>//

    const Updateuserrole = async (req, res, next) => {
        try {
            const user = await User.findById(req.params.id);
    
            if (!user) {
                return next(new ErrorResponse("User not found", 404));
            }
    
            if (user.role === "user") {
                user.role = "admin";
            } else {
                user.role = "user";
            }
    
            await user.save();
    
            res.status(200).json({
                msg: "User role updated successfully",
                status: true
            });
    
        } catch (error) {
            next(new ErrorResponse("Error updating user role", 500));
        }
    }
    
//<=================Delet user ==============>//

const deleteUser = async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      // Check if the user has an avatar with a public_id before trying to destroy it
      if (user.avatar && user.avatar.public_id) {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      }
  
      await User.deleteOne({ _id: user._id });
      // Cancel subscription logic can go here if needed
  
      res.status(200).json({
        success: true,
        message: "User Deleted Successfully",
      });
  
    } catch (error) {
      // Forward the error to the error handling middleware with a proper message
      next(new ErrorResponse(`Failed to delete the user: ${error.message}`, 500));
    }
  };


//<===============Delet myprofile================>//
const deleteMyProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      // Destroy user's avatar from Cloudinary
      if (user.avatar && user.avatar.public_id) {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      }
  
      // Delete the user
      await User.deleteOne({ _id: user._id });
  
      // Clear the token cookie and send a success response
      res.status(200).cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,  // For better security
      }).json({
        success: true,
        message: "User Deleted Successfully",
      });
    } catch (error) {
      // Log the error and send an error response to the client
      console.error("Error while deleting the profile:", error.message);
      res.status(500).json({
        success: false,
        message: "An error occurred while deleting the profile",
      });
    }
  };
  
    
module.exports = { Register, loginUser,Logout,Getmyprofile,
    ChangePassword,UpdateProfile,ForgetPassword,ResetPassword,
    AddtoPlayList,DeleteFromPlaylist,UpdateProfilepicture,



//<=============Admin route===============>//
getallUser, Updateuserrole,deleteUser, deleteMyProfile



};
