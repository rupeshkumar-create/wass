import { dataLayer } from './data-layer';
import { dataMigration } from './migration';
import { PersonNominationInput, CompanyNominationInput, VoteInput } from '../data-types';
import { getAllSubcategories } from '../categories';

// Development utilities for testing and managing the data layer
export class DevUtils {
  // Generate sample data for testing
  async generateSampleData(count: number = 10): Promise<void> {
    console.log(`Generating ${count} sample nominations...`);
    
    const subcategories = getAllSubcategories();
    const sampleCompanies = [
      'TechTalent Solutions', 'StaffPro Global', 'RecruitMax Inc', 'TalentBridge Corp',
      'HireFlow Systems', 'WorkForce Dynamics', 'StaffingEdge Ltd', 'TalentConnect Pro'
    ];
    
    const sampleCountries = [
      'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 
      'Australia', 'Netherlands', 'Sweden', 'Singapore', 'Japan'
    ];

    for (let i = 0; i < count; i++) {
      const subcategory = subcategories[Math.floor(Math.random() * subcategories.length)];
      const company = sampleCompanies[Math.floor(Math.random() * sampleCompanies.length)];
      const country = sampleCountries[Math.floor(Math.random() * sampleCountries.length)];
      
      try {
        if (subcategory.type === 'person') {
          const firstName = this.generateRandomName();
          const lastName = this.generateRandomSurname();
          const name = `${firstName} ${lastName}`;
          
          const nomination: PersonNominationInput = {
            category: subcategory.id,
            nominee: {
              name,
              firstName,
              lastName,
              title: this.generateRandomTitle(),
              country,
              linkedin: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Math.random().toString(36).substr(2, 4)}`,
              whyVoteForMe: this.generateRandomWhyVote(),
            },
            company: {
              name: company,
              website: `https://${company.toLowerCase().replace(/\s+/g, '')}.com`,
              country,
            },
            nominator: {
              name: this.generateRandomName() + ' ' + this.generateRandomSurname(),
              email: `nominator${i}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
              company,
              linkedin: `https://linkedin.com/in/nominator-${i}`,
            },
            whyNominated: this.generateRandomNomination(),
          };
          
          await dataLayer.createNomination(nomination);
        } else {
          const companyName = `${company} ${Math.random() > 0.5 ? 'Solutions' : 'Systems'}`;
          
          const nomination: CompanyNominationInput = {
            category: subcategory.id,
            nominee: {
              name: companyName,
              website: `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
              country,
              linkedin: `https://linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
              whyVoteForMe: this.generateRandomCompanyWhyVote(),
            },
            nominator: {
              name: this.generateRandomName() + ' ' + this.generateRandomSurname(),
              email: `nominator${i}@${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
              company: companyName,
              linkedin: `https://linkedin.com/in/nominator-${i}`,
            },
            whyNominated: this.generateRandomCompanyNomination(),
          };
          
          await dataLayer.createNomination(nomination);
        }
        
        console.log(`Created sample nomination ${i + 1}/${count}`);
      } catch (error) {
        console.error(`Failed to create sample nomination ${i + 1}:`, error);
      }
    }
    
