var fs = require('fs');
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport(process.env.GMAIL_SMTP);

// Stores the base email template, with %VARIABLES% like this that we replace
var EMAIL_TEMPLATE = "";
var BASE_URL = "https://elliot-commitment.herokuapp.com"; // TODO: If this changes, change this

var onHeroku = !!process.env.DYNO;
if (!onHeroku) {
   BASE_URL = "http://localhost:3000/";
}

fs.readFile('./resources/email-template.html', 'utf8', function(err, data) {
   if (err) {
      console.error('Could not read from file...', err);
   }
   else {
      EMAIL_TEMPLATE = data;
   }
});

var sendEmail = function(subject, body, link, linkDisplay, textPreview, user) {
   var specificEmail = EMAIL_TEMPLATE.replace("%TEXTPREVIEW%", textPreview);
   specificEmail = specificEmail.replace("%BODY%", body);
   specificEmail = specificEmail.replace("%LINK%", link);
   specificEmail = specificEmail.replace("%LINKDISPLAY%", linkDisplay);
   specificEmail = specificEmail.replace("%UNSUBLINK%", BASE_URL + "/#/unsubscribe?email=" + user.email);

   var mailOptions = {
      to: user.email,
      text: textPreview,
      html: specificEmail,
      subject: subject
   };

   transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
         console.log("error sending email", error);
         return;
      }
      console.log('Message sent: ' + info.response);
   });
}

module.exports = {
   sendEmail: sendEmail,
   BASE_URL: BASE_URL
};
