"use client";

import AnalyticsCharts from "@/components/AnalyticsCharts";
import React from "react";

export default function AdminAnalyticsViPage() {
  return (
    <section className="space-y-6">
      {/* Analytics charts and summaries - AdminLayout provides top header and sidebar */}
      <AnalyticsCharts />
    </section>
  );
}
