(function () {
  function BookingForm() {
    const spaces = ["Window table", "Quiet study room", "Community desk", "Garden reading nook"];
    const [form, setForm] = React.useState({ space: "", date: "", startTime: "", endTime: "" });
    const [message, setMessage] = React.useState("");
    const [saved, setSaved] = React.useState(false);
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    function updateField(event) {
      setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
      setMessage("");
      setSaved(false);
    }

    function submitBooking(event) {
      event.preventDefault();
      if (form.startTime >= form.endTime) {
        setMessage("Choose an end time later than your start time.");
        setSaved(false);
        return;
      }
      setMessage("Your booking details are ready. They have not been sent to a server.");
      setSaved(true);
    }

    return (
      <section className="booking-layout">
        <div className="booking-intro">
          <p className="eyebrow">MEMBER SPACE</p>
          <h1>Make room for a good read.</h1>
          <p>Choose a place and a time. Your details stay on this page for now.</p>
        </div>
        <form className="booking-form" onSubmit={submitBooking}>
          <label>
            Space
            <select name="space" value={form.space} onChange={updateField} required>
              <option value="" disabled>Select a space</option>
              {spaces.map((space) => <option key={space} value={space}>{space}</option>)}
            </select>
          </label>
          <label>
            Date
            <input name="date" type="date" min={today} value={form.date} onChange={updateField} required />
          </label>
          <div className="time-fields">
            <label>
              Start time
              <input name="startTime" type="time" value={form.startTime} onChange={updateField} required />
            </label>
            <label>
              End time
              <input name="endTime" type="time" min={form.startTime || undefined} value={form.endTime} onChange={updateField} required />
            </label>
          </div>
          <button className="button button-primary" type="submit">Review booking</button>
          {message && <p className={saved ? "form-notice success" : "form-notice error"} role="status">{message}</p>}
          {saved && <dl className="booking-summary">
            <div><dt>Space</dt><dd>{form.space}</dd></div>
            <div><dt>Date</dt><dd>{form.date}</dd></div>
            <div><dt>Time</dt><dd>{form.startTime}–{form.endTime}</dd></div>
          </dl>}
        </form>
      </section>
    );
  }

  window.BookingForm = BookingForm;
})();