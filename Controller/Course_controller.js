const Course = require("../Modules/Course_module");
const getDataUri = require("../Utils/datauri");
const ErrorResponse = require("../Utils/ErrorHandlear");
const cloudinary = require("cloudinary");
const Stats = require("../Modules/Stats");

//<===============GetAllCourse without lecture=====================>

const GetallCourse = async (req, res, next) => {

  try {
    const keyword = req.query.keyword || "";
  const category = req.query.category || "";
    const courses = await Course.find({


      title: {
      $regex: keyword,
      $options: "i",
    },
    category: {
      $regex: category,
      $options: "i",
    },


    }).select("-lectures");
    res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    console.log(`Error fetching all course data: ${error}`);
    next(new ErrorResponse('Failed to fetch courses', 500));
  }
};

//<====================Create New Course OnlY Admin===========================>//

const CreateCourse = async (req, res, next) => {
  try {
    const { title, description, category, createdBy } = req.body;
   //<===============yaha wo data ka uri ko access karna hai====================>
   const file=req.file;

   //ishe ham cloundinary par upload kar denge
   const fileUri = getDataUri(file);

   const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

   console.log("thi is file data",file);

    const createcrc = await Course.create({
      title,
      description,
      category,
      createdBy,
      poster: {
        public_id: mycloud.public_id,  //aur yahan par cloudinary se public id le lenge
        url: mycloud.secure_url,
      },
    });

    res.status(201).json({
      message: "Created successfully",
      success: true,
      createcrc,
    });
  } catch (error) {
    console.log(`Error creating course: ${error}`);
    next(new ErrorResponse('Failed to create course', 500));
  }
};


//<==================get course lecture==================>
  const GetCourseLecture = async (req, res, next) => {
    try {
      const course = await Course.findById(req.params.id);
  
      if (!course) {
        return next(new ErrorResponse('Failed to fetch courses', 404));
      }
  
      course.views += 1;
      await course.save();
  
      res.status(200).json({
        status: true,
        lectures: course.lectures
      });
  
    } catch (error) {
      next(new ErrorResponse('course is not getting', 500));
    }
  };

  //<===============Add Course Lecture======================>//

  // Max video size 100mb
  const AddCourseLecture = async (req, res, next) => {
    try {
      // Corrected access to req.body
      const { title, description } = req.body;
  
      // Find the course by ID
      const course = await Course.findById(req.params.id);
      if (!course) {
        return next(new ErrorResponse("Course ID is not found", 404)); // Changed to 404 for "not found"
      }
  
      // Process the uploaded file
      const file = req.file;
      if (!file) {
        return next(new ErrorResponse("No file uploaded", 400)); // Handle case where no file is uploaded
      }
  
      // Generate file URI and upload to Cloudinary
      const fileUri = getDataUri(file);
      const mycloud = await cloudinary.v2.uploader.upload(fileUri.content, {
        resource_type: "video",
      });
  
      // Add lecture to the course
      course.lectures.push({
        title,
        description,
        video: {
          public_id: mycloud.public_id,
          url: mycloud.secure_url,
        },
      });
  
      // Update the number of videos and save the course
      course.numOfVideos = course.lectures.length;
      await course.save();
  
      // Send success response
      res.status(201).json({
        success: true,
        message: "Lecture added to course",
      });
  
    } catch (error) {
      // Log the error details for better debugging
      console.error('Error in AddCourseLecture:', error);
      next(new ErrorResponse('Course is not getting', 500));
    }
  };
  
  //<==================Delet course==================>//

  const deleteCourse = async (req, res, next) => {
    try {
      const { id } = req.params;
  
      const course = await Course.findById(id);
  
      if (!course) return next(new ErrorResponse("Course not found", 404));
  
      // Delete the course poster from Cloudinary
      await cloudinary.v2.uploader.destroy(course.poster.public_id);
  
      // Delete each lecture video from Cloudinary
      for (let i = 0; i < course.lectures.length; i++) {
        const singleLecture = course.lectures[i];
        await cloudinary.v2.uploader.destroy(singleLecture.video.public_id, {
          resource_type: "video",
        });
      }
  
      // Use findByIdAndDelete to delete the course from the database
      await Course.findByIdAndDelete(id);
  
      res.status(200).json({
        success: true,
        message: "Course Deleted Successfully",
      });
    } catch (error) {
      // Log the error details for better debugging
      console.error('Error in deleteCourse:', error);
      next(new ErrorResponse("Failed to delete course", 500));
    }
  };
  
  
  //<===============Delet Lecture==========================>

    
 const deleteLecture =async (req, res, next) => {
  const { courseId, lectureId } = req.query;

  const course = await Course.findById(courseId);
  if (!course) return next(new ErrorHandler("Course not found", 404));

  const lecture = course.lectures.find((item) => {
    if (item._id.toString() === lectureId.toString()) return item;
  });
  await cloudinary.v2.uploader.destroy(lecture.video.public_id, {
    resource_type: "video",
  });

  course.lectures = course.lectures.filter((item) => {
    if (item._id.toString() !== lectureId.toString()) return item;
  });

  course.numOfVideos = course.lectures.length;

  await course.save();

  res.status(200).json({
    success: true,
    message: "Lecture Deleted Successfully",
  });
};

//yah ushke liye hai jo add hoga new user ushke autometic show karega kon sa bew user add huwa hay ya woh subscriber ho koi bhi ho

// Watch for changes in the Course collection

//yah kam kargega jab mongoose atels se connect karoge tab n to aap atls ka url dal do
// Watch for changes in the Course collection
Course.watch().on("change", async () => {
  try {
    const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);
  
    if (stats.length === 0) {
      // If no stats exist, you may want to create a new Stats document
      await Stats.create({
        views: 0,
        createdAt: new Date(Date.now()),
      });
      console.log("Created a new Stats document because none existed.");
      return; // Exit the function early since there's nothing to update
    }
  
    const courses = await Course.find({});
  
    let totalViews = 0;
  
    for (let i = 0; i < courses.length; i++) {
      totalViews += courses[i].views;
    }
  
    stats[0].views = totalViews;
    stats[0].createdAt = new Date(Date.now());
  
    await stats[0].save();
  } catch (error) {
    console.error("Error updating stats:", error);
  }
});



module.exports = { GetallCourse, CreateCourse,GetCourseLecture,AddCourseLecture,deleteCourse,deleteLecture};
