import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { JobApplierEngine } from '@job-applier/orchestrator';
import { ProfileRepository } from '@job-applier/database';
import { SkillMatch } from '@job-applier/core';

/**
 * Job search command
 */
export function createSearchCommand(): Command {
  const command = new Command('search');

  command
    .description('Search for jobs')
    .argument('[query...]', 'Search query')
    .option('-p, --platforms <platforms>', 'Platforms to search (comma-separated)', 'linkedin,indeed')
    .option('-l, --location <location>', 'Job location')
    .option('-r, --remote', 'Remote jobs only')
    .option('-m, --max <number>', 'Maximum results', '25')
    .option('--min-score <number>', 'Minimum match score (0-1)', '0.5')
    .option('--easy-apply', 'Easy Apply jobs only')
    .action(async (queryParts: string[], options) => {
      const query = queryParts.join(' ');

      // Load profile
      const profileRepo = new ProfileRepository();
      const profiles = await profileRepo.findAll();

      if (profiles.length === 0) {
        console.log(chalk.red('No profile found. Import a resume first with: job-applier resume import <path>'));
        process.exit(1);
      }

      const profile = profiles[0];
      console.log(chalk.blue(`\nSearching as: ${profile.firstName} ${profile.lastName}\n`));

      const spinner = ora('Searching for jobs...').start();

      try {
        const engine = new JobApplierEngine();
        await engine.initialize();
        await engine.loadProfile(profile.resumePath || '');

        // Discover jobs
        const searchQueries = query ? [query] : undefined;
        const jobs = await engine.discoverJobs(searchQueries, {
          maxResults: parseInt(options.max, 10),
        });

        spinner.text = 'Analyzing job matches...';

        // Match jobs
        const minScore = parseFloat(options.minScore);
        const matches = await engine.matchJobs(jobs, minScore);

        spinner.succeed(`Found ${jobs.length} jobs, ${matches.length} match your profile`);

        if (matches.length === 0) {
          console.log(chalk.yellow('\nNo matching jobs found. Try adjusting your search criteria.'));
          return;
        }

        // Display results
        console.log(chalk.bold('\n📋 Top Matching Jobs:\n'));

        const table = new Table({
          head: [
            chalk.cyan('#'),
            chalk.cyan('Score'),
            chalk.cyan('Title'),
            chalk.cyan('Company'),
            chalk.cyan('Location'),
            chalk.cyan('Platform'),
          ],
          colWidths: [4, 8, 30, 20, 20, 10],
          wordWrap: true,
        });

        const jobMap = new Map(jobs.map(j => [j.id, j]));

        for (let i = 0; i < Math.min(matches.length, 15); i++) {
          const match = matches[i];
          const job = jobMap.get(match.jobId);
          if (!job) continue;

          // overallScore is already 0-100 scale
          const scoreColor = match.overallScore >= 80 ? chalk.green :
            match.overallScore >= 60 ? chalk.yellow : chalk.red;

          table.push([
            (i + 1).toString(),
            scoreColor(`${Math.round(match.overallScore)}%`),
            job.title.substring(0, 28),
            job.company.name.substring(0, 18),
            job.location.substring(0, 18),
            job.platform,
          ]);
        }

        console.log(table.toString());

        // Show match details for top 3
        console.log(chalk.bold('\n🎯 Top Match Details:\n'));

        for (let i = 0; i < Math.min(matches.length, 3); i++) {
          const match = matches[i];
          const job = jobMap.get(match.jobId);
          if (!job) continue;

          console.log(chalk.bold(`${i + 1}. ${job.title} at ${job.company.name}`));
          // Scores are already 0-100 scale
          console.log(`   Match Score: ${chalk.green(match.overallScore + '%')}`);
          console.log(`   Skills: ${chalk.green(match.skillScore + '%')} | Experience: ${chalk.green(match.experienceScore + '%')}`);

          const matchedSkills = match.skillMatches.filter((sm: SkillMatch) => sm.userHas).map((sm: SkillMatch) => sm.skill);
          const missingSkills = match.skillMatches.filter((sm: SkillMatch) => !sm.userHas).map((sm: SkillMatch) => sm.skill);

          if (matchedSkills.length > 0) {
            console.log(`   ✅ Matched: ${chalk.cyan(matchedSkills.slice(0, 5).join(', '))}`);
          }
          if (missingSkills.length > 0) {
            console.log(`   ❌ Missing: ${chalk.yellow(missingSkills.slice(0, 5).join(', '))}`);
          }
          console.log(`   Recommendations: ${match.recommendations.length > 0 ? chalk.cyan(match.recommendations[0]) : chalk.dim('None')}`);
          console.log(`   URL: ${chalk.blue(job.url)}`);
          console.log('');
        }

        console.log(chalk.dim(`\nTo apply to these jobs, run: job-applier apply\n`));

        await engine.shutdown();
      } catch (error) {
        spinner.fail('Search failed');
        console.error(chalk.red(error));
        process.exit(1);
      }
    });

  return command;
}
