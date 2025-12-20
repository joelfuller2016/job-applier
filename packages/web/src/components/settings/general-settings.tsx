  React.useEffect(() => {
    if (!settings) return;

    form.reset({
      defaultKeywords: settings.preferences?.defaultKeywords ?? '',
      defaultLocation: settings.preferences?.defaultLocation ?? '',
      autoApplyEnabled: settings.preferences?.autoApply ?? false,
      matchThreshold: settings.preferences?.minMatchScore ?? 70,
      browserHeadless: settings.browser?.headless ?? true,
      maxApplicationsPerDay: settings.rateLimit?.maxApplicationsPerDay ?? 10,
      applicationDelay: Math.max(
        1,
        Math.round((settings.rateLimit?.minDelayBetweenActions ?? 5000) / 1000)
      ),
    });
  }, [settings]);