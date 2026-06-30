import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  BookOpen, Info, Shield, Award, Terminal, Briefcase, 
  User, Mail, Globe, CheckCircle, HelpCircle, ArrowRight,
  TrendingUp, Users, Utensils, Wallet, ShoppingCart, Calculator,
  Linkedin
} from 'lucide-react';

export default function About() {
  const { t, language } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'guide' | 'creator' | 'company'>('guide');
  const [guideRole, setGuideRole] = useState<'manager' | 'mealManager' | 'border'>('manager');

  const content = {
    en: {
      title: "Help, Guide & About Us",
      subtitle: "Learn how to operate NL Mess and get to know the team behind the application.",
      guideTab: "User Manual Guide",
      creatorTab: "About the Creator",
      companyTab: "About Nanolez Tech",
      roleManager: "Mess Manager (Admin)",
      roleMealManager: "Meal Manager",
      roleBorder: "Resident Border (Member)",
      
      managerGuide: {
        intro: "As a Mess Manager, you have full administrative privileges to customize and operate the mess. You are the ultimate authority for your mess community.",
        steps: [
          {
            title: "App Setup & Registration",
            desc: "Register your unique mess community. Specify border capacity, address, and upload a thumbnail image. This creates your isolated digital workspace.",
            icon: CheckCircle
          },
          {
            title: "Member Lifecycle Management",
            desc: "Approve pending join requests, manage active border profiles, and move members between roles. You can demote or promote other managers easily.",
            icon: Users
          },
          {
            title: "Global Financial Control",
            desc: "Oversee all deposits, bazaar costs, and essential expenses. Your approvals ensure the financial health and transparency of the entire mess.",
            icon: Wallet
          },
          {
            title: "Multi-Mess Management",
            desc: "Manage multiple messes from a single account. Switch between different hostels or mess units seamlessly via the Onboarding switch panel.",
            icon: Shield
          },
          {
            title: "Audit & Settlement",
            desc: "Perform final settlement calculations. The system provides a downloadable or printable summary of every member's balance at any time.",
            icon: Calculator
          }
        ]
      },

      mealManagerGuide: {
        intro: "As a Meal Manager, you focus specifically on the daily operations of food, bazaar, and basic reporting while maintaining transparency for borders.",
        steps: [
          {
            title: "Daily Meal Logging",
            desc: "Input meal counts accurately for every member. Use the visual meal sheet to track breakfast, lunch, and dinner preferences.",
            icon: Utensils
          },
          {
            title: "Bazaar Reporting",
            desc: "Record daily market purchases. Specify item names, quantities, and prices. This data is the primary driver for real-time meal rate calculation.",
            icon: ShoppingCart
          },
          {
            title: "Tomorrow's Meal Visibility",
            desc: "Review 'Tomorrow's Meal' bookings from borders to make informed decisions about market purchases and quantities.",
            icon: BookOpen
          },
          {
            title: "Notice & Announcements",
            desc: "Post important updates or notifications to all members regarding changes in meal schedules or special feast announcements.",
            icon: Info
          }
        ]
      },

      borderGuide: {
        intro: "As a Resident Border, you have individual transparency over meals, credit balance, and upcoming meal preferences.",
        steps: [
          {
            title: "Real-time Dashboard",
            desc: "See exactly where you stand. Your current meal count, total deposit, and net balance are always visible with live updates.",
            icon: TrendingUp
          },
          {
            title: "Meal Booking System",
            desc: "Book your choices for the next day (Off, Full, Half, or Custom) before the deadline to ensure your preferences are respected.",
            icon: CheckCircle
          },
          {
            title: "Personal PIN Security",
            desc: "Secure your access with a personalized 6-digit login PIN provided by your manager. Change it any time for better privacy.",
            icon: Shield
          },
          {
            title: "Transparent Bazaar History",
            desc: "View every single bazaar entry made. Know exactly what items were bought and at what price, ensuring zero misunderstanding.",
            icon: ShoppingCart
          }
        ]
      },

      creator: {
        name: "Nabid Ahammed Limon",
        role: "Founder & Lead Software Architect",
        bio: "Nabid Ahammed Limon is the founder of Nanolez Tech. He is currently studying in the Urban and Regional Planning (URP) department at Rajshahi University of Engineering & Technology (RUET). Passionate about web engineering, scalable systems design, and data-driven urban planning, he specializes in creating lightweight real-time systems to solve modern group coordination challenges in residential communities.",
        contributions: [
          "Architected the server-side multi-mess handling logic allowing managers to control multiple sites from one dashboard.",
          "Engineered the hybrid Firebase Firestore rule models for optimal multi-tenant sandbox security and data isolation.",
          "Designed the secure local PIN login feature allowing passwordless border authentication for faster user onboarding.",
          "Implemented the complex monthly settlement algorithm that auto-calculates dues based on real-time bazaar expenditures."
        ],
        contactTitle: "Get in touch with Nabid",
        email: "nabidahamed2003@gmail.com",
        github: "https://github.com/NabidAhammed",
        linkedin: "https://linkedin.com/in/nalimon005"
      },

      company: {
        tagline: "Student & education-based solutions designed for seamless residential life.",
        desc: "Nanolez Tech is a student solutions and education-focused company. Since most of our mess residents are students, Nanolez specifically geared its focus towards solving the everyday struggles of coordinating meals and bazaar budgets in paper 'khata' (notebooks). We replace manual, error-prone calculations with state-of-the-art real-time digital automation to ensure precise student cooperative management.",
        valuesTitle: "Core Engineering Standards",
        values: [
          {
            title: "Architectural Clarity",
            desc: "We write clean, modular, and human-scannable codebases designed for longevity."
          },
          {
            title: "Intuitive User Interfaces",
            desc: "Software must feel natural, lightweight, and accessible to everyone regardless of their technical prowess."
          },
          {
            title: "Secure & Trusted",
            desc: "User data security is never compromised; implementing proper cloud structures and explicit authorization is our primary tenant."
          }
        ],
        footer: "Nanolez Tech © 2026. All Rights Reserved."
      }
    },
    bn: {
      title: "সহায়তা, গাইড ও আমাদের সম্পর্কে",
      subtitle: "কীভাবে এনএল মেস পরিচালনা করতে হয় এবং অ্যাপ্লিকেশনটির পেছনের টিম সম্পর্কে জানুন।",
      guideTab: "ইউজার গাইড / ম্যানুয়াল",
      creatorTab: "উদ্যোক্তা পরিচিতি",
      companyTab: "ন্যানোলেজ টেক সম্পর্কে",
      roleManager: "মেস ম্যানেজার (অ্যাডমিন)",
      roleMealManager: "মিল ম্যানেজার",
      roleBorder: "মেস মেম্বার (বর্ডার)",

      managerGuide: {
        intro: "মেস ম্যানেজার হিসেবে আপনি মেসের যাবতীয় তথ্য নিয়ন্ত্রণ, অনুমোদন এবং হিসাব রক্ষণাবেক্ষণ করতে পারবেন। আপনি মেসের সর্বোচ্চ সিদ্ধান্ত গ্রহণকারী।",
        steps: [
          {
            title: "মেস সেটআপ ও রেজিস্ট্রেশন",
            desc: "আপনার মেসটি রেজিস্ট্রেশন করুন, ছবি আপলোড করুন এবং বর্ডার ধারণক্ষমতা নির্ধারণ করুন। এটি আপনার জন্য একটি সম্পূর্ণ নিরাপদ ডিজিটাল মেস তৈরি করবে।",
            icon: CheckCircle
          },
          {
            title: "মেম্বার হ্যান্ডলিং ও পরিচিতি",
            desc: "নতুন বর্ডারদের আবেদন চেক করে এপ্রুভ করুন। প্রয়োজনে যেকোনো মেম্বারকে ম্যানেজার বা মিল ম্যানেজার হিসেবে প্রমোট করতে পারবেন।",
            icon: Users
          },
          {
            title: "আর্থিক স্বচ্ছতা ও নিয়ন্ত্রণ",
            desc: "সব মেম্বারের জমা করা ফান্ড, বাজারের খরচ এবং মেসের অন্যান্য খরচগুলো তদারকি করুন। আপনার ইনপুট করা তথ্যের উপরেই মেসের স্বচ্ছতা নির্ভর করে।",
            icon: Wallet
          },
          {
            title: "একাধিক মেস ম্যানেজমেন্ট",
            desc: "একই ইউজার অ্যাকাউন্ট দিয়ে একাধিক মেস (যেমন- বিভিন্ন বিল্ডিং বা ইউনিট) একসাথেই পরিচালনা করতে পারবেন যা অন্য কোনো অ্যাপে সম্ভব নয়।",
            icon: Shield
          },
          {
            title: "অডিট ও ফাইনাল হিসাব",
            desc: "মাসের যেকোনো সময় নিমিষেই মেসের বর্তমান অবস্থা বা ফাইনাল ক্লোজিং হিসাব করে ফেলতে পারবেন যা বর্ডারদের দেখানোর জন্য পারফেক্ট।",
            icon: Calculator
          }
        ]
      },

      mealManagerGuide: {
        intro: "মিল ম্যানেজাররা মূলত মেসের প্রতিদিনের মিল হিসাব, বাজারের হিসাব এবং মেম্বারদের জন্য প্রয়োজনীয় নোটিশ দেওয়ার কাজগুলো করে থাকেন।",
        steps: [
          {
            title: "প্রতিদিনের মিল এন্ট্রি",
            desc: "সব মেম্বারের জন্য রিয়েল-টাইম মিল শিট ব্যবহার করে প্রতিদিনের মিল সংখ্যা নিখুঁতভাবে ইনপুট দিন।",
            icon: Utensils
          },
          {
            title: "বাজার খরচের রেকর্ড",
            desc: "প্রতিদিনের কেনাকাটার বিবরণ, পণ্যের নাম ও দাম নির্ভুলভাবে অ্যাপে যুক্ত করুন যা মিল রেট বের করতে সাহায্য করবে।",
            icon: ShoppingCart
          },
          {
            title: "আগামীকালের মিলের আগাম তথ্য",
            desc: "বর্ডাররা আগামীকালের জন্য কতটি মিল বুকিং করেছে তা দেখে বাজারের লিষ্ট তৈরি করতে পারবেন।",
            icon: BookOpen
          },
          {
            title: "বিশেষ নোটিশ ও ঘোষণা",
            desc: "মিল সংক্রান্ত কোনো পরিবর্তন বা বিশেষ ভোজের নোটিশ অ্যাপের মাধ্যমে সব বর্ডারকে জানিয়ে দিতে পারবেন।",
            icon: Info
          }
        ]
      },

      borderGuide: {
        intro: "একজন আবাসিক মেম্বার হিসেবে আপনার ব্যক্তিগত মিল, জমা ব্যালেন্স এবং আগামীকালের মিল অগ্রিম বুকিংয়ের কাজগুলো খুব সহজেই করতে পারবেন।",
        steps: [
          {
            title: "রিয়েল-টাইম ড্যাশবোর্ড",
            desc: "লগইন করা মাত্রই দেখতে পাবেন বর্তমান মিল রেট, আপনার মোট মিল সংখ্যা, আপনার জমা এবং নিট ব্যালেন্সের সঠিক হিসাব।",
            icon: TrendingUp
          },
          {
            title: "আগাম মিল বুকিং সিস্টেম",
            desc: "পরের দিন কতটি মিল খাবেন (Full, Half বা Off) তা আগে থেকেই বুকিং করুন যাতে খাবার অপচয় না হয়।",
            icon: CheckCircle
          },
          {
            title: "ব্যক্তিগত পিন সিকিউরিটি",
            desc: "আপনার মেসের পিন কোড দিয়ে দ্রুত লগইন করুন। চাইলে পছন্দমতো যেকোনো সময় আপনার লগইন পিন পরিবর্তন করে নিতে পারবেন।",
            icon: Shield
          },
          {
            title: "বাজারের স্বচ্ছ বিবরণী",
            desc: "ম্যানেজার বা অন্য বর্ডার কোন কোন জিনিসের জন্য কত টাকা খরচ করেছেন তা স্বচ্ছভাবে বাজার তালিকায় চেক করুন।",
            icon: ShoppingCart
          }
        ]
      },

      creator: {
        name: "নাবিদ আহম্মেদ লিমন",
        role: "প্রতিষ্ঠাতা ও প্রধান সফটওয়্যার আর্কিটেক্ট",
        bio: "নাবিদ আহম্মেদ লিমন ন্যানোলেজ টেকের প্রতিষ্ঠাতা। তিনি বর্তমানে রাজশাহী প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয় (RUET)-এর আরবান অ্যান্ড রিজিওনাল প্ল্যানিং (URP) বিভাগে অধ্যয়নরত আছেন। গ্রুপ রিসোর্স কোঅর্ডিনেশনের জটিল হিসাব-নিকাশ সহজ করতে ক্লাউড টেকনোলজি, ব্যাকএন্ড আর্কিটেকচার ও রিয়েল-টাইম সফটওয়্যার ইকোসিস্টেম ডিজাইনে তাঁর রয়েছে বিশেষ আগ্রহ ও দক্ষতা।",
        contributions: [
          "সার্ভার-সাইড মাল্টি-মেস হ্যান্ডলিং লজিক ডিজাইন করেছেন যা দিয়ে একজন ইউজার একসাথে অনেকগুলো মেস নিয়ন্ত্রণ করতে পারেন।",
          "ডেটা সুরক্ষায় হাইব্রিড ফায়ারবেস ফায়ারস্টোর রুলস এবং মাল্টি-টিন্যান্ট আর্কিটেকচার তৈরি করেছেন।",
          "মেম্বারদের জন্য দ্রুত ও নিরাপদ পাসওয়ার্ডবিহীন ৬-অক্ষরের পিন (PIN) লগইন সিস্টেম ডেভলপ করেছেন।",
          "স্বয়ংক্রিয় সেটেলমেন্ট অ্যালগরিদম তৈরি করেছেন যা বাজারের খরচের সাথে মিল রেখে নিখুঁত হিসাব প্রদান করে।"
        ],
        contactTitle: "নাবিদের সাথে যোগাযোগ করুন",
        email: "nabidahamed2003@gmail.com",
        github: "https://github.com/NabidAhammed",
        linkedin: "https://linkedin.com/in/nalimon005"
      },

      company: {
        tagline: "শিক্ষার্থীবান্ধব ডিজিটাল সリューション যা মেস জীবনকে করে সহজ ও নির্ঝঞ্ঝাট।",
        desc: "ন্যানোলেজ টেক (Nanolez Tech) মূলত একটি শিক্ষার্থীবান্ধব সলিউশন এবং এডুকেশন-বেসড সলিউশন সরবরাহকারী প্রতিষ্ঠান। মেসের অধিকাংশ সদস্যই শিক্ষার্থী হওয়ায়, মেসের দৈনন্দিন মিল ও বাজার খরচের হিসাব খাতা-কলমে লিখে রাখার সনাতন কষ্টদায়ক পদ্ধতিটিকে দূর করে সুন্দর ও স্বয়ংক্রিয় ডিজিটাল ব্যবস্থাপনায় রূপান্তর করতে ন্যানোলেজ মেসের প্রয়োজনের দিকে তীক্ষ্ণ চোখ রেখে স্বয়ংক্রিয় সলিউশনটি তৈরি করেছে।",
        valuesTitle: "আমাদের ইঞ্জিনিয়ারিং মূলনীতি",
        values: [
          {
            title: "কাঠামোগত পরিচ্ছন্নতা",
            desc: "আমরা উন্নত, পরিচ্ছন্ন ও অত্যন্ত নিখুঁত কোড লিখি যা দীর্ঘস্থায়ী পারফরম্যান্স নিশ্চিত করে।"
          },
          {
            title: "সহজ ও সাবলীল ইউজার ইন্টারফেস",
            desc: "সফটওয়্যারের ফিচারগুলো এমন সহজভাবে নকশা করা হয় যেন যেকোনো সাধারণ মানুষ কোনো প্রশিক্ষণ ছাড়াই সহজে ব্যবহার করতে পারেন।"
          },
          {
            title: "সর্বোচ্চ নিরাপত্তা ও বিশ্বাস",
            desc: "গ্রাহকের ডেটার শতভাগ গোপনীয়তা এবং সিকিউরিটি রক্ষা করা আমাদের অন্যতম প্রধান দায়িত্ব।"
          }
        ],
        footer: "ন্যানোলেজ টেক © ২০২৬। সর্বস্বত্ব সংরক্ষিত।"
      }
    }
  };

  const tAbout = language === 'bn' ? content.bn : content.en;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Title Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-blue-600" />
          {tAbout.title}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{tAbout.subtitle}</p>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('guide')}
          className={`flex-1 py-3 text-center font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'guide'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Info className="w-4 h-4" />
            {tAbout.guideTab}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('creator')}
          className={`flex-1 py-3 text-center font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'creator'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <User className="w-4 h-4" />
            {tAbout.creatorTab}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('company')}
          className={`flex-1 py-3 text-center font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'company'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Globe className="w-4 h-4" />
            {tAbout.companyTab}
          </span>
        </button>
      </div>

      {/* Content Rendering */}
      {activeSubTab === 'guide' && (
        <div className="space-y-6">
          {/* Guide Sub-Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl max-w-lg mx-auto">
            <button
              onClick={() => setGuideRole('manager')}
              className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                guideRole === 'manager'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tAbout.roleManager}
            </button>
            <button
              onClick={() => setGuideRole('mealManager')}
              className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                guideRole === 'mealManager'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tAbout.roleMealManager}
            </button>
            <button
              onClick={() => setGuideRole('border')}
              className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                guideRole === 'border'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tAbout.roleBorder}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            <p className="text-slate-600 text-sm leading-relaxed border-l-4 border-blue-500 pl-4 bg-blue-50/50 py-3 rounded-r-lg">
              {guideRole === 'manager' 
                ? tAbout.managerGuide.intro 
                : guideRole === 'mealManager' 
                  ? tAbout.mealManagerGuide.intro 
                  : tAbout.borderGuide.intro}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(guideRole === 'manager' 
                ? tAbout.managerGuide.steps 
                : guideRole === 'mealManager' 
                  ? tAbout.mealManagerGuide.steps 
                  : tAbout.borderGuide.steps
              ).map((step, idx) => {
                const IconComp = step.icon;
                return (
                  <div key={idx} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl h-fit">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                        {language === 'bn' ? `ধাপ ${idx + 1}` : `Step ${idx + 1}`}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm mt-1">{step.title}</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'creator' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Creator Profile Card Banner */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 h-28 px-8 flex items-end">
            <div className="transform translate-y-6 w-20 h-20 bg-slate-100 rounded-2xl shadow-md border-4 border-white flex items-center justify-center font-black text-2xl text-blue-700">
              NA
            </div>
          </div>
          
          <div className="p-6 md:p-8 pt-10 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{tAbout.creator.name}</h2>
              <p className="text-xs uppercase tracking-wider font-extrabold text-blue-600 mt-0.5">{tAbout.creator.role}</p>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed">{tAbout.creator.bio}</p>

            <div className="space-y-3 border-t pt-5">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-500" />
                {language === 'bn' ? "প্রজেক্ট কন্ট্রিবিউশন সমূহ" : "Core Contributions on NL Mess"}
              </h4>
              <ul className="space-y-2">
                {tAbout.creator.contributions.map((con, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-600">
                    <span className="text-blue-500 font-bold">•</span>
                    <span className="leading-relaxed">{con}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">{tAbout.creator.contactTitle}</h4>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs font-semibold text-slate-600">
                <a href={`mailto:${tAbout.creator.email}`} className="flex items-center gap-2 hover:text-blue-600 transition">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {tAbout.creator.email}
                </a>
                <a href={tAbout.creator.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-blue-600 transition">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  GitHub Profile
                </a>
                {tAbout.creator.linkedin && (
                  <a href={tAbout.creator.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-blue-600 transition">
                    <Linkedin className="w-4 h-4 text-slate-400" />
                    LinkedIn Profile
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'company' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-930">Nanolez Tech</h2>
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Software Engineering & Digital Automation</p>
              </div>
            </div>

            <p className="text-slate-800 font-medium text-sm leading-snug tracking-tight">
              "{tAbout.company.tagline}"
            </p>
            
            <p className="text-slate-500 text-xs leading-relaxed">
              {tAbout.company.desc}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-5">
               <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest flex items-center gap-2 text-blue-600">
                    <Terminal className="w-3.5 h-3.5" />
                    {language === 'bn' ? 'ব্যবহৃত প্রযুক্তি সমূহ' : 'Technology Stack'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['React 18', 'Vite', 'TypeScript', 'Tailwind CSS', 'Firebase Firestore', 'Cloud Auth', 'Lucide Icons', 'Motion Animation'].map(tech => (
                      <span key={tech} className="px-2 py-1 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-lg border border-slate-200">
                        {tech}
                      </span>
                    ))}
                  </div>
               </div>
               <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest flex items-center gap-2 text-blue-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {language === 'bn' ? 'সিস্টেমের লক্ষ্য' : 'System Goals'}
                  </h4>
                  <ul className="space-y-1.5">
                    {[
                      language === 'bn' ? 'খাতা-কলমের হিসাব মুক্ত মেস' : 'Paperless Mess Management',
                      language === 'bn' ? 'রিয়েল-টাইম স্বচ্ছতা' : 'Real-time Transparency',
                      language === 'bn' ? 'সঠিক মিল রেট ক্যালকুলেশন' : 'Precise Meal Rate Calculation',
                      language === 'bn' ? 'ইনস্ট্যান্ট অডিট সুবিধা' : 'Instant Audit Readiness'
                    ].map(goal => (
                      <li key={goal} className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                        <div className="w-1 h-1 bg-blue-400 rounded-full" />
                        {goal}
                      </li>
                    ))}
                  </ul>
               </div>
            </div>

            <div className="border-t pt-5 space-y-4">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-500" />
                {tAbout.company.valuesTitle}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {tAbout.company.values.map((v, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition">
                    <span className="font-black text-xs text-slate-300">0{idx + 1}</span>
                    <h5 className="font-bold text-slate-800 text-xs mt-1">{v.title}</h5>
                    <p className="text-slate-500 text-[11px] leading-relaxed mt-1">{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center text-slate-400 text-xs font-medium py-3">
            {tAbout.company.footer}
          </div>
        </div>
      )}
    </div>
  );
}
