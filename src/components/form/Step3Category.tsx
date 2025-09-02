"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CATEGORIES, Category } from "@/lib/constants";

interface Step3CategoryProps {
  selectedCategory: Category | null;
  onNext: (category: Category) => void;
  onBack: () => void;
}

export function Step3Category({ selectedCategory, onNext, onBack }: Step3CategoryProps) {
  const [selected, setSelected] = useState<Category | null>(selectedCategory);

  const handleNext = () => {
    if (selected) {
      onNext(selected);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Select Award Category</CardTitle>
        <CardDescription>
          Choose the category that best fits your nomination
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="category">Award Category *</Label>
          <Select value={selected || ""} onValueChange={(value) => setSelected(value as Category)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category..." />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Categories Include:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Individual recognition (recruiters, executives, influencers)</li>
            <li>• Company achievements (innovation, growth, culture)</li>
            <li>• Geographic excellence (USA, Europe, Global)</li>
            <li>• Special recognition awards</li>
          </ul>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={!selected}
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}