import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { ProfileRepository } from '@job-applier/database';

/**
 * AI-powered job hunt command
 */
export function createHuntCommand(): Command {
  const command = new Command('hunt');

  command
    .description('AI-powered job hunting - search the web, find jobs, and auto-apply')
    .argument('[query...]', 'Job search query (e.g., "senior software engineer")')
    .option('-l, --location <location>', 'Job location')
    .option('-r, --remote', 'Remote jobs only')
    .option('--companies <companies>', 'Specific companies to search (comma-separated)')
    .option('-m, --max <number>', 'Maximum jobs to process', '10')
    .option('-t, --threshold <number>', 'Minimum match score (0-100)', '50')
    .option('--dry-run', 'Discover and match jobs without applying')
    .option('--no-confirm', 'Skip confirmation before each application')
    .option('--headless', 'Run browser in headless mode')
    .action(async (queryParts: string[], options) => {
      const { JobHunterOrchestrator } = await import('@job-applier/ai-job-hunter');
      const readline = await import('readline');

      const query = queryParts.join(' ');

      if (!query) {
        console.log(chalk.red('Please provide a job search query'));
        console.log(chalk.dim('Example: job-applier hunt senior software engineer'));
        process.exit(1);
      }

      // Load profile
      const profileRepo = new ProfileRepository();
      const profiles = await profileRepo.findAll();

      if (profiles.length === 0) {
        console.log(chalk.red('No profile found. Import a resume first with: job-applier resume import <path>'));
        process.exit(1);
      }

      const profile = profiles[0];
      console.log(chalk.blue(`\n🎯 Starting AI Job Hunt for: ${profile.firstName} ${profile.lastName}`));
      console.log(chalk.dim(`   Query: "${query}"${options.location ? ` in ${options.location}` : ''}`));
      console.log('');

      const orchestrator = new JobHunterOrchestrator();

      // Parse companies option
      const includeCompanies = options.companies
        ? options.companies.split(',').map((c: string) => c.trim())
        : undefined;

      // Build config
      const config = {
        searchQuery: query,
        location: options.location,
        remote: options.remote || false,
        maxJobs: parseInt(options.max, 10),
        matchThreshold: parseInt(options.threshold, 10),
        includeCompanies,
        dryRun: options.dryRun || false,
        requireConfirmation: options.confirm !== false,
      };

      // Track progress
      let discoveredCount = 0;
      let matchedCount = 0;
      const spinner = ora('Initializing AI Job Hunter...').start();

      // Create readline interface for confirmations
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const askConfirmation = (question: string): Promise<boolean> => {
        return new Promise((resolve) => {
          rl.question(question, (answer) => {
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
          });
        });
      };

      try {
        const result = await orchestrator.hunt(profile as any, config, {
          onProgress: (message) => {
            spinner.text = message;
          },

          onJobDiscovered: (job) => {
            discoveredCount++;
            spinner.text = `Discovered ${discoveredCount} jobs... (latest: ${job.title} at ${job.company})`;
          },

          onJobMatched: (job, score) => {
            matchedCount++;
            spinner.info(`${chalk.green('Match:')} ${job.title} at ${job.company} (${score}%)`);
            spinner.start();
          },

          onConfirmationRequired: async (job) => {
            spinner.stop();
            console.log('');
            console.log(chalk.bold(`📝 Ready to apply:`));
            console.log(`   ${chalk.cyan(job.title)} at ${chalk.cyan(job.company)}`);
            console.log(`   Match Score: ${chalk.green(job.matchScore + '%')}`);
            console.log(`   URL: ${chalk.dim(job.url)}`);

            const confirmed = await askConfirmation(chalk.yellow('\n   Apply to this job? (y/n): '));

            if (confirmed) {
              spinner.start('Applying...');
            }
            return confirmed;
          },

          onApplicationStart: (job) => {
            spinner.start(`Applying to ${job.title} at ${job.company}...`);
          },

          onApplicationComplete: (attempt) => {
            if (attempt.status === 'success') {
              spinner.succeed(`Applied to ${attempt.jobTitle} at ${attempt.companyName}`);
            } else if (attempt.status === 'skipped') {
              spinner.info(`Skipped ${attempt.jobTitle}`);
            } else if (attempt.status === 'requires_manual') {
              spinner.warn(`${attempt.jobTitle} requires manual intervention: ${attempt.message}`);
            } else {
              spinner.fail(`Failed to apply to ${attempt.jobTitle}: ${attempt.message}`);
            }
            spinner.start();
          },

          onError: (error, job) => {
            spinner.warn(`Error${job ? ` for ${job.title}` : ''}: ${error.message}`);
            spinner.start();
          },
        });

        spinner.stop();
        rl.close();

        // Display results summary
        console.log('');
        console.log(chalk.bold('═══════════════════════════════════════════════'));
        console.log(chalk.bold('                 HUNT RESULTS                    '));
        console.log(chalk.bold('═══════════════════════════════════════════════'));
        console.log('');

        const summaryTable = new Table({
          style: { head: [], border: [] },
        });

        summaryTable.push(
          ['Jobs Discovered:', chalk.cyan(result.jobsDiscovered.toString())],
          ['Jobs Matched:', chalk.cyan(result.jobsMatched.toString())],
          ['Applications Attempted:', chalk.cyan(result.applicationsAttempted.toString())],
          ['Successful:', chalk.green(result.applicationsSuccessful.toString())],
          ['Failed:', chalk.red(result.applicationsFailed.toString())],
        );

        console.log(summaryTable.toString());
        console.log('');

        // Show application details
        if (result.applications.length > 0) {
          console.log(chalk.bold('📋 Application Details:\n'));

          const appTable = new Table({
            head: [
              chalk.cyan('Company'),
              chalk.cyan('Title'),
              chalk.cyan('Status'),
              chalk.cyan('Notes'),
            ],
            colWidths: [18, 28, 18, 30],
            wordWrap: true,
          });

          for (const app of result.applications) {
            const statusColor =
              app.status === 'success' ? chalk.green :
              app.status === 'skipped' ? chalk.yellow :
              app.status === 'requires_manual' ? chalk.magenta :
              chalk.red;

            appTable.push([
              app.companyName.substring(0, 16),
              app.jobTitle.substring(0, 26),
              statusColor(app.status),
              (app.message || '').substring(0, 28),
            ]);
          }

          console.log(appTable.toString());
        }

        console.log('');
        if (result.applicationsSuccessful > 0) {
          console.log(chalk.green(`✅ Successfully applied to ${result.applicationsSuccessful} jobs!`));
        }
        if (options.dryRun) {
          console.log(chalk.dim('(Dry run - no applications were submitted)'));
        }
        console.log(chalk.dim(`\nSession ID: ${result.sessionId}`));
        console.log('');

      } catch (error) {
        spinner.fail('Hunt failed');
        rl.close();
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // Quick apply subcommand
  command
    .command('quick <company> <job-title>')
    .description('Quick apply to a specific job at a specific company')
    .action(async (company: string, jobTitle: string) => {
      const { JobHunterOrchestrator } = await import('@job-applier/ai-job-hunter');

      // Load profile
      const profileRepo = new ProfileRepository();
      const profiles = await profileRepo.findAll();

      if (profiles.length === 0) {
        console.log(chalk.red('No profile found. Import a resume first with: job-applier resume import <path>'));
        process.exit(1);
      }

      const profile = profiles[0];
      console.log(chalk.blue(`\n🎯 Quick Apply: "${jobTitle}" at "${company}"`));
      console.log('');

      const spinner = ora('Finding job and applying...').start();
      const orchestrator = new JobHunterOrchestrator();

      try {
        const result = await orchestrator.quickApply(company, jobTitle, profile as any, {
          onProgress: (message) => {
            spinner.text = message;
          },
          onApplicationComplete: (attempt) => {
            if (attempt.status === 'success') {
              spinner.succeed(`Applied to ${attempt.jobTitle} at ${attempt.companyName}`);
            } else {
              spinner.fail(`Failed: ${attempt.message}`);
            }
          },
        });

        console.log('');
        if (result.status === 'success') {
          console.log(chalk.green('✅ Application submitted successfully!'));
        } else {
          console.log(chalk.red(`❌ Application failed: ${result.message}`));
          if (result.screenshotPath) {
            console.log(chalk.dim(`Screenshot saved: ${result.screenshotPath}`));
          }
        }
      } catch (error) {
        spinner.fail('Quick apply failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  return command;
}
