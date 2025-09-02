# Bulk Upload CSV Template - World Staffing Awards 2026

## Required CSV Format

The CSV file must contain the following columns in this exact order:

### Column Headers (Row 1)
```csv
type,category,first_name,last_name,job_title,company_name,email,phone,country,linkedin,website,bio,achievements,why_vote_for_me,company_size,industry,logo_url,headshot_url,nominator_name,nominator_email,nominator_company,nominator_job_title,nominator_phone,nominator_country
```

### Column Descriptions

| Column | Required | Type | Description | Example |
|--------|----------|------|-------------|---------|
| **type** | ✅ | person/company | Type of nomination | `person` or `company` |
| **category** | ✅ | string | Award category | `best-recruitment-consultant` |
| **first_name** | ✅* | string | First name (person only) | `John` |
| **last_name** | ✅* | string | Last name (person only) | `Smith` |
| **job_title** | ✅* | string | Job title (person only) | `Senior Recruitment Consultant` |
| **company_name** | ✅ | string | Company name | `ABC Recruitment Ltd` |
| **email** | ✅ | email | Contact email | `john.smith@abc.com` |
| **phone** | ❌ | string | Phone number | `+44 20 1234 5678` |
| **country** | ✅ | string | Country | `United Kingdom` |
| **linkedin** | ❌ | url | LinkedIn profile | `https://linkedin.com/in/johnsmith` |
| **website** | ❌ | url | Website (company) | `https://www.abc.com` |
| **bio** | ❌ | text | Biography/Description | `Experienced recruiter with 10+ years...` |
| **achievements** | ❌ | text | Key achievements | `Placed 500+ candidates, Award winner...` |
| **why_vote_for_me** | ✅ | text | Why they should win | `Outstanding performance in 2024...` |
| **company_size** | ❌ | string | Company size (company only) | `50-100 employees` |
| **industry** | ❌ | string | Industry (company only) | `Technology Recruitment` |
| **logo_url** | ❌ | url | Company logo URL | `https://example.com/logo.png` |
| **headshot_url** | ❌ | url | Person headshot URL | `https://example.com/photo.jpg` |
| **nominator_name** | ✅ | string | Person nominating | `Jane Doe` |
| **nominator_email** | ✅ | email | Nominator's email | `jane.doe@company.com` |
| **nominator_company** | ❌ | string | Nominator's company | `XYZ Corp` |
| **nominator_job_title** | ❌ | string | Nominator's job title | `HR Director` |
| **nominator_phone** | ❌ | string | Nominator's phone | `+44 20 9876 5432` |
| **nominator_country** | ❌ | string | Nominator's country | `United Kingdom` |

*Required for person nominations only

## Valid Categories

Use these exact category values:

### Person Categories
- `best-recruitment-consultant`
- `best-hr-professional`
- `best-talent-acquisition-specialist`
- `rising-star-recruitment`
- `best-executive-search-consultant`
- `best-recruitment-leader`
- `diversity-inclusion-champion`
- `recruitment-innovation-award`
- `lifetime-achievement-recruitment`

### Company Categories
- `best-recruitment-agency`
- `best-hr-consultancy`
- `best-talent-acquisition-team`
- `best-recruitment-technology`
- `best-staffing-firm`
- `recruitment-agency-of-the-year`
- `best-niche-recruitment-agency`
- `best-international-recruitment`
- `recruitment-innovation-company`
- `best-recruitment-startup`

## Sample CSV Data

```csv
type,category,first_name,last_name,job_title,company_name,email,phone,country,linkedin,website,bio,achievements,why_vote_for_me,company_size,industry,logo_url,headshot_url,nominator_name,nominator_email,nominator_company,nominator_job_title,nominator_phone,nominator_country
person,best-recruitment-consultant,John,Smith,Senior Recruitment Consultant,ABC Recruitment Ltd,john.smith@abc.com,+44 20 1234 5678,United Kingdom,https://linkedin.com/in/johnsmith,,Experienced recruiter with 10+ years in tech recruitment,Placed 500+ candidates in 2024,Outstanding performance and client satisfaction,,,,,Jane Doe,jane.doe@company.com,XYZ Corp,HR Director,+44 20 9876 5432,United Kingdom
company,best-recruitment-agency,,,,,TechTalent Solutions,info@techtalent.com,+1 555 123 4567,United States,,https://www.techtalent.com,Leading technology recruitment agency,Award-winning agency with 95% success rate,Consistently delivers top talent to Fortune 500 companies,100-200 employees,Technology Recruitment,https://techtalent.com/logo.png,,Sarah Johnson,sarah.j@client.com,Client Corp,Talent Director,,United States
```

## Validation Rules

1. **Required Fields**: All marked required fields must have values
2. **Email Format**: Must be valid email addresses
3. **URL Format**: Must be valid URLs (http/https)
4. **Type Values**: Must be exactly 'person' or 'company'
5. **Category Values**: Must match one of the valid categories exactly
6. **Person vs Company**: 
   - Person nominations require: first_name, last_name, job_title
   - Company nominations require: company_name
7. **Character Limits**:
   - Names: 100 characters max
   - Email: 255 characters max
   - Bio/Achievements: 2000 characters max
   - Why vote: 1000 characters max

## Upload Process

1. **Prepare CSV**: Create CSV file following the template
2. **Upload**: Use the admin panel bulk upload feature
3. **Validation**: System validates all data and reports errors
4. **Draft Status**: Valid nominations are created with 'pending' status
5. **Manual Review**: Admin reviews and approves/rejects each nomination
6. **Loops Sync**: Approved nominations sync to Loops automatically

## Error Handling

- Invalid rows are logged with specific error messages
- Valid rows are processed even if some rows fail
- Detailed error report provided after upload
- Failed rows can be corrected and re-uploaded

## Tips for Success

1. **Test Small**: Start with a small batch (5-10 rows) to test
2. **Check Categories**: Ensure category names match exactly
3. **Validate Emails**: Check all email addresses are valid
4. **Review Data**: Double-check required fields are filled
5. **UTF-8 Encoding**: Save CSV with UTF-8 encoding for special characters