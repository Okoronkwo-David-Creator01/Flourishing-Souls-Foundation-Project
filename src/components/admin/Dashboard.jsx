import React, { useEffect, useState } from "react";
import {
  FaUsers,
  FaDonate,
  FaHandsHelping,
  FaCalendarAlt,
  FaImage,
  FaUserShield,
  FaCogs,
} from "react-icons/fa";
import { supabase } from "../../lib/supabase";
import ManagementPanel from "./ManagementPanel";

const Dashboard = () => {
  const [userCount, setUserCount] = useState(0);
  const [donationTotal, setDonationTotal] = useState(0);
  const [volunteerCount, setVolunteerCount] = useState(0);
  const [supportRequests, setSupportRequests] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [galleryItems, setGalleryItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        // Users
        const { count: userCnt, error: userErr } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });
        if (userErr) throw userErr;
        setUserCount(userCnt);

        // Donations
        const { data: donations, error: donateErr } = await supabase
          .from("donations")
          .select("amount");
        if (donateErr) throw donateErr;
        setDonationTotal(
          donations?.reduce((sum, d) => sum + Number(d.amount ?? 0), 0) || 0
        );

        // Volunteers
        const { count: volCnt, error: volErr } = await supabase
          .from("volunteers")
          .select("*", { count: "exact", head: true });
        if (volErr) throw volErr;
        setVolunteerCount(volCnt);

        // Support Requests
        const { count: supportCnt, error: supportErr } = await supabase
          .from("support_requests")
          .select("*", { count: "exact", head: true });
        if (supportErr) throw supportErr;
        setSupportRequests(supportCnt);

        // Events
        const { count: eventCnt, error: eventErr } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true });
        if (eventErr) throw eventErr;
        setEventCount(eventCnt);

        // Gallery Items (images/videos)
        const { count: galleryCnt, error: galleryErr } = await supabase
          .from("gallery")
          .select("*", { count: "exact", head: true });
        if (galleryErr) throw galleryErr;
        setGalleryItems(galleryCnt);
      } catch (err) {
        setError(err.message || "An error occurred fetching dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <span className="ml-4 text-lg font-medium text-gray-700 dark:text-gray-200">
          Loading admin dashboard...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg shadow">
        <p className="font-semibold">Error loading dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-primary mb-8">
        Admin Dashboard
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {/* Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center">
          <FaUsers className="text-3xl text-primary mb-2" />
          <div className="font-semibold text-2xl">{userCount}</div>
          <div className="text-sm text-gray-700 dark:text-gray-200">Users</div>
        </div>
        {/* Donations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center">
          <FaDonate className="text-3xl text-green-600 mb-2" />
          <div className="font-semibold text-2xl">
            &#8358; {donationTotal.toLocaleString()}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-200">
            Total Donations
          </div>
        </div>
        {/* Volunteers */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center">
          <FaHandsHelping className="text-3xl text-yellow-600 mb-2" />
          <div className="font-semibold text-2xl">{volunteerCount}</div>
          <div className="text-sm text-gray-700 dark:text-gray-200">
            Volunteers
          </div>
        </div>
        {/* Support Requests */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center">
          <FaUserShield className="text-3xl text-blue-600 mb-2" />
          <div className="font-semibold text-2xl">{supportRequests}</div>
          <div className="text-sm text-gray-700 dark:text-gray-200">
            Support Requests
          </div>
        </div>
        {/* Events */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center">
          <FaCalendarAlt className="text-3xl text-purple-700 mb-2" />
          <div className="font-semibold text-2xl">{eventCount}</div>
          <div className="text-sm text-gray-700 dark:text-gray-200">Events</div>
        </div>
        {/* Gallery */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center">
          <FaImage className="text-3xl text-pink-500 mb-2" />
          <div className="font-semibold text-2xl">{galleryItems}</div>
          <div className="text-sm text-gray-700 dark:text-gray-200">
            Gallery Items
          </div>
        </div>
      </div>

      {/* Divider */}
      <hr className="my-8 border-gray-200 dark:border-gray-700" />

      {/* Management Panel */}
      <ManagementPanel />

      {/* Admin Settings */}
      <Settings />
    </div>
  );
};

export default Dashboard;
