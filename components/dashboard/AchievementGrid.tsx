"use client";

import { Award, BookOpen, Sprout, Clock, Users, Sparkles, Laptop, Compass, Heart, GraduationCap } from "lucide-react";

type AchievementGridProps = {
  stats: {
    myHours: number;
    myActivities: number;
    myBeneficiaries: number;
    myProjects: number;
  };
  activities: any[];
};

const achievementsList = [
  {
    id: "first_act",
    title: "First Step",
    desc: "Logged your first activity",
    icon: Sparkles,
    check: (stats: any) => stats.myActivities >= 1,
  },
  {
    id: "act_5",
    title: "Dedicated",
    desc: "Logged 5 activities",
    icon: Award,
    check: (stats: any) => stats.myActivities >= 5,
  },
  {
    id: "act_10",
    title: "High Achiever",
    desc: "Logged 10 activities",
    icon: Compass,
    check: (stats: any) => stats.myActivities >= 10,
  },
  {
    id: "act_25",
    title: "Century Log",
    desc: "Logged 25 activities",
    icon: Heart,
    check: (stats: any) => stats.myActivities >= 25,
  },
  {
    id: "hours_50",
    title: "Half Century",
    desc: "Contributed 50 hours",
    icon: Clock,
    check: (stats: any) => stats.myHours >= 50,
  },
  {
    id: "hours_100",
    title: "Centurion",
    desc: "Contributed 100 hours",
    icon: Clock,
    check: (stats: any) => stats.myHours >= 100,
  },
  {
    id: "bens_250",
    title: "Mass Impact",
    desc: "Reached 250 beneficiaries",
    icon: Users,
    check: (stats: any) => stats.myBeneficiaries >= 250,
  },
  {
    id: "bens_500",
    title: "Community Hero",
    desc: "Reached 500 beneficiaries",
    icon: Users,
    check: (stats: any) => stats.myBeneficiaries >= 500,
  },
  {
    id: "tree_planter",
    title: "Eco Warrior",
    desc: "Planted at least one tree",
    icon: Sprout,
    check: (_stats: any, activities: any[]) => activities.some(a => Number(a.trees_planted ?? 0) > 0),
  },
  {
    id: "edu_volunteer",
    title: "Educator",
    desc: "Logged student teaching",
    icon: GraduationCap,
    check: (_stats: any, activities: any[]) => activities.some(a => a.project_type === "Student Teaching" || a.intern_work_type === "Student Teaching"),
  },
  {
    id: "research_contrib",
    title: "Scholar",
    desc: "Logged research work",
    icon: BookOpen,
    check: (_stats: any, activities: any[]) => activities.some(a => a.project_type === "Research" || a.intern_work_type === "Research"),
  },
  {
    id: "dash_builder",
    title: "Tech Wizard",
    desc: "Logged dashboard code",
    icon: Laptop,
    check: (_stats: any, activities: any[]) => activities.some(a => a.project_type === "Dashboard Development" || a.intern_work_type === "Dashboard Development"),
  },
];

export default function AchievementGrid({ stats, activities }: AchievementGridProps) {
  return (
    <article className="border border-border bg-white p-5 rounded-2xl font-display h-full">
      <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
        <Award size={18} className="text-brand" />
        <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Unlocked Achievements</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
        {achievementsList.map((item) => {
          const Icon = item.icon;
          const isUnlocked = item.check(stats, activities);
          
          return (
            <div 
              key={item.id} 
              className={`flex items-start gap-2.5 p-3 border rounded-xl transition-all ${
                isUnlocked 
                  ? "bg-[#e9f7ef]/30 border-[#2ecc71]/25 text-ink" 
                  : "bg-paper/40 border-border/80 text-mist opacity-50"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isUnlocked ? "bg-[#2ecc71]/15 text-[#167241]" : "bg-paper text-mist"
              }`}>
                <Icon size={16} />
              </div>
              <div className="text-left leading-tight">
                <p className={`text-xs font-bold ${isUnlocked ? "text-ink" : "text-mist"}`}>{item.title}</p>
                <p className="text-[10px] text-mist/95 mt-0.5">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
