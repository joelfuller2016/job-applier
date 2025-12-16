# Resume Parser Test Fixes

## Proper Mock Data Structure

The mock profile data must match the UserProfileSchema from `@job-applier/core`. Here's the correct structure:

```typescript
// Helper function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Example correct mock profile
const mockProfile = {
  firstName: 'John',
  lastName: 'Doe',
  headline: 'Senior Software Engineer',
  summary: 'Senior Software Engineer with 8+ years of experience',
  contact: {
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    // Optional fields - omit if not provided, don't use null
  },
  experience: [
    {
      id: generateUUID(),
      company: 'Tech Corp',
      title: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: '2019-01',
      endDate: null, // null is OK for current position
      description: 'Led development of microservices architecture',
      highlights: [
        'Led development of microservices architecture',
        'Reduced system latency by 40%'
      ],
      skills: ['TypeScript', 'Node.js', 'Microservices']
    }
  ],
  education: [
    {
      id: generateUUID(),
      institution: 'MIT',
      degree: 'BS',
      field: 'Computer Science',
      startDate: '2011',
      endDate: '2015',
      gpa: 3.7,
      // Optional fields
    }
  ],
  skills: [
    {
      name: 'TypeScript',
      category: 'technical', // Must be one of the enum values
      proficiency: 'advanced', // NOT 'level'
      yearsOfExperience: 5
    }
  ],
  certifications: [], // Can be empty array
  projects: [], // Can be empty array
  preferences: {
    targetRoles: ['Software Engineer', 'Backend Developer'],
    targetIndustries: ['Technology'],
    preferredLocations: ['San Francisco, CA', 'Remote'],
    remotePreference: 'flexible',
    willingToRelocate: false,
    experienceLevel: 'senior',
  },
  resumePath: 'test-resume.txt',
  parsedAt: new Date().toISOString(),
};
```

## Key Changes Needed

1. Replace `name` with `firstName` and `lastName`
2. Add `id` (UUID) to all experience and education entries
3. Add `highlights` and `skills` arrays to experience entries
4. Change `level` to `proficiency` in skills
5. Remove `null` values for optional contact fields - omit them instead
6. Update preferences to match `JobPreferencesSchema`

## Example Test

```typescript
it('should extract basic contact info from resume text', async () => {
  const resumeText = `...`;
  const content: ExtractedContent = { ... };

  // Mock the Claude API response with proper schema
  mockClaudeResponse({
    firstName: 'John',
    lastName: 'Doe',
    contact: {
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
    },
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    preferences: {
      targetRoles: [],
      preferredLocations: [],
      remotePreference: 'flexible',
      willingToRelocate: false,
      experienceLevel: 'mid',
    },
    resumePath: 'test-resume.txt',
    parsedAt: content.metadata.extractedAt,
  });

  const profile = await parseResumeWithClaude(content);

  expect(profile.firstName).toBe('John');
  expect(profile.lastName).toBe('Doe');
  expect(profile.contact.email).toBe('john.doe@example.com');
});
```
