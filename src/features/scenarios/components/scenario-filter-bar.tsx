"use client";

import { useState } from "react";
import { Search, Filter, X, Grid, List } from "lucide-react";
import { Input, Button, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui";

interface FilterOptions {
  search: string;
  status: string;
  category: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface ScenarioFilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  onGroupByChange?: (groupBy: "none" | "domain" | "status") => void;
  onViewModeChange?: (viewMode: "card" | "table") => void;
  viewMode?: "card" | "table";
  totalCount: number;
  filteredCount: number;
}

const STATUS_OPTIONS = [
  { value: "all", label: "모든 상태" },
  { value: "SUCCESS", label: "성공" },
  { value: "FAILED", label: "실패" },
  { value: "RUNNING", label: "실행중" },
  { value: "PENDING", label: "대기중" }
];

const SORT_OPTIONS = [
  { value: "name", label: "이름" },
  { value: "updatedAt", label: "수정일" },
  { value: "createdAt", label: "생성일" },
  { value: "status", label: "상태" }
];

const GROUP_OPTIONS = [
  { value: "none", label: "그룹 없음" },
  { value: "domain", label: "도메인별" },
  { value: "status", label: "상태별" }
];

export function ScenarioFilterBar({
  onFilterChange,
  onGroupByChange,
  onViewModeChange,
  viewMode = "card",
  totalCount,
  filteredCount
}: ScenarioFilterBarProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    status: "all",
    category: "all",
    sortBy: "updatedAt",
    sortOrder: "desc"
  });

  const [groupBy, setGroupBy] = useState<"none" | "domain" | "status">("domain");

  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: keyof FilterOptions, value: string | 'asc' | 'desc') => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
      search: "",
      status: "all",
      category: "all",
      sortBy: "updatedAt",
      sortOrder: "desc"
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = filters.search || filters.status !== "all" || filters.category !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="시나리오 이름이나 설명으로 검색..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-start">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden xs:inline">필터</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                !
              </Badge>
            )}
          </Button>

          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange?.("card")}
              className="rounded-r-none border-0"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange?.("table")}
              className="rounded-l-none border-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="hidden xs:inline">초기화</span>
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium whitespace-nowrap">상태:</span>
            <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium whitespace-nowrap">그룹:</span>
            <Select
              value={groupBy}
              onValueChange={(value: "none" | "domain" | "status") => {
                setGroupBy(value);
                onGroupByChange?.(value);
              }}
            >
              <SelectTrigger className="w-full sm:w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUP_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium whitespace-nowrap">정렬:</span>
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
                <SelectTrigger className="w-full sm:w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilter("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")}
                className="px-3 flex-shrink-0"
              >
                {filters.sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredCount === totalCount
            ? `총 ${totalCount}개 시나리오`
            : `${filteredCount}개 표시 (전체 ${totalCount}개)`
          }
        </span>

        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            {filters.search && (
              <Badge variant="secondary" className="text-xs">
                검색: {filters.search}
              </Badge>
            )}
            {filters.status !== "all" && (
              <Badge variant="secondary" className="text-xs">
                상태: {STATUS_OPTIONS.find(opt => opt.value === filters.status)?.label}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}