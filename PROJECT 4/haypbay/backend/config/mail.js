import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "karanss1114@gmail.com",
    pass: "yyksjbgdsmvbaujw",
  },
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

transporter.verify((error, success) => {
  if (error) {
    console.log("SMTP VERIFY ERROR:", error);
  } else {
    console.log("SMTP READY ✅");
  }
});
