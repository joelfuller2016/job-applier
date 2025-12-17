#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { createInitCommand } from './commands/init.js';
import { createResumeCommand } from './commands/resume.js';
import { createSearchCommand } from './commands/search.js';
import { createApplyCommand } from './commands/apply.js';
import { createStatsCommand } from './commands/stats.js';
import { createHuntCommand } from './commands/hunt.js';

// Display banner
console.log(
  chalk.blue(
    figlet.textSync('Job Applier', { horizontalLayout: 'full' })
  )
);
console.log(chalk.dim('  Automated Job Application Assistant\n'));

// Create CLI program
const program = new Command();

program
  .name('job-applier')
  .description('Automated job application assistant')
  .version('1.0.0');

// Add commands
program.addCommand(createInitCommand());
program.addCommand(createResumeCommand());
program.addCommand(createSearchCommand());
program.addCommand(createApplyCommand());
program.addCommand(createStatsCommand());
program.addCommand(createHuntCommand());

// Login command
program
  .command('login <platform>')
  .description('Login to a platform (linkedin, indeed)')
  .action(async (platform: string) => {
    const { JobApplierEngine } = await import('@job-applier/orchestrator');
    const { getConfigManager } = await import('@job-applier/config');
    const ora = (await import('ora')).default;

    const config = getConfigManager();
    const platformsConfig = config.getPlatforms();
    const platformKey = platform as keyof typeof platformsConfig;
    const platformConfig = platformsConfig[platformKey];

    if (!platformConfig?.email || !platformConfig?.password) {
      console.log(chalk.red(`No credentials found for ${platform}. Run 'job-applier init' to set up.`));
      process.exit(1);
    }

    const spinner = ora(`Logging in to ${platform}...`).start();

    try {
      const engine = new JobApplierEngine();
      await engine.initialize();

      engine.setPlatformCredentials(platform as 'linkedin' | 'indeed', {
        platform: platform as any,
        email: platformConfig.email,
        password: platformConfig.password,
      });

      await engine.loginToPlatform(platform as 'linkedin' | 'indeed');
      spinner.succeed(`Logged in to ${platform}`);

      await engine.shutdown();
    } catch (error) {
      spinner.fail(`Login failed`);
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// List jobs command
program
  .command('jobs')
  .description('List saved jobs')
  .option('-s, --status <status>', 'Filter by status')
  .option('-p, --platform <platform>', 'Filter by platform')
  .action(async (options) => {
    const { JobRepository } = await import('@job-applier/database');
    const Table = (await import('cli-table3')).default;

    const jobRepo = new JobRepository();
    let jobs = jobRepo.getRecent(100);

    if (options.platform) {
      jobs = jobs.filter((j: any) => j.platform === options.platform);
    }

    if (jobs.length === 0) {
      console.log(chalk.yellow('No jobs found. Run a search first.'));
      return;
    }

    const table = new Table({
      head: [
        chalk.cyan('ID'),
        chalk.cyan('Title'),
        chalk.cyan('Company'),
        chalk.cyan('Location'),
        chalk.cyan('Platform'),
      ],
    });

    for (const job of jobs.slice(0, 20)) {
      table.push([
        job.id.substring(0, 8),
        job.title.substring(0, 30),
        job.company.name.substring(0, 20),
        job.location.substring(0, 20),
        job.platform,
      ]);
    }

    console.log(table.toString());
    if (jobs.length > 20) {
      console.log(chalk.dim(`\n... and ${jobs.length - 20} more jobs`));
    }
  });

// Applications command
program
  .command('applications')
  .description('List applications')
  .option('-s, --status <status>', 'Filter by status')
  .action(async (options) => {
    const { ApplicationRepository, JobRepository } = await import('@job-applier/database');
    const Table = (await import('cli-table3')).default;

    const appRepo = new ApplicationRepository();
    const jobRepo = new JobRepository();

    let applications: any[];
    if (options.status) {
      applications = appRepo.findByStatus(options.status);
    } else {
      // Get recent applications - we'll use findByStatus('submitted') as a workaround
      // or just get all statuses
      applications = [
        ...appRepo.findByStatus('submitted'),
        ...appRepo.findByStatus('draft'),
        ...appRepo.findByStatus('in-review'),
        ...appRepo.findByStatus('rejected'),
        ...appRepo.findByStatus('offer'),
      ];
    }

    if (applications.length === 0) {
      console.log(chalk.yellow('No applications found.'));
      return;
    }

    const table = new Table({
      head: [
        chalk.cyan('ID'),
        chalk.cyan('Job'),
        chalk.cyan('Company'),
        chalk.cyan('Status'),
        chalk.cyan('Applied'),
      ],
    });

    for (const app of applications) {
      const job = await jobRepo.findById(app.jobId);
      const statusColor = app.status === 'submitted' ? chalk.green :
        app.status === 'rejected' ? chalk.red :
          app.status.includes('offer') ? chalk.green :
            chalk.yellow;

      table.push([
        app.id.substring(0, 8),
        job?.title.substring(0, 25) || 'Unknown',
        job?.company.name.substring(0, 18) || 'Unknown',
        statusColor(app.status),
        app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '-',
      ]);
    }

    console.log(table.toString());
  });

// Error handling
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (err) {
  if (err instanceof Error && 'code' in err && err.code === 'commander.help') {
    process.exit(0);
  }
  throw err;
}
