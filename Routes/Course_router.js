const express = require("express");
const router = express.Router();
const singleUpload = require("../Middleware/Multer")
const CourseController = require("../Controller/Course_controller");
const {authmiddleware, Authenticatedadmin,AuthentiSubscription } = require("../Middleware/Aut_middlewer");


router.get("/all", CourseController.GetallCourse);
router.post("/createcrc",authmiddleware,Authenticatedadmin,singleUpload,CourseController.CreateCourse);
//this route is get course lecture
router.get("/course/:id",authmiddleware,Authenticatedadmin,AuthentiSubscription,singleUpload,CourseController.GetCourseLecture);
router.post("/course/:id",authmiddleware,Authenticatedadmin,singleUpload,CourseController.AddCourseLecture);
router.delete("/course/:id",authmiddleware,Authenticatedadmin,singleUpload,CourseController.deleteCourse);
router.delete("/deletlectur",authmiddleware,Authenticatedadmin,singleUpload,CourseController.deleteLecture);


module.exports = router;
