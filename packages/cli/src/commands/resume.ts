import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import Table from 'cli-table3';
import { JobApplierEngine } from '@job-applier/orchestrator';
import { ProfileRepository } from '@job-applier/database';

/**
 * Resume management commands
 */
export function createResumeCommand(): Command {
  const command = new Command('resume');

  command
    .description('Manage resumes and profiles');

  // Import resume
  command
    .command('import <path>')
    .description('Import a resume and create a profile')
    .action(async (resumePath: string) => {
      const absolutePath = path.resolve(resumePath);

      // Check if file exists
      try {
        await fs.access(absolutePath);
      } catch {
        console.error(chalk.red(`File not found: ${absolutePath}`));
        process.exit(1);
      }

      const spinner = ora('Parsing resume...').start();

      try {
        const engine = new JobApplierEngine();
        const profile = await engine.loadProfile(absolutePath);

        spinner.succeed('Resume parsed successfully');

        console.log(chalk.green.bold('\n📋 Profile Created:\n'));
        console.log(`Name: ${chalk.cyan(profile.firstName)} ${chalk.cyan(profile.lastName)}`);
        console.log(`Email: ${chalk.cyan(profile.contact.email)}`);
        if (profile.contact.phone) {
          console.log(`Phone: ${chalk.cyan(profile.contact.phone)}`);
        }
        if (profile.contact.location) {
          console.log(`Location: ${chalk.cyan(profile.contact.location)}`);
        }

        console.log(chalk.bold('\nExperience:'));
        for (const exp of profile.experience.slice(0, 3)) {
          console.log(`  • ${chalk.yellow(exp.title)} at ${exp.company}`);
          console.log(`    ${exp.startDate} - ${exp.endDate || 'Present'}`);
        }

        console.log(chalk.bold('\nSkills:'));
        const skillNames = profile.skills.slice(0, 10).map(s => s.name);
        console.log(`  ${skillNames.join(', ')}`);

        console.log(chalk.bold('\nEducation:'));
        for (const edu of profile.education) {
          console.log(`  • ${edu.degree} in ${edu.field}`);
          console.log(`    ${edu.institution}`);
        }

        console.log(chalk.green.bold(`\n✅ Profile saved with ID: ${profile.id}\n`));
      } catch (error) {
        spinner.fail('Failed to parse resume');
        console.error(chalk.red(error));
        process.exit(1);
      }
    });

  // List profiles
  command
    .command('list')
    .description('List all profiles')
    .action(async () => {
      const profileRepo = new ProfileRepository();
      const profiles = profileRepo.findAll();

      if (profiles.length === 0) {
        console.log(chalk.yellow('No profiles found. Import a resume first.'));
        return;
      }

      const table = new Table({
        head: [
          chalk.cyan('ID'),
          chalk.cyan('Name'),
          chalk.cyan('Email'),
          chalk.cyan('Experience'),
          chalk.cyan('Skills'),
        ],
      });

      for (const profile of profiles) {
        table.push([
          profile.id.substring(0, 8),
          `${profile.firstName} ${profile.lastName}`,
          profile.contact.email,
          `${profile.experience.length} positions`,
          `${profile.skills.length} skills`,
        ]);
      }

      console.log(table.toString());
    });

  // Show profile details
  command
    .command('show [id]')
    .description('Show profile details')
    .action(async (id?: string) => {
      const profileRepo = new ProfileRepository();

      let profile;
      if (id) {
        profile = profileRepo.findById(id);
      } else {
        const profiles = profileRepo.findAll();
        if (profiles.length === 0) {
          console.log(chalk.yellow('No profiles found.'));
          return;
        }
        profile = profiles[0];
      }

      if (!profile) {
        console.log(chalk.red('Profile not found.'));
        return;
      }

      console.log(chalk.bold.blue(`\n📋 Profile: ${profile.firstName} ${profile.lastName}\n`));

      console.log(chalk.bold('Contact:'));
      console.log(`  Email: ${profile.contact.email}`);
      if (profile.contact.phone) console.log(`  Phone: ${profile.contact.phone}`);
      if (profile.contact.location) console.log(`  Location: ${profile.contact.location}`);
      if (profile.contact.linkedin) console.log(`  LinkedIn: ${profile.contact.linkedin}`);

      if (profile.summary) {
        console.log(chalk.bold('\nSummary:'));
        console.log(`  ${profile.summary.substring(0, 200)}...`);
      }

      console.log(chalk.bold('\nExperience:'));
      for (const exp of profile.experience) {
        console.log(`  ${chalk.yellow(exp.title)} at ${chalk.cyan(exp.company)}`);
        console.log(`    ${exp.startDate} - ${exp.endDate || 'Present'}`);
        if (exp.description) {
          console.log(`    ${exp.description.substring(0, 100)}...`);
        }
      }

      console.log(chalk.bold('\nEducation:'));
      for (const edu of profile.education) {
        console.log(`  ${chalk.yellow(edu.degree)} in ${edu.field}`);
        console.log(`    ${edu.institution} (${edu.endDate || 'N/A'})`);
      }

      console.log(chalk.bold('\nSkills:'));
      const skillsByLevel = {
        expert: profile.skills.filter(s => s.proficiency === 'expert'),
        advanced: profile.skills.filter(s => s.proficiency === 'advanced'),
        intermediate: profile.skills.filter(s => s.proficiency === 'intermediate'),
        beginner: profile.skills.filter(s => s.proficiency === 'beginner'),
      };

      if (skillsByLevel.expert.length > 0) {
        console.log(`  Expert: ${skillsByLevel.expert.map(s => s.name).join(', ')}`);
      }
      if (skillsByLevel.advanced.length > 0) {
        console.log(`  Advanced: ${skillsByLevel.advanced.map(s => s.name).join(', ')}`);
      }
      if (skillsByLevel.intermediate.length > 0) {
        console.log(`  Intermediate: ${skillsByLevel.intermediate.map(s => s.name).join(', ')}`);
      }

      console.log('');
    });

  // Delete profile
  command
    .command('delete <id>')
    .description('Delete a profile')
    .option('-f, --force', 'Skip confirmation')
    .action(async (id: string, options) => {
      const profileRepo = new ProfileRepository();
      const profile = await profileRepo.findById(id);

      if (!profile) {
        console.log(chalk.red('Profile not found.'));
        return;
      }

      if (!options.force) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Delete profile for ${profile.firstName} ${profile.lastName}?`,
            default: false,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow('Cancelled.'));
          return;
        }
      }

      profileRepo.delete(id);
      console.log(chalk.green('Profile deleted.'));
    });

  return command;
}
