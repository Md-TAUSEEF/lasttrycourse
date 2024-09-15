
//ye ishke liye h jo bhi data ham denge ushka uri genrate karna hai
const DataUriParser = require("datauri/parser");
const path = require("path");

// Function to generate Data URI
const getDataUri = (file) => {

    const parser = new DataUriParser();
    
    // Get the file extension from the original name
    const extName = path.extname(file.originalname).toString();
    console.log("The file extension is:", extName);
    return parser.format(extName, file.buffer);
};

// Export the function
module.exports = getDataUri;
