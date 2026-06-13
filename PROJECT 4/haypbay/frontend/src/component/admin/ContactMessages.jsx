import { useEffect, useState } from "react";
import api from "../../api/axios";
import "./admin.css";

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchMessages = async () => {
    try {
      const { data } = await api.get("/api/contact");
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch Contact Messages Error:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/api/contact/${id}/read`);
      setMessages((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, status: "read" } : item
        )
      );
    } catch (error) {
      console.error("Mark Read Error:", error);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this message?");
    if (!ok) return;

    try {
      await api.delete(`/api/contact/${id}`);
      setMessages((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Delete Contact Message Error:", error);
    }
  };

  const openReplyBox = (item) => {
    setReplyingId(item._id);
    setReplyText(item.replyMessage || "");
  };

  const closeReplyBox = () => {
    setReplyingId(null);
    setReplyText("");
  };

  const handleSendReply = async (item) => {
    if (!replyText.trim()) {
      alert("Please enter reply message");
      return;
    }

    try {
      setSendingReply(true);

      const { data } = await api.post(`/api/contact/${item._id}/reply`, {
        replyMessage: replyText,
      });

      const updated = data?.data;

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === item._id
            ? {
                ...msg,
                status: "read",
                replyMessage: updated?.replyMessage || replyText,
                repliedAt: updated?.repliedAt || new Date().toISOString(),
              }
            : msg
        )
      );

      alert(data?.message || "Reply sent successfully");
      closeReplyBox();
    } catch (error) {
      console.error("Reply Error:", error);
      alert(error?.response?.data?.message || "Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading contact messages...</div>;
  }

  return (
    <div className="products-page">
      <h1 className="page-title">Contact Messages</h1>

      {messages.length === 0 ? (
        <p style={{ padding: "20px 0" }}>No contact messages found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {messages.map((item, index) => (
                <>
                  <tr key={item._id}>
                    <td>{index + 1}</td>
                    <td>{item.name || "-"}</td>
                    <td>{item.email || "-"}</td>
                    <td>{item.subject || "-"}</td>
                    <td
                      style={{
                        maxWidth: "260px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={item.message || ""}
                    >
                      {item.message || "-"}
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          textTransform: "capitalize",
                          background:
                            item.status === "new" ? "#fff3cd" : "#d1e7dd",
                          color: item.status === "new" ? "#856404" : "#0f5132",
                        }}
                      >
                        {item.status || "new"}
                      </span>
                    </td>
                    <td>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        {item.status !== "read" && (
                          <button
                            onClick={() => handleMarkRead(item._id)}
                            style={{
                              background: "#f4c542",
                              border: "none",
                              padding: "8px 14px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: "600",
                            }}
                          >
                            Read
                          </button>
                        )}

                        <button
                          onClick={() => openReplyBox(item)}
                          style={{
                            background: "#0d6efd",
                            color: "#fff",
                            border: "none",
                            padding: "8px 14px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600",
                          }}
                        >
                          Reply
                        </button>

                        <button
                          onClick={() => handleDelete(item._id)}
                          style={{
                            background: "#dc3545",
                            color: "#fff",
                            border: "none",
                            padding: "8px 14px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {replyingId === item._id && (
                    <tr key={`${item._id}-reply`}>
                      <td colSpan="8" style={{ background: "#f9fafb" }}>
                        <div
                          style={{
                            padding: "14px 10px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "600",
                              color: "#1f2937",
                            }}
                          >
                            Reply to: {item.email}
                          </div>

                          <textarea
                            rows="5"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your reply here..."
                            style={{
                              width: "100%",
                              padding: "12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "8px",
                              resize: "vertical",
                              outline: "none",
                              fontSize: "14px",
                              boxSizing: "border-box",
                            }}
                          />

                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              onClick={() => handleSendReply(item)}
                              disabled={sendingReply}
                              style={{
                                background: "#198754",
                                color: "#fff",
                                border: "none",
                                padding: "9px 16px",
                                borderRadius: "6px",
                                cursor: sendingReply ? "not-allowed" : "pointer",
                                fontWeight: "600",
                                opacity: sendingReply ? 0.7 : 1,
                              }}
                            >
                              {sendingReply ? "Sending..." : "Send Reply"}
                            </button>

                            <button
                              onClick={closeReplyBox}
                              disabled={sendingReply}
                              style={{
                                background: "#6c757d",
                                color: "#fff",
                                border: "none",
                                padding: "9px 16px",
                                borderRadius: "6px",
                                cursor: sendingReply ? "not-allowed" : "pointer",
                                fontWeight: "600",
                                opacity: sendingReply ? 0.7 : 1,
                              }}
                            >
                              Cancel
                            </button>
                          </div>

                          {item.replyMessage && (
                            <div
                              style={{
                                marginTop: "6px",
                                padding: "10px 12px",
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                fontSize: "14px",
                                color: "#374151",
                              }}
                            >
                              <strong>Previous Reply:</strong> {item.replyMessage}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ContactMessages;