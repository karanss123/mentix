import { useState } from "react";
import { registerUser, verifyOtp } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import "../pages/Auth.css";

const Register = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateRegister = () => {
    if (!form.name.trim()) return "Name is required";
    if (form.name.trim().length < 3) {
      return "Name must be at least 3 characters";
    }

    if (!form.email.trim()) return "Email is required";
    if (!isValidEmail(form.email.trim())) return "Enter a valid email";

    if (!form.password) return "Password is required";
    if (form.password.length < 6) {
      return "Password must be at least 6 characters";
    }

    return null;
  };

  const validateOtp = () => {
    if (!otp) return "OTP is required";
    if (!/^\d{6}$/.test(otp)) return "OTP must be 6 digits";
    return null;
  };

  const submitRegister = async () => {
    const error = validateRegister();

    if (error) {
      alert(error);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };

      // ✅ no storeId needed for normal user register
      const data = await registerUser(payload);

      alert(data?.msg || "OTP sent to your Gmail 📧");
      setStep(2);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async () => {
    const error = validateOtp();
    if (error) return alert(error);

    try {
      setLoading(true);

      // ✅ no storeId needed for normal user verify
      const data = await verifyOtp({
        email: form.email.trim().toLowerCase(),
        otp,
      });

      alert(data?.msg || "Registration Successful ✅\nPlease login now");

      setStep(1);
      setForm({ name: "", email: "", password: "" });
      setOtp("");

      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
      alert(err?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h3>{step === 1 ? "Register" : "Verify OTP"}</h3>

        {step === 1 ? (
          <>
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />

            <button onClick={submitRegister} disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              maxLength={6}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, ""))
              }
            />

            <button onClick={submitOtp} disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;