"use client";

import { useState } from "react";
import { Progress } from "@/components/ui/progress";
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
    name: string;
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const payload = isPersonFlow ? {
        category: formData.category,
        nominator: formData.nominator,
        nominee: {
          ...formData.personDetails,
          linkedin: formData.personLinkedIn.linkedin,
          imageUrl: formData.imageUrl,
        },
      } : {
        category: formData.category,
        nominator: formData.nominator,
        nominee: {
          ...formData.companyDetails,
          linkedin: formData.companyLinkedIn.linkedin,
          imageUrl: formData.companyImageUrl,
        },
      };

      const response = await fetch("/api/nominations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      setSubmitResult(result);

    } catch (error) {
      console.error("Submission error:", error);
      setSubmitResult({ error: "Failed to submit nomination. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
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
              setFormData(prev => ({ ...prev, personDetails: data }));
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
            personName={formData.personDetails.name}
            onNext={(imageUrl) => {
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
            onSubmit={handleSubmit}
            onBack={() => setCurrentStep(isPersonFlow ? 6 : 9)}
            isSubmitting={isSubmitting}
            submitResult={submitResult}
          />
        );
      
      default:
        return <Step1Welcome onNext={() => setCurrentStep(2)} />;
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Progress Bar */}
        {currentStep > 1 && !submitResult?.success && !submitResult?.duplicate && (
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
    </div>
  );
}