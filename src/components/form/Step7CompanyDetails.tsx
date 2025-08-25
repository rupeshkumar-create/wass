"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CountrySelect } from "@/components/ui/country-select";
import { z } from "zod";

const CompanyDetailsSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z.string().url("Please enter a valid website URL"),
  country: z.string().min(1, "Country is required"),
  whyVoteForMe: z.string().min(1, "Please explain why someone should vote for this company").max(1000, "Please keep your response under 1000 characters"),
});

type CompanyDetailsData = z.infer<typeof CompanyDetailsSchema>;

interface Step7CompanyDetailsProps {
  data: Partial<CompanyDetailsData>;
  onNext: (data: CompanyDetailsData) => void;
  onBack: () => void;
}

export function Step7CompanyDetails({ data, onNext, onBack }: Step7CompanyDetailsProps) {
  const form = useForm<CompanyDetailsData>({
    resolver: zodResolver(CompanyDetailsSchema),
    defaultValues: {
      name: data.name || "",
      website: data.website || "",
      country: data.country || "",
      whyVoteForMe: data.whyVoteForMe || "",
    },
  });

  const onSubmit = (formData: CompanyDetailsData) => {
    onNext(formData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Company Details</CardTitle>
        <CardDescription>
          Please provide information about the company you're nominating
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://www.company.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country *</FormLabel>
                  <FormControl>
                    <CountrySelect
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select country..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whyVoteForMe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why should someone vote for this company? *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe their innovations, company culture, industry impact, or what sets them apart in the staffing industry..."
                      className="min-h-[120px] resize-none"
                      maxLength={1000}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      This will be displayed on their profile page
                    </span>
                    <span className={`${(1000 - field.value.length) < 50 ? 'text-orange-600' : (1000 - field.value.length) < 10 ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {1000 - field.value.length} characters remaining
                    </span>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button type="submit">
                Continue
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}