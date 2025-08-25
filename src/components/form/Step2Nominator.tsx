"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NominatorSchema, NominatorData } from "@/lib/validation";

interface Step2NominatorProps {
  data: Partial<NominatorData>;
  onNext: (data: NominatorData) => void;
  onBack: () => void;
}

export function Step2Nominator({ data, onNext, onBack }: Step2NominatorProps) {
  const form = useForm<NominatorData>({
    resolver: zodResolver(NominatorSchema),
    defaultValues: {
      name: data.name || "",
      email: data.email || "",
      linkedin: data.linkedin || "",
    },
  });

  const onSubmit = (formData: NominatorData) => {
    onNext(formData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Your Details</CardTitle>
        <CardDescription>
          Please provide your information as the nominator
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
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Email *</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="your.email@company.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    Please use your business email. Personal email domains are not allowed.
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn Profile URL *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://www.linkedin.com/in/yourname" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    Your LinkedIn profile helps us verify your identity and prevent duplicate nominations.
                  </p>
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