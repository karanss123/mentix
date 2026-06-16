import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 2525,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});

export const sendOTP = async (email, otp) => {
  try {
    console.log("Sending OTP to:", email);

    const info = await transporter.sendMail({
      from: "karanss1114@gmail.com",
      to: email,
      subject: "OTP Verification",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>OTP Verification</h2>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
        </div>
      `,
    });

    console.log("MAIL SENT:", info.messageId);
    return true;
  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    throw err;
  }
};