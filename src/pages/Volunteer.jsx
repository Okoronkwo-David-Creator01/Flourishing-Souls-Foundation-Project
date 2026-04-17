import React from "react";
import { Layout, Notification } from "../components/common/ThemeProvider";
import VolunteerForm from "../components/volunteer/VolunteerForm";
import VolunteerList from "../components/volunteer/VolunteerList";

/**
 * The Volunteer page allows users to sign up to volunteer
 * and also (for admins) view the list of current volunteers.
 * The page integrates real-time data pulling from the backend (Supabase).
 */

const Volunteer = () => {
  // Notification state (success/error feedback)
  const [notification, setNotification] = React.useState({
    open: false,
    message: "",
    type: "success", // or "error"
  });

  // Handler to show notification feedback
  const showNotification = (message, type = "success") => {
    setNotification({
      open: true,
      message,
      type,
    });
  };

  // Handler to close notification
  const closeNotification = () => {
    setNotification({
      ...notification,
      open: false,
    });
  };

  return (
    <Layout title="Volunteer – Flourishing Souls Foundation">
      <section className="bg-primary-100 py-12 px-4 min-h-screen">
        <div className="max-w-4xl mx-auto shadow rounded-xl bg-white/80 backdrop-blur px-6 py-8">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-2">
              Become a Volunteer
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl">
              Join Flourishing Souls Foundation to make a real impact! Fill out this form to become a part of our growing network of positive change-makers. Your information is securely stored and never shared.
            </p>
          </header>
          <VolunteerForm onSuccess={() => showNotification("We appreciate your willingness to help! We've received your application.", "success")} onError={msg => showNotification(msg, "error")}/>
        </div>

        {/* Volunteer List for Admin/Manager visibility (optional display logic within component) */}
        <div className="max-w-6xl mx-auto mt-12">
          <VolunteerList />
        </div>
      </section>

      {/* Notification upon submission or error */}
      <Notification
        open={notification.open}
        message={notification.message}
        type={notification.type}
        onClose={closeNotification}
        autoHideDuration={6000}
      />
    </Layout>
  );
};

export default Volunteer;

