function transform(input) {
  const settings = (input.trmnl && input.trmnl.plugin_settings && input.trmnl.plugin_settings.custom_fields_values) || {};

  const excludeDisabled = settings.exclude_disabled_jobs === true || settings.exclude_disabled_jobs === "true";
  const sortOrder = settings.job_sort_order || "alpha";

  const rawStatusFilter = settings.job_status_filter;
  const statusFilter = Array.isArray(rawStatusFilter)
    ? rawStatusFilter
    : (rawStatusFilter ? String(rawStatusFilter).split(",").map((s) => s.trim()).filter(Boolean) : []);

  const executors = (input.IDX_0 && Array.isArray(input.IDX_0.computer))
    ? input.IDX_0.computer.map((node) => ({
        offline: !!node.offline,
        temporarilyOffline: !!node.temporarilyOffline,
        numExecutors: Number(node.numExecutors || 0),
        busyExecutors: Number(node.busyExecutors || 0),
      }))
    : [];

  const rawJobs = (input.IDX_1 && Array.isArray(input.IDX_1.jobs)) ? input.IDX_1.jobs : [];

  let jobs = rawJobs.map((job) => ({
        name: job.name || "",
        color: job.color || null,
        healthReport: Array.isArray(job.healthReport)
          ? job.healthReport.slice(0, 1).map((report) => ({
              score: Number(report.score || 0),
              description: report.description || "",
            }))
          : [],
        lastBuild: job.lastBuild
          ? {
              timestamp: Number(job.lastBuild.timestamp || 0),
              duration: Number(job.lastBuild.duration || 0),
            }
          : null,
        lastCompletedBuild: job.lastCompletedBuild
          ? {
              timestamp: Number(job.lastCompletedBuild.timestamp || 0),
              duration: Number(job.lastCompletedBuild.duration || 0),
            }
          : null,
        lastSuccessfulBuild: job.lastSuccessfulBuild
          ? {
              number: job.lastSuccessfulBuild.number,
              timestamp: Number(job.lastSuccessfulBuild.timestamp || 0),
            }
          : null,
        lastFailedBuild: job.lastFailedBuild
          ? {
              number: job.lastFailedBuild.number,
              timestamp: Number(job.lastFailedBuild.timestamp || 0),
            }
          : null,
      }));

  const folderCount = jobs.filter((job) => job.color === null).length;
  jobs = jobs.filter((job) => job.color !== null);

  if (excludeDisabled) {
    jobs = jobs.filter((job) => !job.color.startsWith("disabled"));
  }

  if (statusFilter.length > 0) {
    jobs = jobs.filter((job) => statusFilter.includes(job.color.replace("_anime", "")));
  }

  if (sortOrder === "recent_run") {
    jobs = jobs.sort((a, b) => {
      const aTs = (a.lastBuild && a.lastBuild.timestamp) || (a.lastCompletedBuild && a.lastCompletedBuild.timestamp) || 0;
      const bTs = (b.lastBuild && b.lastBuild.timestamp) || (b.lastCompletedBuild && b.lastCompletedBuild.timestamp) || 0;
      return bTs - aTs;
    });
  } else if (sortOrder === "recent_failure") {
    jobs = jobs.sort((a, b) => {
      const aTs = (a.lastFailedBuild && a.lastFailedBuild.timestamp) || 0;
      const bTs = (b.lastFailedBuild && b.lastFailedBuild.timestamp) || 0;
      return bTs - aTs;
    });
  } else {
    jobs = jobs.sort((a, b) => a.name.localeCompare(b.name));
  }

  const builds = (input.IDX_2 && Array.isArray(input.IDX_2.builds))
    ? input.IDX_2.builds.map((build) => ({
        number: build.number,
        description: build.description || "",
        result: build.result || "",
        timestamp: Number(build.timestamp || 0),
        duration: Number(build.duration || 0),
      }))
    : [];

  return {
    trmnl: input.trmnl,
    IDX_0: {
      computer: executors,
    },
    IDX_1: {
      jobs,
      jobs_total: rawJobs.length - folderCount,
      jobs_folder_count: folderCount,
    },
    IDX_2: {
      builds,
    },
  };
}
