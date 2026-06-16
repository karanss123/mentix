import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTP = async (email, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
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

    if (error) {
      console.error("Resend Error:", error);
      throw new Error("Failed to send OTP");
    }

    console.log("OTP sent successfully:", data);
    return data;
  } catch (err) {
    console.error("Email Error:", err);
    throw err;
  }
};