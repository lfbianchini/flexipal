import { Link } from "react-router-dom";
import { Sparkles, Heart, Leaf, Star, ChevronDown, HelpCircle, Instagram } from "lucide-react";
import { useState } from "react";

type FAQItem = {
  question: string;
  answer: string;
};

const faqs: FAQItem[] = [
  {
    question: "What is FlexiPal?",
    answer: "FlexiPal is a platform designed for USFCA students to help each other by sharing extra flexi funds and connecting with fellow students. It's a community-driven initiative to ensure no Don goes hungry!"
  },
  {
    question: "How do I become a vendor?",
    answer: "Any USFCA student can become a vendor! Simply sign up, verify your student email, and use the Vendor Dashboard to go live when you're ready to share your extra flexi funds."
  },
  {
    question: "Is FlexiPal safe to use?",
    answer: "Yes! We prioritize safety by requiring USF email verification, implementing secure chat features, and maintaining user privacy. All transactions and interactions are between verified USFCA students only."
  },
  {
    question: "How does the chat system work?",
    answer: "Once you find a vendor, you can start a private chat with them through our secure messaging system. Discuss meeting locations, timing, and any other details in a safe, campus-focused environment."
  },
  {
    question: "Can I use FlexiPal on my phone?",
    answer: "Absolutely! FlexiPal is fully mobile-responsive and works great on all devices. Access it through your phone's web browser - no app download required!"
  }
];

const FAQItem = ({ question, answer }: FAQItem) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/20 last:border-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between gap-4 text-left transition-colors hover:text-usfgreen-light group"
      >
        <span className="font-medium text-usfgreen group-hover:text-usfgreen-light transition-colors">{question}</span>
        <ChevronDown 
          className={`text-usfgold transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`} 
          size={20} 
        />
      </button>
      <div
        style={{ 
          height: isOpen ? 'auto' : 0,
          visibility: isOpen ? 'visible' : 'hidden'
        }}
        className="transform-gpu transition-transform duration-200 ease-out origin-top"
      >
        <div 
          className={`transition-all duration-200 ease-out ${
            isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
        >
          <p className="text-gray-600 text-sm leading-relaxed pb-4">{answer}</p>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <div className="flex flex-col items-center justify-center px-2 pt-6 pb-16 min-h-[calc(100vh-70px)] bg-gradient-to-br from-[#fbed96] via-[#E5DEFF] to-[#abecd6] animate-fade-in">
      <div className="relative max-w-xl w-full mx-auto rounded-3xl shadow-card px-6 md:px-12 py-10 flex flex-col items-center gap-7 bg-white/90 border-2 border-white overflow-hidden">
        {/* Sparkles at top */}
        <Sparkles className="absolute top-6 left-6 text-usfgold opacity-80 animate-fade-in" size={32} />
        <Leaf className="absolute top-7 right-8 text-usfgreen opacity-60 animate-fade-in" size={28} />
        
        {/* Hero "circle" or mascot */}
        <div className="flex justify-center items-center z-10 mb-2">
          <div className="relative bg-gradient-to-tl from-[#abecd6] via-[#FFF6D1] to-[#e5deff] shadow-xl rounded-full h-32 w-32 flex items-center justify-center border-4 border-usfgold animate-scale-in">
            <Heart className="text-usfgreen" size={50} />
            <span className="absolute -top-3 -right-3 bg-usfgold p-1.5 rounded-full shadow animate-bounce">
              <Star className="text-white" size={22} />
            </span>
          </div>
        </div>

        {/* Welcoming Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-usfgreen text-center drop-shadow-lg">
          Welcome to <span className="inline-block animate-pulse bg-gradient-to-r from-usfgold to-usfgreen bg-clip-text text-transparent whitespace-nowrap">FlexiPal!</span>
        </h1>
        
        {/* Tagline */}
        <div className="flex flex-col items-center mt-1 mb-2 space-y-0.5">
          <p className="text-xl md:text-2xl font-medium text-usfgreen/80 text-center">
            USF students, lend a hand (or funds) to a fellow Don!
          </p>
          <span className="inline-flex items-center text-lg font-semibold italic text-usfgold -mt-1">
            <Sparkles size={19} className="mr-1" />
            "One tap at a time."
          </span>
        </div>

        {/* Callouts */}
        <div className="flex flex-wrap gap-4 justify-center mt-3 mb-3">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-usfgold/20 text-usfgreen text-sm font-semibold shadow-sm">
            <Leaf size={18} /> Share kindness
          </span>
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-usfgreen/10 text-usfgreen text-sm font-semibold shadow-sm">
            <Heart size={18} /> Support each other
          </span>
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-usfgold/30 text-usfgreen text-sm font-semibold shadow-sm">
            <Star size={17} /> Make campus brighter
          </span>
        </div>

        {/* FAQ Section */}
        <div className="w-full mt-8 relative">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="text-usfgold" size={24} />
            <h2 className="text-xl font-bold text-usfgreen">Frequently Asked Questions</h2>
          </div>
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white shadow-sm">
            {faqs.map((faq, index) => (
              <FAQItem key={index} {...faq} />
            ))}
          </div>
        </div>

                {/* Social Media Section */}
                <div className="w-full relative">
          <div className="flex flex-col items-center gap-3">
            <h2 className="text-xl font-bold text-usfgreen flex items-center gap-2">
              Check us out!
            </h2>
            <a
              href="https://instagram.com/flexi_pal"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-usfgold/20 to-usfgreen/20 hover:from-usfgold/30 hover:to-usfgreen/30 transition-all duration-300 text-usfgreen font-medium shadow-sm border border-white/50"
            >
              <Instagram className="text-usfgold group-hover:scale-110 transition-transform" size={20} />
              <span className="group-hover:text-usfgreen-light transition-colors">@flexi_pal</span>
            </a>
          </div>
        </div>

        {/* Friendly sign-off or bottom icon */}
        <span className="pt-5 text-usfgreen/60 text-xs flex items-center gap-1 tracking-wide z-10">
          <span>made with</span>
          <Heart className="text-[#FF4477]" size={15} />
          <a 
            href="https://www.linkedin.com/in/luca-bianchini-650923288/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-usfgreen transition-colors duration-200 hover:underline decoration-usfgold/50 underline-offset-2"
          >
            <span>by luca bianchini</span>
          </a>
        </span>
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-usfgold/40 via-[#fbed96] to-[#abecd6]/70 rounded-full blur-2xl opacity-80 pointer-events-none"></div>
        <div className="absolute -top-8 -right-10 w-24 h-24 bg-gradient-to-br from-[#abecd6]/50 via-[#e5deff]/70 to-usfgold/40 rounded-full blur-2xl opacity-80 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default Index;
