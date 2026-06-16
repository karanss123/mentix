import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.log("Brevo Mail Error:", error);
  } else {
    console.log("Brevo Mail Ready ✅");
  }
});

export const sendOTP = async (email, otp) => {
  await transporter.sendMail({
    from: "karanss1114@gmail.com",
    to: email,
    subject: "OTP Verification",
    html: `
      <h2>OTP Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
    `,
  });
};