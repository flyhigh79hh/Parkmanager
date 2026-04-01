"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bookSpace, cancelBooking } from "./actions";

export default function BookingClient({ users, lots, bookingsInfo, dict }: any) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [userId, setUserId] = useState("");
  const [date, setDate] = useState("");
  const [spaceId, setSpaceId] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive user bookings from the server-provided bookingsInfo prop
  const userBookings = bookingsInfo.filter((b: any) => b.userId === userId);

  const isSpaceBookedOnDate = (sId: string, dStr: string) => {
    return bookingsInfo.some((b: any) => b.spaceId === sId && b.date === dStr);
  };

  const handleCancel = async (bookingId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("bookingId", bookingId);
      await cancelBooking(formData);
      router.refresh();
      setMessage({ type: "success", text: dict.cancel + " success!" }); // Quick feedback
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("spaceId", spaceId);
    formData.append("date", date);

    const res = await bookSpace(formData);
    
    if (res?.error) {
      setMessage({ type: "error", text: res.error });
    } else if (res?.success) {
      setMessage({ type: "success", text: dict.success });
      setSpaceId("");
      startTransition(() => {
        router.refresh();
      });
    }
    
    setIsSubmitting(false);
  };

  const isGlobalPending = isSubmitting || isPending;

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="surface">
      {message.text && (
        <div style={{ padding: "1rem", marginBottom: "1.5rem", borderRadius: "8px", background: message.type === "error" ? "#fef2f2" : "#f0fdf4", color: message.type === "error" ? "#991b1b" : "#166534", border: `1px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}` }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label className="input-label">{dict.selectUser}</label>
          <select className="input-field" value={userId} onChange={e => {setUserId(e.target.value); setMessage({ type: "", text: "" });}} required>
            <option value="" disabled>-- {dict.selectUser} --</option>
            {users.map((u: any) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div className="input-group" style={{ marginBottom: 0 }}>
          <label className="input-label">{dict.selectDate}</label>
          <input type="date" className="input-field" min={todayStr} value={date} onChange={e => {setDate(e.target.value); setSpaceId(""); setMessage({ type: "", text: "" });}} required />
        </div>

        {date && (
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">{dict.selectLot} / Space</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem" }}>
              {lots.map((lot: any) => (
                <div key={lot.id} style={{ padding: "1.25rem", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#f8fafc" }}>
                  <h4 style={{ margin: "0 0 1rem 0", color: "var(--text-primary)" }}>{lot.name}</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {lot.spaces.map((space: any) => {
                      const booked = isSpaceBookedOnDate(space.id, date);
                      const isSelected = spaceId === space.id;
                      return (
                        <button
                          key={space.id}
                          type="button"
                          disabled={booked}
                          onClick={() => setSpaceId(space.id)}
                          style={{
                            padding: "0.75rem 1.25rem",
                            borderRadius: "8px",
                            border: isSelected ? "2px solid var(--primary-color)" : "1px solid #cbd5e0",
                            background: booked ? "#fee2e2" : isSelected ? "#eff6ff" : "white",
                            color: booked ? "#b91c1c" : isSelected ? "var(--primary-color)" : "var(--text-secondary)",
                            cursor: booked ? "not-allowed" : "pointer",
                            fontWeight: isSelected ? 600 : 500,
                            boxShadow: isSelected ? "0 0 0 2px rgba(66, 153, 225, 0.2)" : "none",
                            transition: "all 0.2s"
                          }}
                        >
                          {space.name}
                        </button>
                      );
                    })}
                    {lot.spaces.length === 0 && <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>No spaces configured</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={!userId || !date || !spaceId || isGlobalPending} style={{ padding: "1rem", fontSize: "1.125rem", marginTop: "1rem" }}>
          {isGlobalPending ? "..." : dict.submit}
        </button>
      </form>

      {userId && (
        <div style={{ marginTop: "3rem", borderTop: "1px solid #e2e8f0", paddingTop: "2rem" }}>
          <h3 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>{dict.yourBookings}</h3>
          {userBookings.length > 0 ? (
            <div style={{ display: "grid", gap: "1rem" }}>
              {userBookings.map((b: any) => {
                const parts = b.date.split('-'); // YYYY-MM-DD
                const formattedDate = `${parts[2]}.${parts[1]}.${parts[0]}`;
                return (
                  <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #cbd5e0" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                        {formattedDate} - {b.space.lot.name}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <span className="badge badge-blue">{dict.spot}: {b.space.name}</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleCancel(b.id)} 
                      disabled={isGlobalPending}
                      className="btn btn-danger" 
                      style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                    >
                      {dict.cancel}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>{dict.noBookingsUser}</p>
          )}
        </div>
      )}
    </div>
  );
}
