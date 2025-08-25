"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Download } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

interface FiltersBarProps {
  searchQuery: string;
  selectedCategory: string;
  selectedType: string;
  selectedStatus: string;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onTypeChange: (type: string) => void;
  onStatusChange: (status: string) => void;
  onClearFilters: () => void;
  onExport: () => void;
}

export function FiltersBar({
  searchQuery,
  selectedCategory,
  selectedType,
  selectedStatus,
  onSearchChange,
  onCategoryChange,
  onTypeChange,
  onStatusChange,
  onClearFilters,
  onExport,
}: FiltersBarProps) {
  const hasActiveFilters = searchQuery || selectedCategory || selectedType || selectedStatus;
  const categoryGroups = [...new Set(CATEGORIES.map(c => c.group))];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search nominations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedCategory || "all"} onValueChange={(value) => onCategoryChange(value === "all" ? "" : value)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryGroups.map((group) => (
              <SelectItem key={group} value={group}>
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType || "all"} onValueChange={(value) => onTypeChange(value === "all" ? "" : value)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="person">Person</SelectItem>
            <SelectItem value="company">Company</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus || "all"} onValueChange={(value) => onStatusChange(value === "all" ? "" : value)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          {hasActiveFilters && (
            <Button variant="outline" onClick={onClearFilters} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}

          <Button variant="outline" onClick={onExport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{searchQuery}"
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onSearchChange("")}
              />
            </Badge>
          )}
          {selectedCategory && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {selectedCategory}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onCategoryChange("")}
              />
            </Badge>
          )}
          {selectedType && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Type: {selectedType}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onTypeChange("")}
              />
            </Badge>
          )}
          {selectedStatus && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {selectedStatus}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onStatusChange("")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}