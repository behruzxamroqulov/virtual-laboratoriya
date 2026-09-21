import ResourceMonitor from '@/components/ResourceMonitor';

export default function MonitoringPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Resurs monitoringi</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Server xotirasi, fayl storage va kesh holati real vaqtda (har 5 soniyada) yangilanadi.
        </p>
      </div>
      <ResourceMonitor variant="full" />
    </div>
  );
}
