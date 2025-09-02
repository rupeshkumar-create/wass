import { loopsClient, LoopsError } from './client';

/**
 * Real-time Loops Sync for World Staffing Awards 2026
 * 
 * Sync Flow:
 * 1. Form submission → Sync nominator with "Nominator" user group
 * 2. Admin approval → Sync nominee with "Nominess" user group + live link
 *                  → Update nominator with "Nominator Live" user group + nominee live link
 * 3. User votes → Sync voter with "Voters" user group
 */

export interface LoopsNominatorData {
  firstname: string;
  lastname: string;
  email: string;
  linkedin?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  country?: string;
  nomineeLink?: string; // For "Nominator Live" updates
}

export interface LoopsNomineeData {
  firstname?: string;
  lastname?: string;
  email?: string;
  linkedin?: string;
  jobtitle?: string;
  company?: string;
  phone?: string;
  country?: string;
  type: 'person' | 'company';
  companyName?: string;
  companyWebsite?: string;
  companyLinkedin?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyCountry?: string;
  companyIndustry?: string;
  companySize?: string;
  subcategoryId: string;
  nominationId: string;
  liveUrl?: string;
}

export interface LoopsVoterData {
  firstname: string;
  lastname: string;
  email: string;
  linkedin?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  country?: string;
  votedFor: string;
  subcategoryId: string;
}

/**
 * Sync nominator to Loops when nomination is submitted
 * User Group: "Nominator"
 */
