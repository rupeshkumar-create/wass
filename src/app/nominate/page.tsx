"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { useNominationStatus } from "@/hooks/useNominationStatus";
import { NominationClosedDialog } from "@/components/NominationClosedDialog";
import { Step1Welcome } from "@/components/form/Step1Welcome";
import { Step2Nominator } from "@/components/form/Step2Nominator";
import { Step3Category } from "@/components/form/Step3Category";
import { Step4PersonDetails } from "@/components/form/Step4PersonDetails";
import { Step5PersonLinkedIn } from "@/components/form/Step5PersonLinkedIn";
import { Step6PersonHeadshot } from "@/components/form/Step6PersonHeadshot";
import { Step7CompanyDetails } from "@/components/form/Step7CompanyDetails";
import { Step8CompanyLinkedIn } from "@/components/form/Step8CompanyLinkedIn";
import { Step9CompanyLogo } from "@/components/form/Step9CompanyLogo";
import { Step10ReviewSubmit } from "@/components/form/Step10ReviewSubmit";
import { Category, CATEGORIES } from "@/lib/constants";
import { NominatorData } from "@/lib/validation";

interface FormData {
  // Step 2
  nominator: Partial<NominatorData>;
  
  // Step 3
  category: Category | null;
  
  // Step 4 (Person)
  personDetails: {
    firstName?: string;
    lastName?: string;
    name?: string; // For backward compatibility
    email: string;
    title?: string;
    country?: string;
    whyVoteForMe?: string;
  };
  
  // Step 6 (Person)
  personLinkedIn: {
    linkedin: string;
  };
  
  // Step 7 (Person)
  imageUrl: string;
  
  // Step 8 (Company)
  companyDetails: {
    name: string;
    website: string;
    country?: string;
    whyVoteForMe?: string;
  };
  
  // Step 9 (Company)
  companyLinkedIn: {
    linkedin: string;
  };
  
  // Step 10 (Company)
  companyImageUrl: string;
}

