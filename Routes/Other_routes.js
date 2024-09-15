const express=require("express");
const router=express.Router();
const{authmiddleware,Authenticatedadmin}=require("../Middleware/Aut_middlewer");
const OtherRts=require("../Controller/Other_controller");
router.post("/contactform",OtherRts. Contactform);
router.post("/contactreq",OtherRts.courseRequest)
router.get("/admin/stats",authmiddleware,Authenticatedadmin,OtherRts.getDashboardStats)
module.exports=router;