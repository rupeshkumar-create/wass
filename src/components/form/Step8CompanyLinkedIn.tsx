"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LinkedInSchema } from "@/lib/validation";
import { z } from "zod";

const CompanyLinkedInSchema = z.object({
  linkedin: LinkedInSchema,
});

type CompanyLinkedInData = z.infer<typeof CompanyLinkedInSchema>;

interface Step8CompanyLinkedInProps {
  data: Partial<CompanyLinkedInData>;
  onNext: (data: CompanyLinkedInData) => void;
  onBack: () => void;
}

export function Step8CompanyLinkedIn({ data, onNext, onBack }: Step8CompanyLinkedInProps) {
  const form = useForm<CompanyLinkedInData>({
    resolver: zodResolver(CompanyLinkedInSchema),
    defaultValues: {
      linkedin: data.linkedin || "",
    },
  });

  const onSubmit = (formData: CompanyLinkedInData) => {
    onNext(formData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Company LinkedIn Page</CardTitle>
        <CardDescription>
          Please provide the company's LinkedIn page URL
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn Company Page URL *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://www.linkedin.com/company/company-name" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    You can enter the LinkedIn URL in any of these formats:
                  </p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>• https://www.linkedin.com/company/company-name</li>
                    <li>• linkedin.com/company/company-name</li>
                    <li>• company-name (we'll add the rest)</li>
                  </ul>
                </FormItem>
              )}
            />

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Why do we need this?</h4>
              <p className="text-sm text-muted-foreground">
                LinkedIn company pages help us verify nominees and prevent duplicate nominations. 
                The page will be linked from the company's public profile.
              </p>
            </div>

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