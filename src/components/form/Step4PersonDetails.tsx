"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CountrySelect } from "@/components/ui/country-select";
import { BusinessEmailSchema } from "@/lib/validation";
import { z } from "zod";

const PersonDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: BusinessEmailSchema,
  title: z.string().min(1, "Job title is required"),
  country: z.string().min(1, "Country is required"),
  whyVoteForMe: z.string().min(1, "Please explain why someone should vote for this nominee").max(1000, "Please keep your response under 1000 characters"),
});

type PersonDetailsData = z.infer<typeof PersonDetailsSchema>;

interface Step4PersonDetailsProps {
  data: Partial<PersonDetailsData>;
  onNext: (data: PersonDetailsData) => void;
  onBack: () => void;
}

export function Step4PersonDetails({ data, onNext, onBack }: Step4PersonDetailsProps) {
  const form = useForm<PersonDetailsData>({
    resolver: zodResolver(PersonDetailsSchema),
    defaultValues: {
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: data.email || "",
      title: data.title || "",
      country: data.country || "",
      whyVoteForMe: data.whyVoteForMe || "",
    },
  });

  const onSubmit = (formData: PersonDetailsData) => {
    onNext(formData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Nominee Details</CardTitle>
        <CardDescription>
          Please provide information about the person you're nominating
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Email Address *</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="nominee@company.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    Please use the nominee's business email. Personal email domains are not allowed.
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Senior Recruiter, CEO, Director of Talent" 
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
                  <FormLabel>Why should someone vote for this nominee? *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe their achievements, impact, leadership qualities, or what sets them apart in the staffing industry..."
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