export default function NominatePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [showClosedDialog, setShowClosedDialog] = useState(false);
  
  // Check nomination status
  const nominationStatus = useNominationStatus();
  
  // Show closed dialog if nominations are disabled
  useEffect(() => {
    if (!nominationStatus.loading && !nominationStatus.enabled) {
      setShowClosedDialog(true);
    }
  }, [nominationStatus.loading, nominationStatus.enabled]);
  
  const [formData, setFormData] = useState<FormData>({
    nominator: {},
    category: null,
    personDetails: { name: "", email: "" },
    personLinkedIn: { linkedin: "" },
    imageUrl: "",
    companyDetails: { name: "", website: "" },
    companyLinkedIn: { linkedin: "" },
    companyImageUrl: "",
  });

  const categoryConfig = formData.category ? CATEGORIES.find(c => c.id === formData.category) : null;
  const isPersonFlow = categoryConfig?.type === "person";
  const totalSteps = isPersonFlow ? 10 : 10; // Both flows have 10 steps
  const progress = (currentStep / totalSteps) * 100;

  // Get subcategory ID (category is already the ID from constants)
  const getSubcategoryId = (category: Category | null): string => {
    if (!category) return '';
    
    // Category is already the subcategory ID from constants
    return category;
  };

  const getCategoryGroupId = (category: Category | null): string => {
    if (!category) return 'general';
    
    // Find the category config from constants
    const categoryConfig = CATEGORIES.find(c => c.id === category);
    if (!categoryConfig) return 'general';
    
    // Map group names to group IDs
    const groupMap: Record<string, string> = {
      'Role-Specific': 'role-specific',
      'Company Awards': 'company-awards',
      'Innovation & Tech': 'innovation-tech',
      'Culture & Impact': 'culture-impact',
      'Growth & Performance': 'growth-performance',
      'Geographic': 'geographic',
      'Special Recognition': 'special-recognition'
    };
    
    return groupMap[categoryConfig.group] || 'general';
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // Debug logging
      console.log('🚀 Form submission started with data:', formData);
      
      // Client-side validation
      if (!formData.category) {
        console.log('❌ Category validation failed');
        setSubmitResult({ error: "Please select a category." });
        setIsSubmitting(false);
        return;
      }

      if (!formData.nominator.email || !formData.nominator.firstName || !formData.nominator.lastName) {
        console.log('❌ Nominator validation failed:', {
          hasEmail: !!formData.nominator.email,
          hasFirstName: !!formData.nominator.firstName,
          hasLastName: !!formData.nominator.lastName,
          nominator: formData.nominator
        });
        setSubmitResult({ error: "Please fill out all nominator information." });
        setIsSubmitting(false);
        return;
      }

      if (isPersonFlow) {
        // Check the actual properties that Step4PersonDetails sets
        const hasFirstName = formData.personDetails.firstName || formData.personDetails.name?.split(' ')[0];
        const hasLastName = formData.personDetails.lastName || formData.personDetails.name?.split(' ').slice(1).join(' ');
        const hasEmail = formData.personDetails.email;
        const hasTitle = formData.personDetails.title;
        const hasWhy = formData.personDetails.whyVoteForMe;
        const hasHeadshot = formData.imageUrl;
        
        console.log('👤 Person validation check:', {
          hasFirstName: !!hasFirstName,
          hasLastName: !!hasLastName,
          hasEmail: !!hasEmail,
          hasTitle: !!hasTitle,
          hasWhy: !!hasWhy,
          hasHeadshot: !!hasHeadshot,
          imageUrl: formData.imageUrl
        });
        
        if (!hasFirstName || !hasLastName || !hasEmail || !hasTitle || !hasWhy) {
          console.log('❌ Person details validation failed');
          setSubmitResult({ error: "Please fill out all nominee information." });
          setIsSubmitting(false);
          return;
        }

        if (!hasHeadshot) {
          console.log('❌ Headshot validation failed');
          setSubmitResult({ error: "Professional headshot is required for person nominations." });
          setIsSubmitting(false);
          return;
        }
      } else {
        const hasName = formData.companyDetails.name;
        const hasWebsite = formData.companyDetails.website;
        const hasWhy = formData.companyDetails.whyVoteForMe;
        const hasLogo = formData.companyImageUrl;

        console.log('🏢 Company validation check:', {
          hasName: !!hasName,
          hasWebsite: !!hasWebsite,
          hasWhy: !!hasWhy,
          hasLogo: !!hasLogo,
          companyImageUrl: formData.companyImageUrl
        });

        if (!hasName || !hasWebsite || !hasWhy) {
          console.log('❌ Company details validation failed');
          setSubmitResult({ error: "Please fill out all company information." });
          setIsSubmitting(false);
          return;
        }

        if (!hasLogo) {
          console.log('❌ Company logo validation failed');
          setSubmitResult({ error: "Company logo is required for company nominations." });
          setIsSubmitting(false);
          return;
        }
      }

      const subcategoryId = getSubcategoryId(formData.category);
      const categoryGroupId = getCategoryGroupId(formData.category);
      
      console.log('📋 Category mapping:', {
        originalCategory: formData.category,
        subcategoryId,
        categoryGroupId
      });

      // Validate subcategoryId before proceeding
      if (!subcategoryId || subcategoryId.length === 0) {
        console.error('❌ Invalid subcategoryId:', {
          category: formData.category,
          subcategoryId,
          categoryGroupId
        });
        setSubmitResult({ error: "Invalid category selection. Please select a category again." });
        setIsSubmitting(false);
        return;
      }

      const payload = isPersonFlow ? {
        type: 'person' as const,
        categoryGroupId,
        subcategoryId,
        nominator: {
          email: formData.nominator.email || '',
          firstname: formData.nominator.firstName || '',
          lastname: formData.nominator.lastName || '',
          linkedin: formData.nominator.linkedin || '',
          nominatedDisplayName: formData.personDetails.name || `${formData.personDetails.firstName || ''} ${formData.personDetails.lastName || ''}`.trim()
        },
        nominee: {
          firstname: formData.personDetails.firstName || formData.personDetails.name?.split(' ')[0] || '',
          lastname: formData.personDetails.lastName || formData.personDetails.name?.split(' ').slice(1).join(' ') || '',
          jobtitle: formData.personDetails.title || '',
          email: formData.personDetails.email || '',
          linkedin: formData.personLinkedIn.linkedin || '',
          headshotUrl: formData.imageUrl || '',
          whyMe: formData.personDetails.whyVoteForMe || ''
        },
      } : {
        type: 'company' as const,
        categoryGroupId,
        subcategoryId,
        nominator: {
          email: formData.nominator.email || '',
          firstname: formData.nominator.firstName || '',
          lastname: formData.nominator.lastName || '',
          linkedin: formData.nominator.linkedin || '',
          nominatedDisplayName: formData.companyDetails.name || ''
        },
        nominee: {
          name: formData.companyDetails.name || '',
          website: formData.companyDetails.website || '',
          linkedin: formData.companyLinkedIn.linkedin || '',
          logoUrl: formData.companyImageUrl || '',
          whyUs: formData.companyDetails.whyVoteForMe || ''
        },
      };

      console.log('📤 Payload to submit:', JSON.stringify(payload, null, 2));

      console.log('🌐 Making API request to /api/nomination/submit');
      
      const response = await fetch("/api/nomination/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log('📥 API response status:', response.status);
      
      const result = await response.json();
      console.log('📥 API response body:', result);
      
      if (response.ok) {
        console.log('✅ Submission successful!');
        setSubmitResult({ success: true, ...result });
      } else {
        // API returned an error
        console.error("❌ API error:", result);
        console.error("❌ Payload that failed:", payload);
        
        // Show specific validation errors if available
        let errorMessage = result.error || "Failed to submit nomination. Please try again.";
        
        if (result.details && Array.isArray(result.details)) {
          const fieldErrors = result.details.map(detail => {
            const field = detail.path ? detail.path.join('.') : 'unknown';
            return `${field}: ${detail.message}`;
          }).join(', ');
          errorMessage = `Validation errors: ${fieldErrors}`;
        }
        
        setSubmitResult({ 
          error: errorMessage,
          details: result.details 
        });
      }

    } catch (error) {
      console.error("Submission error:", error);
      setSubmitResult({ error: "Failed to submit nomination. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    // If nominations are disabled, show the first step but disable progression
    if (!nominationStatus.loading && !nominationStatus.enabled) {
      return <Step1Welcome onNext={() => setShowClosedDialog(true)} disabled={true} />;
    }
    
    switch (currentStep) {
      case 1:
        return <Step1Welcome onNext={() => setCurrentStep(2)} />;
      
      case 2:
        return (
          <Step2Nominator
            data={formData.nominator}
            onNext={(data) => {
              setFormData(prev => ({ ...prev, nominator: data }));
              setCurrentStep(3);
            }}
            onBack={() => setCurrentStep(1)}
          />
        );
      
      case 3:
        return (
          <Step3Category
            selectedCategory={formData.category}
            onNext={(category) => {
              setFormData(prev => ({ ...prev, category }));
              const config = CATEGORIES.find(c => c.id === category);
              setCurrentStep(config?.type === "person" ? 4 : 7);
            }}
            onBack={() => setCurrentStep(2)}
          />
        );
      
      // Person Flow
      case 4:
        return (
          <Step4PersonDetails
            data={formData.personDetails}
            onNext={(data) => {
              console.log('📝 Step4 data received:', data);
              // Ensure we have both individual fields and combined name
              const updatedData = {
                ...data,
                name: `${data.firstName} ${data.lastName}`.trim()
              };
              console.log('📝 Updated person details:', updatedData);
              setFormData(prev => ({ ...prev, personDetails: updatedData }));
              setCurrentStep(5);
            }}
            onBack={() => setCurrentStep(3)}
          />
        );
      
      case 5:
        return (
          <Step5PersonLinkedIn
            data={formData.personLinkedIn}
            onNext={(data) => {
              setFormData(prev => ({ ...prev, personLinkedIn: data }));
              setCurrentStep(6);
            }}
            onBack={() => setCurrentStep(4)}
          />
        );
      
      case 6:
        return (
          <Step6PersonHeadshot
            imageUrl={formData.imageUrl}
            personName={formData.personDetails.name || `${formData.personDetails.firstName || ''} ${formData.personDetails.lastName || ''}`.trim()}
            onNext={(imageUrl) => {
              console.log('📸 Headshot uploaded:', imageUrl);
              setFormData(prev => ({ ...prev, imageUrl }));
              setCurrentStep(10);
            }}
            onBack={() => setCurrentStep(5)}
          />
        );
      
      // Company Flow
      case 7:
        return (
          <Step7CompanyDetails
            data={formData.companyDetails}
            onNext={(data) => {
              setFormData(prev => ({ ...prev, companyDetails: data }));
              setCurrentStep(8);
            }}
            onBack={() => setCurrentStep(3)}
          />
        );
      
      case 8:
        return (
          <Step8CompanyLinkedIn
            data={formData.companyLinkedIn}
            onNext={(data) => {
              setFormData(prev => ({ ...prev, companyLinkedIn: data }));
              setCurrentStep(9);
            }}
            onBack={() => setCurrentStep(7)}
          />
        );
      
      case 9:
        return (
          <Step9CompanyLogo
            imageUrl={formData.companyImageUrl}
            companyName={formData.companyDetails.name}
            onNext={(imageUrl) => {
              console.log('🏢 Company logo uploaded:', imageUrl);
              setFormData(prev => ({ ...prev, companyImageUrl: imageUrl }));
              setCurrentStep(10);
            }}
            onBack={() => setCurrentStep(8)}
          />
        );
      
      // Review & Submit
      case 10:
        const nominee = isPersonFlow ? {
          name: formData.personDetails.name,
          email: formData.personDetails.email,
          title: formData.personDetails.title,
          country: formData.personDetails.country,
          linkedin: formData.personLinkedIn.linkedin,
          imageUrl: formData.imageUrl,
        } : {
          name: formData.companyDetails.name,
          email: '', // Companies don't have email, but interface requires it
          website: formData.companyDetails.website,
          country: formData.companyDetails.country,
          linkedin: formData.companyLinkedIn.linkedin,
          imageUrl: formData.companyImageUrl,
        };

        return (
          <Step10ReviewSubmit
            category={formData.category!}
            nominator={formData.nominator as NominatorData}
            nominee={nominee}
            onSubmit={async () => {
              console.log('🎯 Submit button clicked, calling handleSubmit');
              await handleSubmit();
            }}
            onBack={() => setCurrentStep(isPersonFlow ? 6 : 9)}
            isSubmitting={isSubmitting}
            submitResult={submitResult}
          />
        );
      
      default:
        return <Step1Welcome onNext={() => setCurrentStep(2)} />;
    }
  };

  // If nominations are disabled and we're past step 1, redirect to step 1
  if (!nominationStatus.loading && !nominationStatus.enabled && currentStep > 1) {
    setCurrentStep(1);
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Progress Bar - only show if nominations are enabled */}
        {nominationStatus.enabled && currentStep > 1 && !submitResult?.success && !submitResult?.duplicate && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Form Steps */}
        {renderStep()}
      </div>

      {/* Nomination Closed Dialog */}
      <NominationClosedDialog
        isOpen={showClosedDialog}
        onClose={() => setShowClosedDialog(false)}
        message={nominationStatus.closeMessage}
      />
    </div>
  );
}