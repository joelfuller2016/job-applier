import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { JobApplierEngine, SupportedPlatform } from '@job-applier/orchestrator';
import { ProfileRepository } from '@job-applier/database';
import { getConfigManager } from '@job-applier/config';

/**
 * Job application command
 */
export function createApplyCommand(): Command {
  const command = new Command('apply');

  command
    .description('Apply to jobs')
    .option('-a, --auto', 'Automatically apply to matching jobs')
    .option('-n, --max <number>', 'Maximum applications', '10')
    .option('-m, --min-score <number>', 'Minimum match score', '0.6')
    .option('-p, --platforms <platforms>', 'Platforms (comma-separated)', 'linkedin,indeed')
    .option('--cover-letter', 'Generate cover letters', true)
    .option('--dry-run', 'Preview without applying')
    .option('-q, --query <query>', 'Search query for jobs')
    .action(async (options) => {
      // Load profile
      const profileRepo = new ProfileRepository();
      const profiles = await profileRepo.findAll();

      if (profiles.length === 0) {
        console.log(chalk.red('No profile found. Import a resume first.'));
        process.exit(1);
      }

      const profile = profiles[0];
      const config = getConfigManager();

      console.log(chalk.blue.bold(`\n🚀 Job Application Assistant\n`));
      console.log(`Profile: ${profile.firstName} ${profile.lastName}`);
      console.log(`Mode: ${options.auto ? chalk.green('Automatic') : chalk.yellow('Interactive')}`);
      if (options.dryRun) {
        console.log(chalk.yellow('DRY RUN - No applications will be submitted'));
      }
      console.log('');

      const platforms = options.platforms.split(',') as SupportedPlatform[];
      const spinner = ora('Initializing...').start();

      try {
        const engine = new JobApplierEngine();
        await engine.initialize();
        await engine.loadProfile(profile.resumePath || '');

        // Set platform credentials from environment
        for (const platform of platforms) {
          const platformsConfig = config.getPlatforms();
          const platformConfig = platformsConfig[platform as keyof typeof platformsConfig];
          if (platformConfig?.email && platformConfig?.password) {
            engine.setPlatformCredentials(platform, {
              platform: platform as any,
              email: platformConfig.email,
              password: platformConfig.password,
            });
          }
        }

        // Login to platforms
        spinner.text = 'Logging in to platforms...';
        for (const platform of platforms) {
          try {
            await engine.loginToPlatform(platform);
            spinner.text = `Logged in to ${platform}`;
          } catch (error) {
            console.warn(chalk.yellow(`\nWarning: Could not log in to ${platform}`));
          }
        }

        // Search for jobs
        spinner.text = 'Searching for jobs...';
        const searchQueries = options.query ? [options.query] : undefined;
        const jobs = await engine.discoverJobs(searchQueries, {
          platforms,
          maxResults: parseInt(options.max, 10) * 3,
        });

        spinner.text = 'Matching jobs to profile...';
        const minScore = parseFloat(options.minScore);
        const matches = await engine.matchJobs(jobs, minScore);

        spinner.succeed(`Found ${matches.length} matching jobs`);

        if (matches.length === 0) {
          console.log(chalk.yellow('\nNo matching jobs found.'));
          await engine.shutdown();
          return;
        }

        const jobMap = new Map(jobs.map(j => [j.id, j]));
        const maxApply = parseInt(options.max, 10);
        const toApply = matches
          .filter(m => m.fitCategory !== 'unlikely')
          .slice(0, maxApply);

        console.log(chalk.bold(`\n📋 Jobs to Apply (${toApply.length}):\n`));

        // Show jobs to apply
        const table = new Table({
          head: [
            chalk.cyan('#'),
            chalk.cyan('Score'),
            chalk.cyan('Title'),
            chalk.cyan('Company'),
            chalk.cyan('Rec'),
          ],
        });

        for (let i = 0; i < toApply.length; i++) {
          const match = toApply[i];
          const job = jobMap.get(match.jobId);
          if (!job) continue;

          const fitColor = match.fitCategory === 'excellent' || match.fitCategory === 'good' ? chalk.green :
            match.fitCategory === 'moderate' ? chalk.yellow : chalk.red;

          table.push([
            (i + 1).toString(),
            `${Math.round(match.overallScore)}%`,
            job.title.substring(0, 35),
            job.company.name.substring(0, 20),
            fitColor(match.fitCategory || 'moderate'),
          ]);
        }

        console.log(table.toString());

        // Confirm if not auto mode
        if (!options.auto && !options.dryRun) {
          const { proceed } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'proceed',
              message: `Proceed to apply to ${toApply.length} jobs?`,
              default: true,
            },
          ]);

          if (!proceed) {
            console.log(chalk.yellow('Cancelled.'));
            await engine.shutdown();
            return;
          }
        }

        // Apply to jobs
        console.log(chalk.bold('\n🎯 Applying to Jobs...\n'));

        let submitted = 0;
        let failed = 0;

        for (let i = 0; i < toApply.length; i++) {
          const match = toApply[i];
          const job = jobMap.get(match.jobId);
          if (!job) continue;

          const applySpinner = ora(`[${i + 1}/${toApply.length}] ${job.title} at ${job.company.name}`).start();

          try {
            const application = await engine.applyToJob(job, {
              generateCoverLetter: options.coverLetter,
              dryRun: options.dryRun,
            });

            if (application.status === 'submitted') {
              applySpinner.succeed(`Applied: ${job.title}`);
              submitted++;
            } else if (options.dryRun) {
              applySpinner.info(`Would apply: ${job.title}`);
              submitted++;
            } else {
              applySpinner.warn(`Pending: ${job.title}`);
            }
          } catch (error) {
            applySpinner.fail(`Failed: ${job.title}`);
            console.error(chalk.red(`  Error: ${error instanceof Error ? error.message : String(error)}`));
            failed++;
          }

          // Delay between applications
          if (i < toApply.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        // Summary
        console.log(chalk.bold('\n📊 Summary:\n'));
        console.log(`  ${chalk.green('✓')} Submitted: ${submitted}`);
        console.log(`  ${chalk.red('✗')} Failed: ${failed}`);
        console.log(`  Total: ${toApply.length}`);

        if (options.dryRun) {
          console.log(chalk.yellow('\nDry run complete. No applications were actually submitted.'));
          console.log(chalk.dim('Run without --dry-run to submit applications.'));
        }

        await engine.shutdown();
      } catch (error) {
        spinner.fail('Application process failed');
        console.error(chalk.red(error));
        process.exit(1);
      }
    });

  return command;
}