export async function syncNominatorToLoops(data: LoopsNominatorData): Promise<{
  success: boolean;
  contactId?: string;
  error?: string;
}> {
  try {
    console.log(`🔄 Syncing nominator to Loops: ${data.email}`);

    // Prepare contact data for Loops
    const contactData: any = {
      email: data.email.toLowerCase(),
      firstName: data.firstname,
      lastName: data.lastname,
      source: 'World Staffing Awards 2026',
    };

    // Add optional fields
    if (data.linkedin) contactData.linkedin = data.linkedin;
    if (data.company) contactData.company = data.company;
    if (data.jobTitle) contactData.jobTitle = data.jobTitle;
    if (data.phone) contactData.phone = data.phone;
    if (data.country) contactData.country = data.country;
    if (data.nomineeLink) contactData.nomineeLink = data.nomineeLink;

    // Create or update contact first
    let contactResult;
    try {
      contactResult = await loopsClient.loopsFetch('/contacts/create', {
        method: 'POST',
        body: contactData,
      });
    } catch (error) {
      // If contact already exists (409), update it instead
      if (error instanceof Error && error.message.includes('409')) {
        console.log(`Contact exists, updating: ${data.email}`);
        contactResult = await loopsClient.loopsFetch('/contacts/update', {
          method: 'PUT',
          body: contactData,
        });
      } else {
        throw error;
      }
    }

    // Set user group as custom property
    const userGroup = data.nomineeLink ? 'Nominator Live' : 'Nominator';
    
    // Update contact with user group property
    try {
      await loopsClient.loopsFetch('/contacts/update', {
        method: 'PUT',
        body: {
          email: data.email.toLowerCase(),
          userGroup: userGroup,
        },
      });
      console.log(`✅ Set userGroup property to "${userGroup}": ${data.email}`);
    } catch (updateError) {
      console.warn(`⚠️ Failed to set userGroup property: ${updateError}`);
    }

    console.log(`✅ Nominator synced to Loops: ${data.email}`);

    return {
      success: true,
      contactId: contactResult.id,
    };
  } catch (error) {
    console.error(`❌ Failed to sync nominator to Loops ${data.email}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync nominee to Loops when nomination is approved
 * User Group: "Nominess"
 */
export async function syncNomineeToLoops(data: LoopsNomineeData): Promise<{
  success: boolean;
  contactId?: string;
  error?: string;
}> {
  try {
    console.log(`🔄 Syncing nominee to Loops: ${data.email || data.companyName}`);

    if (data.type === 'person') {
      // Sync person nominee
      if (!data.email) {
        throw new Error('Email is required for person nominees');
      }

      const contactData: any = {
        email: data.email.toLowerCase(),
        firstName: data.firstname || '',
        lastName: data.lastname || '',
        source: 'World Staffing Awards 2026',
        nomineeType: 'person',
        category: data.subcategoryId,
        nominationId: data.nominationId,
      };

      // Add optional fields
      if (data.linkedin) contactData.linkedin = data.linkedin;
      if (data.jobtitle) contactData.jobTitle = data.jobtitle;
      if (data.company) contactData.company = data.company;
      if (data.phone) contactData.phone = data.phone;
      if (data.country) contactData.country = data.country;
      if (data.liveUrl) contactData.liveUrl = data.liveUrl;

      // Create or update contact first
      let contactResult;
      try {
        contactResult = await loopsClient.loopsFetch('/contacts/create', {
          method: 'POST',
          body: contactData,
        });
      } catch (error) {
        // If contact already exists (409), update it instead
        if (error instanceof Error && error.message.includes('409')) {
          console.log(`Contact exists, updating: ${data.email}`);
          contactResult = await loopsClient.loopsFetch('/contacts/update', {
            method: 'PUT',
            body: contactData,
          });
        } else {
          throw error;
        }
      }

      // Set user group as custom property
      try {
        await loopsClient.loopsFetch('/contacts/update', {
          method: 'PUT',
          body: {
            email: data.email.toLowerCase(),
            userGroup: 'Nominess',
          },
        });
        console.log(`✅ Set userGroup property to "Nominess": ${data.email}`);
      } catch (updateError) {
        console.warn(`⚠️ Failed to set userGroup property: ${updateError}`);
      }

      console.log(`✅ Person nominee synced to Loops: ${data.email}`);

      return {
        success: true,
        contactId: contactResult.id,
      };
    } else {
      // For company nominees, we'll use a placeholder email or company email
      const companyEmail = data.companyEmail || `contact@${data.companyName?.toLowerCase().replace(/\s+/g, '')}.com`;
      
      const contactData: any = {
        email: companyEmail,
        firstName: 'Company',
        lastName: data.companyName || 'Nominee',
        source: 'World Staffing Awards 2026',
        nomineeType: 'company',
        category: data.subcategoryId,
        nominationId: data.nominationId,
        companyName: data.companyName,
      };

      if (data.companyWebsite) contactData.website = data.companyWebsite;
      if (data.companyLinkedin) contactData.linkedin = data.companyLinkedin;
      if (data.companyPhone) contactData.phone = data.companyPhone;
      if (data.companyCountry) contactData.country = data.companyCountry;
      if (data.companyIndustry) contactData.industry = data.companyIndustry;
      if (data.companySize) contactData.companySize = data.companySize;
      if (data.liveUrl) contactData.liveUrl = data.liveUrl;

      // Create or update contact first
      let contactResult;
      try {
        contactResult = await loopsClient.loopsFetch('/contacts/create', {
          method: 'POST',
          body: contactData,
        });
      } catch (error) {
        // If contact already exists (409), update it instead
        if (error instanceof Error && error.message.includes('409')) {
          console.log(`Contact exists, updating: ${companyEmail}`);
          contactResult = await loopsClient.loopsFetch('/contacts/update', {
            method: 'PUT',
            body: contactData,
          });
        } else {
          throw error;
        }
      }

      // Set user group as custom property
      try {
        await loopsClient.loopsFetch('/contacts/update', {
          method: 'PUT',
          body: {
            email: companyEmail,
            userGroup: 'Nominess',
          },
        });
        console.log(`✅ Set userGroup property to "Nominess": ${data.companyName}`);
      } catch (updateError) {
        console.warn(`⚠️ Failed to set userGroup property: ${updateError}`);
      }

      console.log(`✅ Company nominee synced to Loops: ${data.companyName}`);

      return {
        success: true,
        contactId: contactResult.id,
      };
    }
  } catch (error) {
    console.error(`❌ Failed to sync nominee to Loops:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync voter to Loops when vote is cast
 * User Group: "Voters"
 */
export async function syncVoterToLoops(data: LoopsVoterData): Promise<{
  success: boolean;
  contactId?: string;
  error?: string;
}> {
  try {
    console.log(`🔄 Syncing voter to Loops: ${data.email}`);

    const contactData: any = {
      email: data.email.toLowerCase(),
      firstName: data.firstname,
      lastName: data.lastname,
      source: 'World Staffing Awards 2026',
      votedFor: data.votedFor,
      voteCategory: data.subcategoryId,
      lastVoteDate: new Date().toISOString(),
    };

    // Add optional fields
    if (data.linkedin) contactData.linkedin = data.linkedin;
    if (data.company) contactData.company = data.company;
    if (data.jobTitle) contactData.jobTitle = data.jobTitle;
    if (data.phone) contactData.phone = data.phone;
    if (data.country) contactData.country = data.country;

    // Create or update contact first
    let contactResult;
    try {
      contactResult = await loopsClient.loopsFetch('/contacts/create', {
        method: 'POST',
        body: contactData,
      });
    } catch (error) {
      // If contact already exists (409), update it instead
      if (error instanceof Error && error.message.includes('409')) {
        console.log(`Contact exists, updating: ${data.email}`);
        contactResult = await loopsClient.loopsFetch('/contacts/update', {
          method: 'PUT',
          body: contactData,
        });
      } else {
        throw error;
      }
    }

    // Set user group as custom property
    try {
      await loopsClient.loopsFetch('/contacts/update', {
        method: 'PUT',
        body: {
          email: data.email.toLowerCase(),
          userGroup: 'Voters',
        },
      });
      console.log(`✅ Set userGroup property to "Voters": ${data.email}`);
    } catch (updateError) {
      console.warn(`⚠️ Failed to set userGroup property: ${updateError}`);
    }

    console.log(`✅ Voter synced to Loops: ${data.email}`);

    return {
      success: true,
      contactId: contactResult.id,
    };
  } catch (error) {
    console.error(`❌ Failed to sync voter to Loops ${data.email}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update nominator to "Nominator Live" user group when their nominee is approved
 */
export async function updateNominatorToLive(
  nominatorEmail: string,
  nomineeData: { name: string; liveUrl: string }
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log(`🔄 Updating nominator to "Nominator Live": ${nominatorEmail}`);

    // Update contact with nominee live link and user group in single call
    await loopsClient.loopsFetch('/contacts/update', {
      method: 'PUT',
      body: {
        email: nominatorEmail.toLowerCase(),
        nomineeName: nomineeData.name,
        nomineeLiveUrl: nomineeData.liveUrl,
        approvalDate: new Date().toISOString(),
        userGroup: 'Nominator Live', // Update user group in same call
      },
    });

    console.log(`✅ Updated contact to "Nominator Live" with nominee link: ${nominatorEmail}`);

    // The userGroup property will distinguish between regular and live nominators

    console.log(`✅ Nominator updated to "Nominator Live": ${nominatorEmail}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error(`❌ Failed to update nominator to live ${nominatorEmail}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test Loops connection
 */
export async function testLoopsConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Test API key by creating a test contact
    const testContact = {
      email: 'test-connection@worldstaffingawards.com',
      firstName: 'Test',
      lastName: 'Connection',
      source: 'World Staffing Awards 2026 - Connection Test'
    };

    await loopsClient.loopsFetch('/contacts/create', {
      method: 'POST',
      body: testContact,
    });

    return {
      success: true,
    };
  } catch (error) {
    // If it's a 409 (contact already exists), that's actually success
    if (error instanceof LoopsError && error.status === 409) {
      return {
        success: true,
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch sync multiple contacts to Loops
 */
export async function batchSyncToLoops(items: Array<{
  type: 'nominator' | 'nominee' | 'voter';
  data: LoopsNominatorData | LoopsNomineeData | LoopsVoterData;
}>): Promise<{
  success: boolean;
  results: Array<{ success: boolean; contactId?: string; error?: string }>;
  totalSynced: number;
}> {
  const results: Array<{ success: boolean; contactId?: string; error?: string }> = [];
  let totalSynced = 0;

  console.log(`🔄 Starting batch sync of ${items.length} items to Loops`);

  // Process in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (item) => {
      switch (item.type) {
        case 'nominator':
          return await syncNominatorToLoops(item.data as LoopsNominatorData);
        case 'nominee':
          return await syncNomineeToLoops(item.data as LoopsNomineeData);
        case 'voter':
          return await syncVoterToLoops(item.data as LoopsVoterData);
        default:
          return { success: false, error: 'Unknown sync type' };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
        if (result.value.success) totalSynced++;
      } else {
        results.push({ success: false, error: result.reason?.message || 'Unknown error' });
      }
    });

    // Add delay between batches to respect rate limits
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`✅ Batch sync to Loops completed: ${totalSynced}/${items.length} items synced successfully`);

  return {
    success: totalSynced > 0,
    results,
    totalSynced,
  };
}