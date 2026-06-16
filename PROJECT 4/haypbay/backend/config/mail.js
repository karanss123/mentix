import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  connectionTimeout: 60000,
  greetingTimeout: 60000,
  socketTimeout: 60000,
});
transporter.verify((error, success) => {
  if (error) console.log("Mail Error:", error);
  else console.log("Mail server ready ✅");
});

export const sendOTP = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "OTP Verification",
    html: `<h2>Your OTP is <b>${otp}</b></h2>`,
  });
};


