import nodemailer from "nodemailer";
import Contact from "../models/Contact.js";

/* ================= CREATE MESSAGE ================= */
export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message, storeId } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !subject?.trim() ||
      !message?.trim()
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const saved = await Contact.create({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      storeId: storeId || null,
      status: "new",
    });

    res.status(201).json({
      message: "Message sent successfully",
      data: saved,
    });
  } catch (error) {
    console.error("Contact Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ALL ================= */
export const getContactMessages = async (req, res) => {
  try {
    const filter = {};

    if (req.storeId) {
      filter.$or = [{ storeId: req.storeId }, { storeId: null }];
    }

    const messages = await Contact.find(filter).sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error("Get Contact Messages Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= MARK READ ================= */
export const markAsRead = async (req, res) => {
  try {
    const msg = await Contact.findById(req.params.id);

    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }

    msg.status = "read";
    await msg.save();

    res.json({
      message: "Marked as read",
      data: msg,
    });
  } catch (error) {
    console.error("Mark As Read Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= REPLY ================= */
export const replyToContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyMessage } = req.body;

    if (!replyMessage?.trim()) {
      return res.status(400).json({ message: "Reply message is required" });
    }

    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({ message: "Message not found" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"HYPEBAY Support" <${process.env.EMAIL_USER}>`,
      to: contact.email,
      replyTo: process.env.EMAIL_USER,
      subject: `Reply: ${contact.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>HYPEBAY Support</h2>
          <p>${replyMessage.trim()}</p>
          <hr />
          <p><strong>Original Message:</strong></p>
          <p>${contact.message}</p>
          <br />
          <p>Regards,<br/>Team HYPEBAY</p>
        </div>
      `,
    });

    contact.status = "read";
    contact.replyMessage = replyMessage.trim();
    contact.repliedAt = new Date();

    await contact.save();

    res.json({
      message: "Reply sent successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Reply Contact Error:", error);
    res.status(500).json({
      message: "Failed to send reply",
    });
  }
};

/* ================= DELETE ================= */
export const deleteMessage = async (req, res) => {
  try {
    const msg = await Contact.findById(req.params.id);

    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }

    await msg.deleteOne();

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete Contact Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};