import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) console.log("Mail Error:", error);
  else console.log("Mail server ready ✅");
});

export const sendOTP = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "OTP Verification",
      html: `<h2>Your OTP is <b>${otp}</b></h2>`,
    });

    console.log("OTP sent successfully");
  } catch (err) {
    console.log("OTP send error:", err);
    throw err;
  }
};