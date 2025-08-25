"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LinkedInSchema } from "@/lib/validation";
import { z } from "zod";

const PersonLinkedInSchema = z.object({
  linkedin: LinkedInSchema,
});

type PersonLinkedInData = z.infer<typeof PersonLinkedInSchema>;

interface Step5PersonLinkedInProps {
  data: Partial<PersonLinkedInData>;
  onNext: (data: PersonLinkedInData) => void;
  onBack: () => void;
}

export function Step5PersonLinkedIn({ data, onNext, onBack }: Step5PersonLinkedInProps) {
  const form = useForm<PersonLinkedInData>({
    resolver: zodResolver(PersonLinkedInSchema),
    defaultValues: {
      linkedin: data.linkedin || "",
    },
  });

  const onSubmit = (formData: PersonLinkedInData) => {
    onNext(formData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>LinkedIn Profile</CardTitle>
        <CardDescription>
          Please provide the nominee's LinkedIn profile URL
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
                  <FormLabel>LinkedIn Profile URL *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://www.linkedin.com/in/username" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    You can enter the LinkedIn URL in any of these formats:
                  </p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>• https://www.linkedin.com/in/username</li>
                    <li>• linkedin.com/in/username</li>
                    <li>• linkedin.com/username</li>
                    <li>• username (we'll add the rest)</li>
                  </ul>
                </FormItem>
              )}
            />

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Why do we need this?</h4>
              <p className="text-sm text-muted-foreground">
                LinkedIn profiles help us verify nominees and prevent duplicate nominations. 
                The profile will be linked from the nominee's public page.
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