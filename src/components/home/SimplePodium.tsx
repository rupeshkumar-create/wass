"use client";

import { useState, useEffect } from "react";
import { Trophy, Crown, Medal, Award, User, Building2, Star, Sparkles } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

type PodiumItem = {
  rank: 1 | 2 | 3;
  nomineeId: string;
  name: string;
  category: string;
  type: "person" | "company";
  image_url: string | null;
  votes: number;
  live_slug: string;
};

// Category groups for the tabs
const categoryGroups = [
  {
    id: 'role-specific',
    label: 'Role-Specific Excellence',
    categories: ['top-recruiter', 'top-executive-leader', 'rising-star-under-30', 'top-staffing-influencer', 'best-sourcer']
  },
  {
    id: 'innovation',
    label: 'Innovation & Technology',
    categories: ['innovation-technology-leader', 'diversity-inclusion-champion']
  },
  {
    id: 'culture',
    label: 'Culture & Impact',
    categories: ['culture-impact-leader', 'community-impact-leader']
  },
  {
    id: 'growth',
    label: 'Growth & Performance',
    categories: ['growth-performance-leader', 'client-success-champion']
  },
  {
    id: 'geographic',
    label: 'Geographic Excellence',
    categories: ['regional-excellence-north-america', 'regional-excellence-europe', 'regional-excellence-asia-pacific', 'regional-excellence-latin-america', 'regional-excellence-middle-east-africa']
  },
  {
    id: 'special',
    label: 'Special Recognition',
    categories: ['lifetime-achievement', 'industry-game-changer', 'thought-leadership']
  }
];

