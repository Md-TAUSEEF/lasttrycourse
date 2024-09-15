const express = require("express");
const router=express.Router();
const usercont = require("../Controller/User_controller");
const singleUpload = require("../Middleware/Multer")
const {authmiddleware,Authenticatedadmin}=require("../Middleware/Aut_middlewer");
router.post("/register",singleUpload,usercont.Register);
router.post("/login",usercont.loginUser)
router.get("/logout",usercont.Logout);
router.get("/me",authmiddleware,usercont.Getmyprofile);
router.put("/changeps",authmiddleware,usercont.ChangePassword);
router.put("/update",authmiddleware,usercont.UpdateProfile);
router.post("/forwordpass",usercont.ForgetPassword);
router.put("/resetpassword/:token",usercont.ResetPassword);
router.post("/addtoplaylist",authmiddleware,usercont.AddtoPlayList);
router.delete("/deletplaylist",authmiddleware,usercont.DeleteFromPlaylist);
router.put("/updateprofilepecture",authmiddleware,singleUpload,usercont.UpdateProfilepicture);


//<===============Admin route=================>//
router.get("/admin/user",authmiddleware,Authenticatedadmin,usercont.getallUser);
router.put("/admin/updateuserrole/:id",authmiddleware,Authenticatedadmin,usercont.Updateuserrole);
router.delete("/admin/deletuser/:id",authmiddleware,Authenticatedadmin,usercont.deleteUser);
router.delete("/admin/deletmyprofile",authmiddleware,Authenticatedadmin,usercont.deleteMyProfile);


module.exports=router;