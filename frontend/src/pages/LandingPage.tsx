import React from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  MessageSquare,
  Receipt,
  ArrowRight,
  Store,
  CheckCircle2,
  FileCheck,
  Search,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import {
  DoodleUnderline,
  DoodleLoop,
  DoodleArrow,
  DoodleStar,
  DoodleSparkle,
  DoodlePaperPlane,
  DoodleCrown,
  DoodlePaperclip,
  DoodleTape,
  DoodleSticker,
} from '../components/doodle/DoodleAssets';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-notebook-grid text-slate-900 flex flex-col font-hand selection:bg-blue-200 selection:text-blue-900 relative overflow-x-hidden">
      {/* Notebook red double margin line (Classic Indian dukaan ledger / student notebook style) */}
      <div className="hidden lg:block absolute left-8 top-0 bottom-0 w-0.5 border-r border-red-300 pointer-events-none z-10 opacity-70" />
      <div className="hidden lg:block absolute left-9.5 top-0 bottom-0 w-0.5 border-r border-red-300 pointer-events-none z-10 opacity-70" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-transparent border-b-2 border-slate-900">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-22 sm:h-24 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 bg-blue-600 flex items-center justify-center font-bold text-white border-2 border-slate-900 shadow-doodle border-doodle -rotate-3 group-hover:rotate-0 transition-transform shrink-0">
              <DoodleCrown className="absolute -top-4 -right-2.5 w-6 h-5 text-red-600 rotate-12" />
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-2xl sm:text-3xl tracking-wide text-slate-900 flex items-center gap-1.5 -rotate-1 group-hover:rotate-0 transition-transform">
              invoicer
              <span className="text-white bg-red-600 px-2 py-0.5 text-lg sm:text-xl rounded-[180px_10px_160px_10px/10px_160px_10px_180px] border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rotate-2 inline-block">
                AI
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-10 text-xl font-heading font-bold text-slate-800">
            <a
              href="#features"
              className="hover:text-blue-600 transition-colors hover:underline decoration-wavy decoration-red-500 underline-offset-6 px-2 py-1"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-blue-600 transition-colors hover:underline decoration-wavy decoration-blue-500 underline-offset-6 px-2 py-1"
            >
              How It Works
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button
                variant="ghost"
                size="md"
                className="font-heading font-bold text-base border-2 border-slate-900 bg-white hover:bg-red-50 text-slate-900 shadow-doodle border-doodle-sm px-5 py-2 transition-transform hover:-translate-y-0.5"
              >
                Store Login
              </Button>
            </Link>
            <Link to="/register">
              <Button
                variant="primary"
                size="md"
                className="font-heading font-bold text-base bg-blue-600 hover:bg-blue-700 text-white border-2 border-slate-900 shadow-doodle border-doodle-sm px-6 py-2 transition-transform hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 border-b-2 border-slate-900 border-dashed overflow-hidden">
        {/* Floating playful doodles */}
        <DoodlePaperPlane className="hidden md:block absolute top-8 right-16 w-14 h-14 -rotate-12 pointer-events-none opacity-85" />
        <DoodleStar className="absolute top-12 left-14 w-7 h-7 text-red-500 rotate-12 pointer-events-none" />
        <DoodleSparkle className="absolute bottom-12 left-1/3 w-6 h-6 text-blue-600 pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-20">
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-yellow-100 border-2 border-slate-900 text-slate-900 text-xs font-doodle font-bold uppercase tracking-wider shadow-doodle border-doodle-pill -rotate-1">
              <Sparkles className="w-4 h-4 text-red-600 shrink-0" />
              <span>Smart Bill Assistant for Indian Retailers</span>
              <DoodleStar className="w-3.5 h-3.5 text-blue-600" />
            </div>

            {/* Main Heading preserved in iconic phrasing */}
            <div className="relative">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-bold tracking-normal text-slate-900 leading-[1.25]">
                Dukaan ka hisaab, <br className="hidden sm:inline" />
                <span className="relative inline-block text-blue-600 mt-2">
                  <span className="relative z-10">ekdum simple.</span>
                  {/* <DoodleUnderline className="absolute -bottom-3.5 left-0 w-full h-4 text-red-600" /> */}
                </span>
              </h1>
            </div>

            <p className="text-lg sm:text-xl text-slate-700 font-hand max-w-xl leading-relaxed">
              Scribbled{' '}
              <i className="text-blue-700 font-bold not-italic underline decoration-wavy decoration-red-500 px-0.5">
                paper receipts
              </i>{' '}
              or messy GST bills—snap a photo and watch our AI turn the chaos into clean, totaled accounts.
              Checking your shop’s sales is now as easy as asking a question.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 relative">
              <Link to="/register" className="relative group">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-heading font-bold text-lg border-2 border-slate-900 shadow-doodle-lg border-doodle px-8 py-3.5 transition-transform group-hover:-rotate-1 active:translate-x-1 active:translate-y-1"
                >
                  <span>Get Started — It's Free</span>
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
                {/* Scribbled arrow pointing to Free CTA */}
                <div className="hidden lg:flex items-center gap-1.5 absolute -right-32 -top-7 rotate-[-8deg] pointer-events-none select-none">
                  <DoodleArrow direction="down-left" className="w-12 h-10 text-blue-600" />
                </div>
              </Link>

              <Link to="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white hover:bg-blue-50 text-blue-700 font-heading font-bold text-lg border-2 border-blue-600 shadow-doodle-blue border-doodle px-8 py-3.5 transition-transform hover:rotate-1"
                >
                  Store Login
                </Button>
              </Link>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4 text-sm font-hand font-bold text-slate-800">
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] border-doodle-sm">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>No complex software</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] border-doodle-sm">
                <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />
                <span>Hindi + Hinglish support</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] border-doodle-sm">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Edit before saving</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 relative">
            {/* Playful doodle stickers pinned around the card */}
            <div className="absolute -top-10 -right-6 z-30 hidden sm:block">
              <DoodleSticker
                src="https://raw.githubusercontent.com/MariaLetta/mega-doodles-pack/master/doodles/stars.svg"
                alt="Doodle Stars"
                fallbackEmoji="✅"
                badgeText="Accurate Bill!"
                className="w-14 h-14"
                rotate="rotate-6"
              />
            </div>
            <div className="absolute -bottom-8 -left-8 z-30 hidden sm:block">
              <DoodleSticker
                src="https://raw.githubusercontent.com/MariaLetta/mega-doodles-pack/master/doodles/rocket.svg"
                alt="AI Rocket"
                fallbackEmoji="🚀"
                badgeText="Super Fast"
                className="w-14 h-14"
                rotate="-rotate-12"
              />
            </div>

            {/* Visual editorial composition - Authentic Doodled Kirana Parchi */}
            <div className="bg-white border-2 border-slate-900 border-doodle p-6 shadow-doodle-lg relative rotate-[-1deg] hover:rotate-0 transition-transform duration-200">
              {/* Paperclip & Washi Tape */}
              <DoodleTape color="yellow" rotate="-rotate-1" className="top-[-12px] left-1/2 -translate-x-1/2 w-32 h-6" />
              <DoodlePaperclip className="absolute -top-4 left-6 w-5 h-12 text-slate-800 z-30" />

              <div className="border-b-2 border-slate-900 border-dashed pb-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-slate-900" />
                  <span className="font-doodle text-sm font-bold uppercase tracking-wider text-slate-900">
                    Live Bill Digitizer
                  </span>
                </div>
                <span className="font-doodle text-xs font-bold px-2 py-0.5 bg-red-100 text-red-700 border-2 border-red-600 border-doodle-sm rotate-[-4deg]">
                  Verified ✓
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs text-slate-800">
                <div className="flex justify-between border-b border-slate-200 border-dashed pb-2 font-hand text-sm font-bold">
                  <span className="text-slate-500">Bill No:</span>
                  <span className="text-blue-700 font-mono">INV-2024-089</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 border-dashed pb-2 font-hand text-sm font-bold">
                  <span className="text-slate-500">Customer:</span>
                  <span className="text-slate-900 font-doodle text-base font-bold">Sharma General Store</span>
                </div>

                <div className="pt-1">
                  <p className="text-[11px] font-doodle uppercase font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                    <span>Extracted Items</span>
                    <span className="text-blue-600 font-normal">(AI Extracted)</span>
                  </p>
                  <div className="space-y-1.5 font-hand text-sm">
                    <div className="flex justify-between py-1.5 px-2.5 bg-blue-50 border border-blue-200 border-doodle-sm font-bold">
                      <span>Basmati Rice 25kg</span>
                      <span className="text-blue-800">₹2,450.00</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2.5 bg-yellow-50 border border-yellow-200 border-doodle-sm font-bold">
                      <span>Refined Oil 15L Tin</span>
                      <span className="text-slate-900">₹1,820.00</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2.5 bg-blue-50 border border-blue-200 border-doodle-sm font-bold">
                      <span>Tata Salt 1kg (x20)</span>
                      <span className="text-blue-800">₹560.00</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-slate-900 border-dashed flex justify-between items-center text-sm font-doodle font-bold text-slate-900">
                  <span className="text-base">Total Amount:</span>
                  <span className="text-red-600 text-xl font-bold bg-yellow-100 px-2 py-0.5 border border-red-500 border-doodle-sm shadow-[1px_1px_0px_#dc2626]">
                    ₹4,830.00
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-doodle text-slate-600">
                <span className="flex items-center gap-1.5 text-blue-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  AI Quality: 95/100
                </span>
                <span className="bg-red-50 text-red-600 font-bold px-1.5 py-0.5 border border-red-300 border-doodle-sm">
                  Review & Confirm ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Sections: 3 alternating rows */}
      <section id="features" className="py-20 px-4 sm:px-6 relative">
        <div className="max-w-6xl mx-auto space-y-24">
          {/* Main Section Heading */}
          <div className="text-center max-w-2xl mx-auto relative">
            <h2 className="text-3xl sm:text-5xl font-heading font-bold tracking-normal text-slate-900 mb-3 relative inline-block">
              Dukaandar ke liye khaas banaya gaya
              <DoodleUnderline className="absolute -bottom-2 left-1/4 w-1/2 h-3 text-blue-600" />
            </h2>
            <p className="text-slate-700 text-lg font-hand">
              Say goodbye to complicated accounting software. Manage your entire bookkeeping in three effortless steps.
            </p>
          </div>

          {/* Row 1: Upload Bills (Illustration left, Text right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-6 order-2 md:order-1 relative">
              <div className="bg-white border-2 border-slate-900 border-doodle p-8 shadow-doodle-lg flex flex-col items-center justify-center text-center relative rotate-[-1deg] hover:rotate-0 transition-transform">
                <DoodleTape color="blue" rotate="rotate-2" className="top-[-10px] left-1/2 -translate-x-1/2 w-28 h-5" />
                <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-600 border-dashed flex items-center justify-center text-blue-600 mb-4 shadow-doodle-blue">
                  <UploadCloud className="w-10 h-10" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <p className="text-xl font-heading font-bold text-slate-900">Drag & Drop Invoice Photo</p>
                  <p className="text-sm font-hand text-slate-500">Supports JPG, PNG, WebP up to 10MB</p>
                  <div className="mt-4 p-3.5 bg-yellow-50 rounded-sm border-2 border-slate-900 border-doodle text-left text-xs font-hand">
                    <p className="text-blue-700 font-heading font-bold text-base mb-1">✓ Instant AI Task Dispatch</p>
                    <p className="text-slate-700">Extracts items, taxes, totals directly to draft review.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-6 space-y-4 order-1 md:order-2">
              <span className="font-heading text-sm font-bold text-red-600 bg-red-100 border-2 border-red-600 px-3 py-0.5 border-doodle-pill inline-block -rotate-2">
                01. Smart Bill Scan
              </span>
              <h3 className="text-2xl sm:text-4xl font-heading font-bold tracking-normal text-slate-900 leading-tight">
                Snap a photo of your bill, InvoicerAI takes care of the rest.
              </h3>
              <p className="text-slate-700 font-hand text-base sm:text-lg leading-relaxed">
                Whether it's a printed vendor invoice or a handwritten paper slip, just snap and upload a photo. The AI backend instantly itemizes every product, rate, discount, and tax directly onto your screen.
              </p>
              <ul className="space-y-2.5 pt-2 text-base font-hand font-bold text-slate-800">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>Real-time live progress updates without refreshing the page</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>Automatic duplicate invoice detection to prevent costly mistakes</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Row 2: AI Chat (Text left, Illustration right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-6 space-y-4">
              <span className="font-heading text-sm font-bold text-blue-700 bg-blue-100 border-2 border-blue-600 px-3 py-0.5 border-doodle-pill inline-block rotate-1">
                02. Conversational Business AI
              </span>
              <h3 className="text-2xl sm:text-4xl font-heading font-bold tracking-normal text-slate-900 leading-tight">
                Ask anything about your store's sales and inventory.
              </h3>
              <p className="text-slate-700 font-hand text-base sm:text-lg leading-relaxed">
                "What were this month's total sales?", "Which products are selling the fastest?", or "Show me Sharma Ji's recent bills". Our AI assistant answers in seconds directly from your confirmed records.
              </p>
              <ul className="space-y-2.5 pt-2 text-base font-hand font-bold text-slate-800">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0" />
                  <span>Verified database queries — no inaccurate or hallucinated calculations</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0" />
                  <span>Live streaming responses sourced directly from your store's verified ledger</span>
                </li>
              </ul>
            </div>
            <div className="md:col-span-6 relative">
              <div className="bg-white border-2 border-slate-900 border-doodle p-6 shadow-doodle-lg space-y-4 relative rotate-1 hover:rotate-0 transition-transform">
                <DoodleTape color="red" rotate="-rotate-1" className="top-[-10px] left-8 w-24 h-5" />
                <div className="flex items-center justify-between border-b-2 border-slate-900 border-dashed pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-red-600" />
                    <span className="font-heading text-sm font-bold uppercase tracking-wider text-slate-900">
                      Store Assistant
                    </span>
                  </div>
                  <span className="font-heading text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-400 border-doodle-sm">
                    AI Active ✨
                  </span>
                </div>

                <div className="space-y-3 font-hand text-sm">
                  {/* User bubble in blue ink style */}
                  <div className="p-3 bg-blue-50 border-2 border-blue-600 rounded-2xl rounded-tr-sm ml-auto max-w-[85%] text-blue-950 font-bold shadow-[2px_2px_0px_#2563eb]">
                    "What were our total sales this month and the top 3 items?"
                  </div>
                  {/* Bot bubble in red/slate pen style */}
                  <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl rounded-tl-sm mr-auto max-w-[92%] text-slate-900 space-y-2 shadow-doodle">
                    <p className="font-heading font-bold text-slate-900 text-sm">
                      Here is your store summary (November 2024):
                    </p>
                    <p>
                      • Total sales:{' '}
                      <span className="font-heading font-bold text-red-600 bg-yellow-200 px-1.5 py-0.5 border border-slate-900 border-doodle-sm">
                        ₹84,250.00
                      </span>{' '}
                      (28 confirmed bills)
                    </p>
                    <p>• Top items: Basmati Rice (₹22,100), Refined Oil (₹18,400), Sugar (₹9,200)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Invoice History (Illustration left, Text right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-6 order-2 md:order-1 relative">
              <div className="bg-white border-2 border-slate-900 border-doodle p-6 shadow-doodle-lg space-y-3 relative -rotate-1 hover:rotate-0 transition-transform">
                <DoodleTape color="yellow" rotate="rotate-1" className="top-[-10px] right-8 w-28 h-5" />
                <div className="flex items-center justify-between border-b-2 border-slate-900 border-dashed pb-3">
                  <span className="font-heading text-base font-bold uppercase tracking-wider text-slate-900">
                    Digital Ledger (Khata)
                  </span>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 border border-blue-500 px-2 py-0.5 border-doodle-sm">
                    28 Invoices
                  </span>
                </div>
                <div className="space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 border-doodle-sm">
                    <div>
                      <p className="font-heading font-bold text-sm text-slate-900">Rajesh Kirana Store</p>
                      <p className="text-[11px] font-hand text-slate-500">22 Nov • 5 items</p>
                    </div>
                    <span className="font-heading font-bold text-base text-blue-700">₹3,420.00</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 border border-red-200 border-doodle-sm">
                    <div>
                      <p className="font-heading font-bold text-sm text-slate-900">Gupta Provisions</p>
                      <p className="text-[11px] font-hand text-slate-500">20 Nov • 8 items</p>
                    </div>
                    <span className="font-heading font-bold text-base text-red-600">₹7,890.00</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-6 space-y-4 order-1 md:order-2">
              <span className="font-heading text-sm font-bold text-red-600 bg-red-100 border-2 border-red-600 px-3 py-0.5 border-doodle-pill inline-block -rotate-1">
                03. Past Invoice Records
              </span>
              <h3 className="text-2xl sm:text-4xl font-heading font-bold tracking-normal text-slate-900 leading-tight">
                Never worry about lost paper receipts or fading ink again.
              </h3>
              <p className="text-slate-700 font-hand text-base sm:text-lg leading-relaxed">
                All your confirmed bills are securely organized by date, customer name, and amount. Look up any customer's previous purchase in seconds whenever you need it.
              </p>
              <ul className="space-y-2.5 pt-2 text-base font-hand font-bold text-slate-800">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>Clean separation between Draft and Confirmed invoices</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>Original receipt image always linked directly to the itemized record</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works strip */}
      <section id="how-it-works" className="py-20 bg-transparent border-y-2 border-slate-900 border-dashed px-4 sm:px-6 relative">
        <div className="max-w-6xl mx-auto">
          {/* Main Section Heading */}
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-5xl font-heading font-bold tracking-normal text-slate-900 mb-3 relative inline-block">
              How It Works
              <DoodleUnderline className="absolute -bottom-2 left-1/4 w-1/2 h-3 text-red-600" />
            </h2>
            <p className="text-base sm:text-lg font-hand text-slate-700">Digitize your store accounting in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white p-7 border-2 border-slate-900 border-doodle shadow-doodle hover:-translate-y-1 transition-transform relative">
              <DoodleTape color="blue" className="top-[-10px] left-1/2 -translate-x-1/2 w-20 h-4" />
              <div className="w-12 h-12 bg-blue-600 text-white font-marker text-2xl font-bold flex items-center justify-center mb-4 border-2 border-slate-900 shadow-doodle border-doodle -rotate-3">
                1
              </div>
              <h3 className="text-2xl font-heading font-bold text-slate-900 mb-2">Snap Photo</h3>
              <p className="text-sm font-hand text-slate-700 leading-relaxed">
                Simply snap a photo of any printed bill or paper slip. AI extracts all item details in seconds.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-7 border-2 border-slate-900 border-doodle shadow-doodle hover:-translate-y-1 transition-transform relative">
              <DoodleTape color="red" className="top-[-10px] left-1/2 -translate-x-1/2 w-20 h-4" />
              <div className="w-12 h-12 bg-red-600 text-white font-marker text-2xl font-bold flex items-center justify-center mb-4 border-2 border-slate-900 shadow-doodle border-doodle rotate-3">
                2
              </div>
              <h3 className="text-2xl font-heading font-bold text-slate-900 mb-2">Review & Verify</h3>
              <p className="text-sm font-hand text-slate-700 leading-relaxed">
                Review extracted items and prices on screen. Edit any detail if needed and tap confirm.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-7 border-2 border-slate-900 border-doodle shadow-doodle hover:-translate-y-1 transition-transform relative">
              <DoodleTape color="yellow" className="top-[-10px] left-1/2 -translate-x-1/2 w-20 h-4" />
              <div className="w-12 h-12 bg-slate-900 text-yellow-300 font-marker text-2xl font-bold flex items-center justify-center mb-4 border-2 border-slate-900 shadow-doodle border-doodle -rotate-2">
                3
              </div>
              <h3 className="text-2xl font-heading font-bold text-slate-900 mb-2">Ask AI</h3>
              <p className="text-sm font-hand text-slate-700 leading-relaxed">
                Ask your AI assistant anytime about shop revenue, best-selling items, or past customer bills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Warm CTA */}
      <section className="py-20 px-4 sm:px-6 bg-blue-600 text-white border-b-2 border-slate-900 relative overflow-hidden">
        {/* Playful doodle elements in CTA background */}
        <DoodleStar className="absolute top-8 left-12 w-10 h-10 text-yellow-300 rotate-12 opacity-80" />
        <DoodleSparkle className="absolute bottom-10 right-16 w-8 h-8 text-yellow-300 opacity-80" />
        <DoodlePaperPlane className="absolute top-1/4 right-1/4 w-12 h-12 text-white opacity-40 rotate-45" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          {/* Main Section Heading preserved */}
          <h2 className="text-3xl sm:text-5xl font-heading font-bold tracking-normal text-white leading-tight">
            Aaj hi apni dukaan ka hisaab aasaan banayein.
          </h2>
          <p className="text-lg sm:text-xl font-hand text-blue-100 max-w-xl mx-auto">
            Save hours on manual bookkeeping and focus on growing your business. Create your free account today.
          </p>
          <div className="pt-3 flex flex-col items-center gap-2">
            <Link to="/register">
              <Button
                variant="primary"
                size="lg"
                className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-heading text-xl font-bold border-2 border-slate-900 shadow-[5px_5px_0px_#0f172a] px-10 py-4 border-doodle hover:scale-105 active:scale-95 transition-all"
              >
                Get Started Now — It's Free
              </Button>
            </Link>
            <span className="font-scribble text-yellow-200 text-lg font-bold">
              No setup fees! Completely free and instant onboarding ✨
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 bg-white border-t-2 border-slate-900 text-sm font-hand text-slate-700">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-600" />
            <span className="font-heading font-bold text-slate-900 text-base">InvoicerAI</span>
            <span>— Smart Store Accounting, Made Simple.</span>
          </div>
          <div className="flex items-center gap-6 font-doodle font-bold">
            <Link to="/login" className="text-slate-800 hover:text-red-600 hover:underline decoration-wavy">
              Login
            </Link>
            <Link to="/register" className="text-blue-700 hover:text-red-600 hover:underline decoration-wavy">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