    console.log('Sample data generation complete');
  }

  // Generate sample votes
  async generateSampleVotes(count: number = 50): Promise<void> {
    console.log(`Generating ${count} sample votes...`);
    
    const nominations = await dataLayer.getAllNominations();
    const approvedNominations = nominations.filter(n => n.status === 'approved');
    
    if (approvedNominations.length === 0) {
      console.warn('No approved nominations found. Approving some nominations first...');
      // Approve first 5 nominations
      for (let i = 0; i < Math.min(5, nominations.length); i++) {
        await dataLayer.updateNomination(nominations[i].id, { status: 'approved' });
      }
      // Refresh approved nominations
      const updatedNominations = await dataLayer.getAllNominations();
      approvedNominations.push(...updatedNominations.filter(n => n.status === 'approved'));
    }

    for (let i = 0; i < count; i++) {
      const nomination = approvedNominations[Math.floor(Math.random() * approvedNominations.length)];
      
      try {
        const vote: VoteInput = {
          nomineeId: nomination.id,
          category: nomination.category,
          voter: {
            firstName: this.generateRandomName(),
            lastName: this.generateRandomSurname(),
            email: `voter${i}@example.com`,
            company: `Company ${i}`,
            linkedin: `https://linkedin.com/in/voter-${i}`,
          },
        };
        
        await dataLayer.createVote(vote);
        console.log(`Created sample vote ${i + 1}/${count}`);
      } catch (error) {
        // Skip if voter has already voted in this category
        if (error instanceof Error && error.message.includes('already voted')) {
          continue;
        }
        console.error(`Failed to create sample vote ${i + 1}:`, error);
      }
    }
    
    console.log('Sample votes generation complete');
  }

  // Database inspection utilities
  async inspectDatabase(): Promise<void> {
    console.log('=== Database Inspection ===');
    
    const stats = await dataLayer.getStats();
    console.log('Statistics:', stats);
    
    const validation = await dataMigration.validateData();
    console.log('Validation:', validation);
    
    // Storage info
    const storageType = (dataLayer as any).getStorageType();
    console.log('Storage type:', storageType);
    
    if (storageType === 'localstorage') {
      const adapter = await (dataLayer as any).getAdapter();
      if ('getStorageInfo' in adapter) {
        const storageInfo = await adapter.getStorageInfo();
        console.log('Storage info:', storageInfo);
      }
    }
  }

  // Backup and restore utilities
  async createBackup(): Promise<string> {
    console.log('Creating backup...');
    const data = await dataMigration.exportToJSON();
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data,
    };
    
    const backupString = JSON.stringify(backup, null, 2);
    console.log(`Backup created (${(backupString.length / 1024).toFixed(2)} KB)`);
    
    return backupString;
  }

  async restoreFromBackup(backupString: string): Promise<void> {
    console.log('Restoring from backup...');
    
    try {
      const backup = JSON.parse(backupString);
      
      if (!backup.data || !backup.data.nominations) {
        throw new Error('Invalid backup format');
      }
      
      // Clear existing data
      await dataMigration.clearAllData();
      
      // Import data
      const result = await dataMigration.importFromJSON(
        backup.data.nominations,
        backup.data.votes || []
      );
      
      console.log('Restore complete:', result);
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  // Performance testing
  async performanceTest(): Promise<void> {
    console.log('=== Performance Test ===');
    
    const startTime = Date.now();
    
    // Test nomination queries
    console.time('Get all nominations');
    await dataLayer.getAllNominations();
    console.timeEnd('Get all nominations');
    
    console.time('Get nominations by status');
    await dataLayer.getNominationsByStatus('approved');
    console.timeEnd('Get nominations by status');
    
    console.time('Get all votes');
    await dataLayer.getAllVotes();
    console.timeEnd('Get all votes');
    
    console.time('Get statistics');
    await dataLayer.getStats();
    console.timeEnd('Get statistics');
    
    const totalTime = Date.now() - startTime;
    console.log(`Total test time: ${totalTime}ms`);
  }

  // Helper methods for generating random data
  private generateRandomName(): string {
    const names = [
      'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa',
      'James', 'Maria', 'William', 'Jennifer', 'Richard', 'Linda', 'Thomas', 'Patricia',
      'Christopher', 'Elizabeth', 'Daniel', 'Helen', 'Matthew', 'Nancy', 'Anthony', 'Betty'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  private generateRandomSurname(): string {
    const surnames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
      'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White'
    ];
    return surnames[Math.floor(Math.random() * surnames.length)];
  }

  private generateRandomTitle(): string {
    const titles = [
      'Senior Recruiter', 'Technical Recruiter', 'Executive Recruiter', 'Talent Acquisition Manager',
      'Recruitment Consultant', 'Staffing Specialist', 'HR Business Partner', 'Talent Director',
      'Principal Recruiter', 'Lead Recruiter', 'Recruitment Manager', 'Talent Acquisition Specialist'
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private generateRandomWhyVote(): string {
    const reasons = [
      'Exceptional track record in placing top talent with 95% retention rate.',
      'Innovative approach to recruitment using AI and data analytics.',
      'Built strong relationships with both candidates and clients over 10+ years.',
      'Consistently exceeds placement targets and delivers quality results.',
      'Expert in niche technical recruiting with deep industry knowledge.',
      'Mentored junior recruiters and contributed to team success.',
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  private generateRandomCompanyWhyVote(): string {
    const reasons = [
      'Leading innovation in staffing technology with award-winning platform.',
      'Exceptional client satisfaction scores and long-term partnerships.',
      'Rapid growth while maintaining quality service standards.',
      'Industry-leading diversity and inclusion initiatives.',
      'Pioneering new approaches to talent acquisition and retention.',
      'Strong company culture and employee satisfaction ratings.',
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  private generateRandomNomination(): string {
    const reasons = [
      'Outstanding performance and dedication to excellence in recruitment.',
      'Innovative solutions that have transformed our hiring process.',
      'Exceptional leadership and mentorship in the staffing industry.',
      'Consistent delivery of high-quality candidates and results.',
      'Strong industry reputation and thought leadership.',
      'Significant contribution to advancing recruitment best practices.',
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  private generateRandomCompanyNomination(): string {
    const reasons = [
      'Revolutionary approach to staffing that sets industry standards.',
      'Exceptional service quality and client satisfaction.',
      'Innovative technology solutions that improve recruitment efficiency.',
      'Strong market presence and consistent growth.',
      'Outstanding company culture and employee development programs.',
      'Significant impact on the staffing industry through innovation.',
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }
}

// Export singleton instance
export const devUtils = new DevUtils();

// Global development utilities (available in browser console)
if (typeof window !== 'undefined') {
  (window as any).wsaDevUtils = {
    dataLayer,
    dataMigration,
    devUtils,
    
    // Quick access methods
    async stats() {
      return await dataLayer.getStats();
    },
    
    async inspect() {
      return await devUtils.inspectDatabase();
    },
    
    async backup() {
      const backup = await devUtils.createBackup();
      console.log('Backup created. Copy the following JSON:');
      console.log(backup);
      return backup;
    },
    
    async generateSamples(nominations = 10, votes = 50) {
      await devUtils.generateSampleData(nominations);
      await devUtils.generateSampleVotes(votes);
      console.log('Sample data generated');
    },
    
    async clear() {
      if (confirm('Are you sure you want to clear all data?')) {
        await dataMigration.clearAllData();
        console.log('All data cleared');
      }
    },
  };
  
  console.log('WSA Dev Utils loaded. Access via window.wsaDevUtils');
}