export default function AnalyticsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center">
      <div className="w-24 h-24 bg-dashboard-card rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm border border-dashboard-border">
        📈
      </div>
      <h1 className="text-3xl font-bold text-dashboard-text mb-2">Analytics & Reports</h1>
      <p className="text-dashboard-muted max-w-md mb-8">
        Track your revenue, popular menu items, peak hours, and customer trends. This feature is coming soon in Phase 5.
      </p>
      <div className="px-4 py-2 bg-primary-500/10 text-primary-400 font-semibold rounded-lg border border-primary-500/20">
        Coming Soon
      </div>
    </div>
  );
}
