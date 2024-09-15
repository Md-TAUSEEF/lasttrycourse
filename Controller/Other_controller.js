const sendEmail = require("../Utils/SendEmail");
const ErrorResponse = require("../Utils/ErrorHandlear");
const Stats = require("../Modules/Stats");

const Contactform = async (req, res, next) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return next(new ErrorResponse("All fields are mandatory", 400));
        }

        const to = process.env.MY_EMAIL;
        const subject = "Contact from Personal Website";
        const text = `I am ${name} and my email is ${email}.\n\n${message}`;

        await sendEmail(to, subject, text);

        res.status(200).json({
            success: true,
            message: "Your message has been sent.",
        });
    } catch (error) {
        console.error("Error occurred while processing contact form:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while sending your message. Please try again later.",
        });
    }
};

const courseRequest = async (req, res, next) => {
    try {
        const { name, email, course } = req.body;

        if (!name || !email || !course) {
            return next(new ErrorResponse("All fields are mandatory", 400));
        }

        const to = process.env.MY_EMAIL;
        const subject = "Requesting for a course on CourseBundler";
        const text = `I am ${name} and my email is ${email}.\n\n${course}`;

        await sendEmail(to, subject, text);

        res.status(200).json({
            success: true,
            message: "Your request has been sent.",
        });
    } catch (error) {
        console.error("Error occurred while processing course request:", error);
        next(new ErrorResponse("Failed to send course request", 500));
    }
};

const getDashboardStats = async (req, res, next) => {
    try {
      const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(12);
  
      const statsData = [];
      for (let i = 0; i < stats.length; i++) {
        statsData.unshift(stats[i]);
      }
      const requiredSize = 12 - stats.length;
  
      for (let i = 0; i < requiredSize; i++) {
        statsData.unshift({
          users: 0,
          subscription: 0,
          views: 0,
        });
      }
  
      const usersCount = statsData[11]?.users || 0;
      const subscriptionCount = statsData[11]?.subscription || 0;
      const viewsCount = statsData[11]?.views || 0;
  
      let usersPercentage = 0,
        viewsPercentage = 0,
        subscriptionPercentage = 0;
      let usersProfit = true,
        viewsProfit = true,
        subscriptionProfit = true;
  
      if (statsData[10]?.users === 0 && usersCount > 0) usersPercentage = 100;
      if (statsData[10]?.views === 0 && viewsCount > 0) viewsPercentage = 100;
      if (statsData[10]?.subscription === 0 && subscriptionCount > 0)
        subscriptionPercentage = 100;
      else {
        const difference = {
          users: usersCount - (statsData[10]?.users || 0),
          views: viewsCount - (statsData[10]?.views || 0),
          subscription: subscriptionCount - (statsData[10]?.subscription || 0),
        };
  
        usersPercentage = (difference.users / (statsData[10]?.users || 1)) * 100;
        viewsPercentage = (difference.views / (statsData[10]?.views || 1)) * 100;
        subscriptionPercentage =
          (difference.subscription / (statsData[10]?.subscription || 1)) * 100;
  
        usersProfit = usersPercentage >= 0;
        viewsProfit = viewsPercentage >= 0;
        subscriptionProfit = subscriptionPercentage >= 0;
      }
  
      res.status(200).json({
        success: true,
        stats: statsData,
        usersCount,
        subscriptionCount,
        viewsCount,
        subscriptionPercentage,
        viewsPercentage,
        usersPercentage,
        subscriptionProfit,
        viewsProfit,
        usersProfit,
      });
    } catch (error) {
      console.error("Error occurred while processing getDashboardStats:", error);
      next(new ErrorResponse("Failed to get dashboard stats", 500));
    }
  };
  
module.exports = { Contactform, courseRequest, getDashboardStats };