export function SimplePodium() {
  const [podiumData, setPodiumData] = useState<PodiumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState('role-specific');
  const [selectedCategory, setSelectedCategory] = useState('top-recruiter');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const fetchPodiumData = async () => {
      try {
        setLoading(true);
        setIsAnimating(true);
        
        const response = await fetch(`/api/podium?category=${selectedCategory}`);
        const data = await response.json();
        
        if (response.ok) {
          // Add a small delay for smooth animation
          setTimeout(() => {
            setPodiumData(data.items || []);
            setError(null);
            setIsAnimating(false);
          }, 300);
        } else {
          setError(data.error || 'Failed to load podium data');
          setIsAnimating(false);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Network error');
        setIsAnimating(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPodiumData();
  }, [selectedCategory]);

  const handleGroupChange = (groupId: string) => {
    setSelectedGroup(groupId);
    const group = categoryGroups.find(g => g.id === groupId);
    if (group && group.categories.length > 0) {
      setSelectedCategory(group.categories[0]);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const currentGroup = categoryGroups.find(g => g.id === selectedGroup);
  const availableCategories = currentGroup?.categories || [];

  const getRankCard = (rank: number, nominee?: PodiumItem) => {
    const isGold = rank === 1;
    const isSilver = rank === 2;
    const isBronze = rank === 3;

    const cardSizes = {
      1: 'w-80 h-96', // Gold - Largest
      2: 'w-72 h-80', // Silver - Medium
      3: 'w-64 h-72'  // Bronze - Smallest
    };

    const cardColors = {
      1: 'from-yellow-400 via-yellow-500 to-amber-600', // Gold gradient
      2: 'from-gray-300 via-gray-400 to-gray-500',      // Silver gradient
      3: 'from-amber-600 via-orange-500 to-amber-700'   // Bronze gradient
    };

    const textColors = {
      1: 'text-yellow-600',
      2: 'text-gray-600', 
      3: 'text-amber-700'
    };

    const bgColors = {
      1: 'bg-gradient-to-br from-yellow-50 to-amber-50',
      2: 'bg-gradient-to-br from-gray-50 to-slate-50',
      3: 'bg-gradient-to-br from-amber-50 to-orange-50'
    };

    const borderColors = {
      1: 'border-yellow-300 shadow-yellow-200/50',
      2: 'border-gray-300 shadow-gray-200/50',
      3: 'border-amber-300 shadow-orange-200/50'
    };

    const getRankIcon = () => {
      if (isGold) return <Crown className="h-8 w-8 text-yellow-500" />;
      if (isSilver) return <Trophy className="h-7 w-7 text-gray-500" />;
      if (isBronze) return <Medal className="h-6 w-6 text-amber-600" />;
      return <Award className="h-6 w-6" />;
    };

    return (
      <div 
        key={`${rank}-${nominee?.nomineeId || 'empty'}`}
        className={`
          ${cardSizes[rank as keyof typeof cardSizes]} 
          mx-auto relative
          transform transition-all duration-700 ease-in-out
          ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}
          hover:scale-105 hover:-translate-y-2
        `}
      >
        {/* Rank Badge */}
        <div className={`
          absolute -top-4 left-1/2 transform -translate-x-1/2 z-20
          w-12 h-12 rounded-full bg-gradient-to-br ${cardColors[rank as keyof typeof cardColors]}
          flex items-center justify-center text-white font-bold text-lg
          shadow-lg border-4 border-white
        `}>
          #{rank}
        </div>

        {/* Card */}
        <div className={`
          w-full h-full rounded-2xl border-2 ${borderColors[rank as keyof typeof borderColors]}
          ${bgColors[rank as keyof typeof bgColors]}
          shadow-xl relative overflow-hidden
          transition-all duration-500
        `}>
          {/* Sparkle Effects for Gold */}
          {isGold && (
            <>
              <Sparkles className="absolute top-4 right-4 h-6 w-6 text-yellow-400 animate-pulse" />
              <Star className="absolute top-8 left-4 h-4 w-4 text-yellow-300 animate-ping" />
              <Sparkles className="absolute bottom-8 right-6 h-5 w-5 text-amber-400 animate-pulse delay-300" />
            </>
          )}

          <div className="p-6 h-full flex flex-col items-center justify-center text-center">
            {nominee ? (
              <>
                {/* Rank Icon */}
                <div className="mb-4">
                  {getRankIcon()}
                </div>

                {/* Photo */}
                <div className={`mb-4 ${isGold ? 'w-24 h-24' : isSilver ? 'w-20 h-20' : 'w-16 h-16'}`}>
                  {nominee.image_url ? (
                    <img 
                      src={nominee.image_url} 
                      alt={nominee.name}
                      className={`
                        w-full h-full rounded-full object-cover 
                        border-4 ${isGold ? 'border-yellow-300' : isSilver ? 'border-gray-300' : 'border-amber-300'}
                        shadow-lg transition-transform duration-300 hover:scale-110
                      `}
                    />
                  ) : (
                    <div className={`
                      w-full h-full rounded-full 
                      bg-gradient-to-br from-blue-100 to-purple-100 
                      border-4 ${isGold ? 'border-yellow-300' : isSilver ? 'border-gray-300' : 'border-amber-300'}
                      shadow-lg flex items-center justify-center
                    `}>
                      {nominee.type === 'person' ? (
                        <User className={`${isGold ? 'h-12 w-12' : isSilver ? 'h-10 w-10' : 'h-8 w-8'} text-blue-600`} />
                      ) : (
                        <Building2 className={`${isGold ? 'h-12 w-12' : isSilver ? 'h-10 w-10' : 'h-8 w-8'} text-purple-600`} />
                      )}
                    </div>
                  )}
                </div>

                {/* Name */}
                <h3 className={`
                  font-bold mb-2 text-gray-900 leading-tight
                  ${isGold ? 'text-xl' : isSilver ? 'text-lg' : 'text-base'}
                `}>
                  {nominee.name}
                </h3>

                {/* Category */}
                <p className={`
                  text-gray-600 mb-3 leading-tight
                  ${isGold ? 'text-sm' : 'text-xs'}
                `}>
                  {CATEGORIES.find(c => c.id === nominee.category)?.name || nominee.category}
                </p>

                {/* Votes */}
                <div className={`
                  bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-2
                  border ${isGold ? 'border-yellow-200' : isSilver ? 'border-gray-200' : 'border-amber-200'}
                  shadow-sm
                `}>
                  <p className={`
                    font-bold ${textColors[rank as keyof typeof textColors]}
                    ${isGold ? 'text-2xl' : isSilver ? 'text-xl' : 'text-lg'}
                  `}>
                    {nominee.votes}
                  </p>
                  <p className={`
                    text-gray-600
                    ${isGold ? 'text-sm' : 'text-xs'}
                  `}>
                    votes
                  </p>
                </div>

                {/* Type Badge */}
                <div className={`
                  inline-flex items-center gap-1 
                  bg-white/60 backdrop-blur-sm rounded-full px-3 py-1
                  border ${isGold ? 'border-yellow-200' : isSilver ? 'border-gray-200' : 'border-amber-200'}
                `}>
                  {nominee.type === 'person' ? (
                    <User className="h-3 w-3" />
                  ) : (
                    <Building2 className="h-3 w-3" />
                  )}
                  <span className={`font-medium capitalize ${isGold ? 'text-xs' : 'text-xs'}`}>
                    {nominee.type}
                  </span>
                </div>
              </>
            ) : (
              <>
                {/* Empty State */}
                <div className="mb-4">
                  {getRankIcon()}
                </div>
                <div className={`
                  mb-4 ${isGold ? 'w-24 h-24' : isSilver ? 'w-20 h-20' : 'w-16 h-16'}
                  rounded-full bg-gray-100 border-4 border-gray-200
                  flex items-center justify-center
                `}>
                  <Trophy className={`
                    ${isGold ? 'h-12 w-12' : isSilver ? 'h-10 w-10' : 'h-8 w-8'} 
                    text-gray-400
                  `} />
                </div>
                <div className="text-gray-500">
                  <p className={`font-medium ${isGold ? 'text-lg' : 'text-base'}`}>
                    Awaiting Nominations
                  </p>
                  <p className="text-sm mt-1">Be the first to nominate!</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3 text-gray-900">
            <Trophy className="h-10 w-10 text-orange-500" />
            Champions Podium
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Celebrating excellence in the staffing industry. See who's leading in each category based on community votes.
          </p>
        </div>

        {/* Category Group Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {categoryGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => handleGroupChange(group.id)}
                className={`
                  px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300
                  transform hover:scale-105 hover:shadow-lg
                  ${selectedGroup === group.id
                    ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm'
                  }
                `}
              >
                {group.label}
              </button>
            ))}
          </div>

          {/* Specific Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {availableCategories.map((categoryId) => {
              const category = CATEGORIES.find(c => c.id === categoryId);
              if (!category) return null;
              
              return (
                <button
                  key={categoryId}
                  onClick={() => handleCategoryChange(categoryId)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                    transform hover:scale-105
                    ${selectedCategory === categoryId
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                      : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200 hover:border-orange-200'
                    }
                  `}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Podium Content */}
        <div className="relative">
          {loading && (
            <div className="text-center py-16">
              <div className="inline-flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="text-lg text-gray-600">Loading champions...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-16">
              <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
                <p className="text-red-600 font-medium text-lg">Unable to load podium</p>
                <p className="text-red-500 text-sm mt-2">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="flex items-end justify-center gap-8 min-h-[500px]">
              {/* 2nd Place - Silver */}
              <div className="flex flex-col items-center">
                {getRankCard(2, podiumData.find(p => p.rank === 2))}
              </div>

              {/* 1st Place - Gold (Center, Largest) */}
              <div className="flex flex-col items-center">
                {getRankCard(1, podiumData.find(p => p.rank === 1))}
              </div>

              {/* 3rd Place - Bronze */}
              <div className="flex flex-col items-center">
                {getRankCard(3, podiumData.find(p => p.rank === 3))}
              </div>
            </div>
          )}

          {/* Category Info */}
          {!loading && !error && (
            <div className="text-center mt-12">
              <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-8 py-4 border border-gray-200 shadow-lg">
                <Award className="h-6 w-6 text-orange-500" />
                <span className="font-semibold text-gray-700 text-lg">
                  {CATEGORIES.find(c => c.id === selectedCategory)?.name || selectedCategory}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}