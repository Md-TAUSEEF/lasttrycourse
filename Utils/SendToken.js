const SendToken = (res, user, message, statusCode = 200) => {
  
    const token = user.getJWTToken();
    
  
    const options = {
        expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'Strict',
    };

   
    res.status(statusCode).cookie("token", token, options).json({
        success: true,
        message,
        user,
        token
    });
};

module.exports = SendToken;
