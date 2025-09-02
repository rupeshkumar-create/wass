# Bulk Upload CSV Template Guide

## Overview
This guide explains how to prepare a CSV file for bulk uploading nominees to the World Staffing Awards platform.

## CSV Template Structure

### Required Headers (Exact spelling and case-sensitive)

#### For Person Nominees:
```csv
type,firstname,lastname,person_email,person_phone,person_linkedin,jobtitle,person_company,person_country,why_me,subcategory_id,category_group_id,bio,achievements
```

#### For Company Nominees:
```csv
type,company_name,company_email,company_phone,company_website,company_linkedin,company_country,company_size,company_industry,why_us,subcategory_id,category_group_id,company_domain
```

### Complete Template (All Fields):
```csv
type,firstname,lastname,person_email,person_phone,person_linkedin,jobtitle,person_company,person_country,why_me,company_name,company_email,company_phone,company_website,company_linkedin,company_country,company_size,company_industry,company_domain,why_us,subcategory_id,category_group_id,bio,achievements,social_media,live_url
```

## Field Descriptions

### Common Fields
- **type** (Required): Either "person" or "company"
- **subcategory_id** (Required): Numeric ID of the award subcategory
- **category_group_id** (Required): Numeric ID of the category group
- **live_url** (Optional): Public profile or website URL
- **social_media** (Optional): JSON string of social media links

### Person-Specific Fields
- **firstname** (Required for person): First name
- **lastname** (Required for person): Last name  
- **person_email** (Required for person): Email address
- **person_phone** (Optional): Phone number
- **person_linkedin** (Optional): LinkedIn profile URL
- **jobtitle** (Optional): Job title/position
- **person_company** (Optional): Company name where person works
- **person_country** (Optional): Country of residence
- **why_me** (Required for person): Why this person should win (max 500 chars)
- **bio** (Optional): Biography/background information
- **achievements** (Optional): Key achievements and accomplishments

### Company-Specific Fields
- **company_name** (Required for company): Company name
- **company_email** (Required for company): Company email address
- **company_phone** (Optional): Company phone number
- **company_website** (Optional): Company website URL
- **company_linkedin** (Optional): Company LinkedIn page URL
- **company_country** (Optional): Country where company is based
- **company_size** (Optional): Number of employees (e.g., "1-10", "11-50", "51-200", "201-500", "500+")
- **company_industry** (Optional): Industry sector
- **company_domain** (Optional): Company domain name
- **why_us** (Required for company): Why this company should win (max 500 chars)

## Category and Subcategory IDs

### Available Categories:
1. **Staffing Firm of the Year** (category_group_id: 1)
   - Best Staffing Firm - Small (1-25 employees) - subcategory_id: 1
   - Best Staffing Firm - Medium (26-100 employees) - subcategory_id: 2
   - Best Staffing Firm - Large (100+ employees) - subcategory_id: 3

2. **Individual Excellence** (category_group_id: 2)
   - Recruiter of the Year - subcategory_id: 4
   - Sales Professional of the Year - subcategory_id: 5
   - Leadership Excellence - subcategory_id: 6

3. **Innovation & Technology** (category_group_id: 3)
   - Most Innovative Staffing Solution - subcategory_id: 7
   - Best Use of Technology - subcategory_id: 8

4. **Specialty Awards** (category_group_id: 4)
   - Best Diversity & Inclusion Initiative - subcategory_id: 9
   - Best Client Service - subcategory_id: 10
   - Best Candidate Experience - subcategory_id: 11

## Sample CSV Data

### Person Nominee Example:
```csv
type,firstname,lastname,person_email,person_phone,person_linkedin,jobtitle,person_company,person_country,why_me,subcategory_id,category_group_id,bio,achievements
person,John,Smith,john.smith@example.com,+1-555-0123,https://linkedin.com/in/johnsmith,Senior Recruiter,TechStaff Solutions,United States,"John has consistently exceeded placement targets and built lasting client relationships over 8 years in the industry.",4,2,"Experienced recruiter specializing in technology placements","Top performer 2022-2024, 95% client satisfaction rate"
```

### Company Nominee Example:
```csv
type,company_name,company_email,company_phone,company_website,company_linkedin,company_country,company_size,company_industry,company_domain,why_us,subcategory_id,category_group_id
company,InnovateTech Staffing,info@innovatetech.com,+1-555-0456,https://innovatetech.com,https://linkedin.com/company/innovatetech,United States,51-200,Technology Staffing,innovatetech.com,"We've revolutionized tech staffing with AI-powered matching and achieved 40% faster placements than industry average.",7,3
```

## Validation Rules

### Required Field Validation:
- **type**: Must be exactly "person" or "company"
- **Person nominees**: Must have firstname, lastname, person_email, why_me
- **Company nominees**: Must have company_name, company_email, why_us
- **All nominees**: Must have valid subcategory_id and category_group_id

### Format Validation:
- **Email addresses**: Must be valid email format
- **Phone numbers**: Should include country code (e.g., +1-555-0123)
- **LinkedIn URLs**: Should start with https://linkedin.com/
- **Website URLs**: Should start with http:// or https://
- **why_me/why_us**: Maximum 500 characters

### Data Quality Guidelines:
- Remove any commas from text fields or wrap in quotes
- Use UTF-8 encoding for international characters
- Keep descriptions concise but compelling
- Ensure all URLs are accessible and current
- Double-check category/subcategory IDs match your intended awards

## File Requirements

- **Format**: CSV (Comma Separated Values)
- **Encoding**: UTF-8
- **Maximum file size**: 10MB
- **Maximum rows**: 1000 nominees per upload
- **File naming**: Use descriptive names (e.g., "WSA2024_TechStaffing_Nominees.csv")

## Upload Process

1. **Prepare CSV**: Follow the template and validation rules above
2. **Upload File**: Use the admin panel bulk upload feature
3. **Review Results**: Check the upload summary for any errors
4. **Fix Errors**: Download error report and correct any issues
5. **Draft Review**: All uploaded nominees will be in draft status
6. **Manual Approval**: Admin must individually review and approve each nominee
7. **Loops Sync**: Approved nominees will automatically sync to Loops.so

## Error Handling

Common errors and solutions:

- **Missing Required Fields**: Ensure all required fields have values
- **Invalid Email Format**: Check email addresses are properly formatted
- **Invalid Category IDs**: Verify category and subcategory IDs exist
- **Duplicate Entries**: System will flag potential duplicates based on email
- **Character Limits**: Ensure text fields don't exceed maximum lengths
- **Invalid URLs**: Check all URLs are properly formatted and accessible

## Best Practices

1. **Test with Small Batch**: Start with 5-10 nominees to test the process
2. **Backup Original**: Keep a copy of your original CSV file
3. **Validate Data**: Review all data before upload
4. **Coordinate with Team**: Ensure multiple admins aren't uploading simultaneously
5. **Monitor Progress**: Check upload status and approve nominees promptly
6. **Document Process**: Keep notes on any issues for future uploads

## Support

If you encounter issues with bulk upload:
1. Check the error report for specific validation failures
2. Verify your CSV follows the exact template format
3. Ensure all required fields are populated
4. Contact technical support with your batch ID for assistance