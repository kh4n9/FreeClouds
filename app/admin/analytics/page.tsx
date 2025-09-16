import Footer from "@/components/Footer";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import React from "react";

export default function AdminAnalyticsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <section className="space-y-6">
            {/* Analytics charts and summaries */}
            <AnalyticsCharts />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
