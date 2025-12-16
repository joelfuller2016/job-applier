import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { ApplicationAnalytics } from '@job-applier/application-tracker';

/**
 * Statistics command
 */
export function createStatsCommand(): Command {
  const command = new Command('stats');

  command
    .description('View application statistics')
    .option('-d, --days <number>', 'Days of history', '30')
    .action(async (options) => {
      const analytics = new ApplicationAnalytics();

      console.log(chalk.bold.blue('\n📊 Application Statistics\n'));

      // Overall stats
      const stats = await analytics.getStats();

      console.log(chalk.bold('Overview:'));
      console.log(`  Total Applications: ${chalk.cyan(stats.total)}`);
      console.log(`  This Week: ${chalk.cyan(stats.thisWeek)}`);
      console.log(`  This Month: ${chalk.cyan(stats.thisMonth)}`);
      console.log(`  Success Rate: ${chalk.green(stats.successRate.toFixed(1) + '%')}`);
      if (stats.averageResponseTimeDays !== null) {
        console.log(`  Avg Response Time: ${chalk.yellow(stats.averageResponseTimeDays.toFixed(1) + ' days')}`);
      }

      // Status breakdown
      console.log(chalk.bold('\nBy Status:'));
      const statusTable = new Table({
        head: [chalk.cyan('Status'), chalk.cyan('Count')],
      });

      const statusOrder = [
        'pending', 'submitted', 'under_review', 'interview_scheduled',
        'interviewed', 'offer_received', 'offer_accepted', 'offer_declined',
        'rejected', 'withdrawn',
      ];

      for (const status of statusOrder) {
        const count = stats.byStatus[status as keyof typeof stats.byStatus];
        if (count > 0) {
          const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          statusTable.push([label, count.toString()]);
        }
      }

      console.log(statusTable.toString());

      // Platform breakdown
      console.log(chalk.bold('\nBy Platform:'));
      const platformMetrics = await analytics.getPlatformMetrics();

      const platformTable = new Table({
        head: [
          chalk.cyan('Platform'),
          chalk.cyan('Applied'),
          chalk.cyan('Responses'),
          chalk.cyan('Interviews'),
          chalk.cyan('Offers'),
          chalk.cyan('Response %'),
        ],
      });

      for (const metric of platformMetrics) {
        platformTable.push([
          metric.platform.charAt(0).toUpperCase() + metric.platform.slice(1),
          metric.applications.toString(),
          metric.responses.toString(),
          metric.interviews.toString(),
          metric.offers.toString(),
          metric.responseRate.toFixed(1) + '%',
        ]);
      }

      console.log(platformTable.toString());

      // Funnel metrics
      const funnel = await analytics.getFunnelMetrics();

      console.log(chalk.bold('\nApplication Funnel:'));
      console.log(`  Applied:     ${chalk.cyan(funnel.applied.toString().padStart(4))} (100%)`);
      console.log(`  Reviewed:    ${chalk.cyan(funnel.reviewed.toString().padStart(4))} (${funnel.conversionRates.appliedToReviewed.toFixed(1)}%)`);
      console.log(`  Interviewed: ${chalk.cyan(funnel.interviewed.toString().padStart(4))} (${funnel.conversionRates.reviewedToInterviewed.toFixed(1)}%)`);
      console.log(`  Offered:     ${chalk.cyan(funnel.offered.toString().padStart(4))} (${funnel.conversionRates.interviewedToOffered.toFixed(1)}%)`);
      console.log(`  Accepted:    ${chalk.green(funnel.accepted.toString().padStart(4))} (${funnel.conversionRates.offeredToAccepted.toFixed(1)}%)`);

      // Recent timeline
      const days = parseInt(options.days, 10);
      const timeline = await analytics.getTimeline(days);

      // Group by week
      console.log(chalk.bold(`\nRecent Activity (Last ${days} days):`));

      const recentDays = timeline.slice(-7);
      const timelineTable = new Table({
        head: [
          chalk.cyan('Date'),
          chalk.cyan('Applied'),
          chalk.cyan('Responses'),
          chalk.cyan('Interviews'),
        ],
      });

      for (const day of recentDays) {
        if (day.applications > 0 || day.responses > 0 || day.interviews > 0) {
          timelineTable.push([
            day.date,
            day.applications.toString(),
            day.responses.toString(),
            day.interviews.toString(),
          ]);
        }
      }

      if (timelineTable.length > 0) {
        console.log(timelineTable.toString());
      } else {
        console.log(chalk.dim('  No recent activity'));
      }

      // Top job titles
      const topTitles = await analytics.getTopJobTitles(5);

      if (topTitles.length > 0) {
        console.log(chalk.bold('\nTop Applied Positions:'));
        for (const title of topTitles) {
          console.log(`  • ${title.title} (${title.count} apps, ${title.interviews} interviews)`);
        }
      }

      console.log('');
    });

  return command;
}
