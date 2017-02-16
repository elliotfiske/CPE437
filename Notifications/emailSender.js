var fs = require('fs');
var nodemailer = require('nodemailer');
var sesTransport = require('nodemailer-ses-transport');

// var transporter = nodemailer.createTransport(sesTransport({
//     accessKeyId: process.env.AWSAccessKeyId,
//     secretAccessKey: process.env.AWSSecretKey,
//     rateLimit: 20
// }));

// var transporter = nodemailer.createTransport(process.env.GMAIL_SMTP);
var helper = require('sendgrid').mail;
var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);;

// Stores the base email template, with %VARIABLES% like this that we replace
var EMAIL_TEMPLATE = "";
var BASE_URL = "https://polycommit.herokuapp.com"; // TODO: If this changes, change this

var onHeroku = !!process.env.DYNO;
if (!onHeroku) {
   BASE_URL = "http://localhost:3000";
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
      from: "calpoly.commit@gmail.com",
      text: textPreview,
      html: specificEmail,
      subject: subject
   };
   //
   // transporter.sendMail(mailOptions, function(error, info) {
   //    if (error) {
   //       console.log("error sending email", error);
   //       return;
   //    }
   //    console.log('Message sent: ' + info.response);
   // });

   console.log("SENDING MESSAGE:");

   var from_email = new helper.Email('calpoly.commit@gmail.com');
   var to_email = new helper.Email(user.email);
   var content = new helper.Content('text/html', specificEmail);
   var mail = new helper.Mail(from_email, subject, to_email, content);

   var request = sg.emptyRequest({
     method: 'POST',
     path: '/v3/mail/send',
     body: mail.toJSON(),
   });

   sg.API(request, function(error, response) {
     console.log(response.statusCode);
     console.log(response.body);
     console.log(response.headers);
   });
}

module.exports = {
   sendEmail: sendEmail,
   BASE_URL: BASE_URL
};
