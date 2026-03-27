import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth.jsx";

const COLORS = { bg: "#FDFDF9", soft: "#FBEF9C", primary: "#FEE32B", olive: "#877928", ink: "#201D18" };

function Card({ children, style }) {
  return <div style={{ background: COLORS.bg, border: `1px solid rgba(32,29,24,0.12)`, borderRadius: 16, padding: 20, boxShadow: "0 4px 16px rgba(32,29,24,0.06)", ...style }}>{children}</div>;
}

export default function SellerQnAPage() {
  const { fetchWithAuth } = useAuth();
  const [questions, setQuestions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [answering, setAnswering] = React.useState(null);
  const [answerText, setAnswerText] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [filter, setFilter] = React.useState("all");

  React.useEffect(() => {
    fetchWithAuth("/api/seller/qna")
      .then((d) => setQuestions(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const submitAnswer = async (questionId) => {
    if (!answerText.trim()) return;
    setSubmitting(true);
    try {
      await fetchWithAuth(`/api/seller/qna/${questionId}/answer`, {
        method: "POST",
        body: JSON.stringify({ content: answerText.trim() }),
      });
      setQuestions((prev) => prev.map((q) =>
        q.question_id === questionId
          ? { ...q, answer: answerText.trim(), answered_at: new Date().toISOString() }
          : q
      ));
      setAnswering(null);
      setAnswerText("");
    } catch (err) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  const unanswered = questions.filter((q) => !q.answer).length;
  const filtered = filter === "unanswered" ? questions.filter((q) => !q.answer)
                 : filter === "answered" ? questions.filter((q) => q.answer)
                 : questions;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: COLORS.ink, margin: "0 0 4px" }}>Q&A</h1>
        {unanswered > 0 && (
          <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 800, margin: 0 }}>
            {unanswered} unanswered question{unanswered !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["all", "unanswered", "answered"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 800,
              background: filter === f ? COLORS.ink : COLORS.bg, color: filter === f ? COLORS.primary : COLORS.olive,
              boxShadow: "0 1px 4px rgba(32,29,24,0.08)", textTransform: "capitalize" }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: COLORS.olive, fontWeight: 700 }}>Loading...</p>
      : filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <p style={{ fontWeight: 700, color: COLORS.olive }}>No questions yet.</p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((q) => (
            <Card key={q.question_id} style={{ borderLeft: q.answer ? `3px solid #16a34a` : `3px solid #d97706`, borderRadius: "0 16px 16px 0" }}>
              {/* Product */}
              <Link to={`/p/${q.product_id}`} style={{ fontSize: 12, color: COLORS.olive, fontWeight: 700, textDecoration: "none", display: "block", marginBottom: 8 }}>
                📦 {q.product_name}
              </Link>

              {/* Question */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: COLORS.olive, margin: "0 0 4px", fontWeight: 700 }}>
                  {q.customer_name} · {new Date(q.created_at).toLocaleDateString("en-IN")}
                </p>
                <p style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink, margin: 0 }}>{q.question}</p>
              </div>

              {/* Answer */}
              {q.answer ? (
                <div style={{ background: COLORS.soft, borderRadius: 10, padding: "10px 14px" }}>
                  <p style={{ fontSize: 12, color: "#166534", fontWeight: 800, margin: "0 0 4px" }}>
                    Your answer · {new Date(q.answered_at).toLocaleDateString("en-IN")}
                  </p>
                  <p style={{ fontSize: 13, color: COLORS.ink, margin: 0 }}>{q.answer}</p>
                </div>
              ) : answering === q.question_id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Write your answer..." rows={3}
                    style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid rgba(32,29,24,0.2)`, fontSize: 13, resize: "vertical", fontFamily: "system-ui" }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => submitAnswer(q.question_id)} disabled={submitting || !answerText.trim()}
                      style={{ padding: "9px 18px", background: COLORS.primary, color: COLORS.ink, fontWeight: 900, fontSize: 13, borderRadius: 10, border: "none", cursor: "pointer" }}>
                      {submitting ? "Posting..." : "Post answer"}
                    </button>
                    <button onClick={() => { setAnswering(null); setAnswerText(""); }}
                      style={{ padding: "9px 14px", background: "transparent", border: `1px solid ${COLORS.olive}`, color: COLORS.olive, fontWeight: 700, fontSize: 13, borderRadius: 10, cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setAnswering(q.question_id); setAnswerText(""); }}
                  style={{ padding: "9px 18px", background: COLORS.soft, color: COLORS.ink, fontWeight: 800, fontSize: 13, borderRadius: 10, border: "none", cursor: "pointer" }}>
                  Answer this question
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}