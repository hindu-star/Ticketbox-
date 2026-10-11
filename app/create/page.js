import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function CreatePage() {
  return (
    <>
      <Navbar />
      <div className="auth-page">
        <h1>Create an event</h1>
        <p>Fill in the details and start selling tickets.</p>
        <form className="auth-form">
          <input type="text" placeholder="Event title" />
          <input type="text" placeholder="Location" />
          <input type="date" />
          <textarea placeholder="Description" rows="4" />
          <input type="number" placeholder="Ticket price (₦)" />
          <button type="button">Create event</button>
        </form>
      </div>
      <Footer />
    </>
  );
}
